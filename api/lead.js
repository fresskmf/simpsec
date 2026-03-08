/**
 * /api/lead.js
 *
 * Serverless endpoint — receives the SimpSec inquiry form and creates a
 * Salesforce Lead via the REST API.
 *
 * Compatible with Vercel serverless functions (Node.js runtime).
 * Deploy this repo to Vercel and set the environment variables listed in
 * .env.example. The /api directory is picked up automatically.
 *
 * ─── Auth flow (OAuth 2.0 JWT Bearer) ───────────────────────────────────────
 *  1. Build a signed JWT assertion using the Connected App's private key
 *  2. POST to {SF_LOGIN_URL}/services/oauth2/token
 *     with grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer
 *  → Salesforce returns { access_token, instance_url, ... }
 *
 *  3. POST to {instance_url}/services/data/v59.0/sobjects/Lead/
 *     with Bearer token in Authorization header
 *  → Salesforce creates the Lead and returns { id, success }
 *
 *  4. If pulse data is present, POST to .../sobjects/Pulse_Check__c/
 *     linked to the new Lead's Id
 * ────────────────────────────────────────────────────────────────────────────
 *
 * Environment variables required (never committed — see .env.example):
 *   SF_CLIENT_ID   — Connected App Consumer Key
 *   SF_USERNAME    — Salesforce API user login email
 *   SF_PRIVATE_KEY — RSA private key PEM string (include full -----BEGIN/END----- block)
 *   SF_LOGIN_URL   — e.g. https://simpsec.my.salesforce.com (defaults to login.salesforce.com)
 *   ALLOWED_ORIGIN — (optional) CORS origin, defaults to simpsec.wasmer.app
 */

const https       = require('https');
const crypto      = require('crypto');
const querystring = require('querystring');

// ─── Rate limiter ─────────────────────────────────────────────────────────────

const RATE_LIMIT_MAX    = 5;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000;
const rateLimitStore    = new Map();

function isRateLimited(ip) {
  const now  = Date.now();
  const hits = (rateLimitStore.get(ip) || []).filter(t => now - t < RATE_LIMIT_WINDOW);
  if (hits.length >= RATE_LIMIT_MAX) {
    rateLimitStore.set(ip, hits);
    return true;
  }
  hits.push(now);
  rateLimitStore.set(ip, hits);
  return false;
}

// ─── Utility: promisified HTTPS POST ─────────────────────────────────────────

function httpsPost(url, headers, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request(
      { hostname: u.hostname, path: u.pathname + u.search, method: 'POST', headers },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── JWT helper ───────────────────────────────────────────────────────────────

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function buildJWT(clientId, username, audience, privateKeyPem) {
  const header  = base64url(JSON.stringify({ alg: 'RS256' }));
  const now     = Math.floor(Date.now() / 1000);
  const payload = base64url(JSON.stringify({ iss: clientId, sub: username, aud: audience, exp: now + 180 }));
  const signing = `${header}.${payload}`;
  const sign    = crypto.createSign('RSA-SHA256');
  sign.update(signing);
  const sig = sign.sign(privateKeyPem, 'base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  return `${signing}.${sig}`;
}

// ─── Step 1: Obtain a short-lived Salesforce access token (JWT Bearer) ────────

async function getSalesforceToken() {
  const required = ['SF_CLIENT_ID', 'SF_USERNAME', 'SF_PRIVATE_KEY'];
  for (const key of required) {
    if (!process.env[key]) throw new Error(`Missing env var: ${key}`);
  }

  const loginUrl   = process.env.SF_LOGIN_URL || 'https://login.salesforce.com';
  const privateKey = process.env.SF_PRIVATE_KEY.replace(/\\n/g, '\n');
  const jwt        = buildJWT(process.env.SF_CLIENT_ID, process.env.SF_USERNAME, loginUrl, privateKey);

  const body = querystring.stringify({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion:  jwt,
  });

  const { statusCode, body: raw } = await httpsPost(
    `${loginUrl}/services/oauth2/token`,
    { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) },
    body
  );

  if (statusCode !== 200) {
    console.error('[/api/lead] Salesforce auth error:', raw);
    throw new Error(`Salesforce authentication failed (HTTP ${statusCode})`);
  }

  const json = JSON.parse(raw);
  return { accessToken: json.access_token, instanceUrl: json.instance_url };
}

// ─── Step 2: Create the Lead record ──────────────────────────────────────────

async function createLead(accessToken, instanceUrl, leadData) {
  const body = JSON.stringify(leadData);
  const url  = `${instanceUrl}/services/data/v59.0/sobjects/Lead/`;

  const { statusCode, body: raw } = await httpsPost(
    url,
    { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    body
  );

  if (statusCode !== 201) {
    console.error('[/api/lead] Lead creation error:', raw);
    throw new Error(`Lead creation failed (HTTP ${statusCode})`);
  }

  return JSON.parse(raw).id;
}

// ─── Step 3: Create the Pulse_Check__c record ────────────────────────────────

async function createPulseCheck(accessToken, instanceUrl, checkData) {
  const body = JSON.stringify(checkData);
  const url  = `${instanceUrl}/services/data/v59.0/sobjects/Pulse_Check__c/`;

  const { statusCode, body: raw } = await httpsPost(
    url,
    { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    body
  );

  if (statusCode !== 201) {
    console.error('[/api/lead] Pulse Check creation error:', raw);
    throw new Error(`Pulse Check creation failed (HTTP ${statusCode})`);
  }

  return JSON.parse(raw).id;
}

// ─── Main handler ─────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || 'https://simpsec.wasmer.app';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Method not allowed' });

  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown')
    .split(',')[0].trim();

  if (isRateLimited(ip)) {
    console.warn(`[/api/lead] Rate limit hit for IP: ${ip}`);
    return res.status(429).json({ error: 'Too many submissions. Please try again later.' });
  }

  const {
    firstName, lastName, email, phone, company, industry, interest,
    pulseSource, pulseRisk, pulseScore, pulseGaps, pulseAxisRisk,
    inquiryUid, website,
  } = req.body;

  if (website) {
    console.warn('[/api/lead] Honeypot triggered — submission silently dropped');
    return res.status(200).json({ success: true });
  }

  if (!firstName || !lastName || !email || !company) {
    return res.status(400).json({ error: 'Missing required fields: firstName, lastName, email, company' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  const descParts = [];
  if (pulseRisk || pulseScore) {
    descParts.push(`Pulse Check: ${pulseRisk || 'n/a'} (score: ${pulseScore || 'n/a'}) — see related Pulse Check record`);
  }
  if (inquiryUid) descParts.push(`Inquiry UID: ${inquiryUid}`);

  try {
    const { accessToken, instanceUrl } = await getSalesforceToken();

    const leadId = await createLead(accessToken, instanceUrl, {
      FirstName:   firstName,
      LastName:    lastName,
      Email:       email,
      Phone:       phone    || '',
      Company:     company,
      Industry:    industry || '',
      Description: descParts.join('\n'),
      LeadSource:  'SimpSec Website',
      Interest__c: interest || '',
    });

    console.log(`[/api/lead] Lead created: ${leadId}`);

    if (pulseSource) {
      const pulseCheckId = await createPulseCheck(accessToken, instanceUrl, {
        Lead__c:        leadId,
        Quiz_Type__c:   'Cyber',
        Risk_Band__c:   pulseRisk   || null,
        Score__c:       pulseScore  ? parseFloat(pulseScore) : null,
        Top_Gaps__c:    pulseGaps   || '',
        Source_Page__c: pulseSource || '',
        Taken_At__c:    new Date().toISOString(),
        Axis_Scores__c: pulseAxisRisk || '',
      });
      console.log(`[/api/lead] Pulse Check created: ${pulseCheckId}`);
    }

    return res.status(200).json({ success: true, leadId });

  } catch (err) {
    console.error('[/api/lead] Unhandled error:', err.message);
    return res.status(500).json({ error: 'Failed to submit inquiry. Please try again or email us directly.' });
  }
};
