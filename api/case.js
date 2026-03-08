/**
 * /api/case.js
 *
 * Serverless endpoint — receives the SimpSec support contact form and creates a
 * Salesforce Case via the REST API.
 *
 * Compatible with Vercel serverless functions (Node.js runtime).
 * Uses the same Connected App and environment variables as /api/lead.js.
 *
 * ─── Auth flow (OAuth 2.0 JWT Bearer) ───────────────────────────────────────
 *  1. Build a signed JWT assertion using the Connected App's private key
 *  2. POST to {SF_LOGIN_URL}/services/oauth2/token
 *  → Salesforce returns { access_token, instance_url }
 *
 *  3. POST to {instance_url}/services/data/v59.0/sobjects/Case/
 *  → Salesforce creates the Case and returns { id, success }
 * ────────────────────────────────────────────────────────────────────────────
 *
 * Environment variables (same as /api/lead.js — no new config needed):
 *   SF_CLIENT_ID   — Connected App Consumer Key
 *   SF_USERNAME    — Salesforce API user login email
 *   SF_PRIVATE_KEY — RSA private key PEM string (base64-encoded)
 *   SF_LOGIN_URL   — e.g. https://simpsec.my.salesforce.com
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
    const u   = new URL(url);
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
  const header    = base64url(JSON.stringify({ alg: 'RS256' }));
  const now       = Math.floor(Date.now() / 1000);
  const payload   = base64url(JSON.stringify({ iss: clientId, sub: username, aud: audience, exp: now + 180 }));
  const signing   = `${header}.${payload}`;
  const keyObject = crypto.createPrivateKey({ key: privateKeyPem, format: 'pem' });
  const sign      = crypto.createSign('RSA-SHA256');
  sign.update(signing);
  const sig = sign.sign(keyObject, 'base64')
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
  const privateKey = Buffer.from(process.env.SF_PRIVATE_KEY, 'base64').toString('utf8');
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
    console.error('[/api/case] Salesforce auth error:', raw);
    throw new Error(`Salesforce authentication failed (HTTP ${statusCode})`);
  }

  const json = JSON.parse(raw);
  return { accessToken: json.access_token, instanceUrl: json.instance_url };
}

// ─── Step 2: Create the Case record ──────────────────────────────────────────

async function createCase(accessToken, instanceUrl, caseData) {
  const body = JSON.stringify(caseData);
  const url  = `${instanceUrl}/services/data/v59.0/sobjects/Case/`;

  const { statusCode, body: raw } = await httpsPost(
    url,
    { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    body
  );

  if (statusCode !== 201) {
    console.error('[/api/case] Case creation error:', raw);
    throw new Error(`Case creation failed (HTTP ${statusCode})`);
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
  if (req.method !== 'POST')    return res.status(405).send('Method not allowed');

  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown')
    .split(',')[0].trim();

  if (isRateLimited(ip)) {
    console.warn(`[/api/case] Rate limit hit for IP: ${ip}`);
    return res.status(429).send('Too many submissions. Please try again later.');
  }

  const { name, phone, email, company, contract_number, subject, affected_service, severity, message } = req.body;

  // Required field validation
  if (!name || !email || !company || !message || !subject || !severity) {
    return res.status(400).send('Please complete all required fields.');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).send('Please enter a valid email address.');
  }

  try {
    const { accessToken, instanceUrl } = await getSalesforceToken();

    const caseId = await createCase(accessToken, instanceUrl, {
      Subject:                 `[${severity}] ${subject} — ${company}`,
      Description:             message,
      Type:                    subject,
      Priority:                severity,
      Origin:                  'Web',
      Status:                  'New',
      // Custom fields
      Name__c:                 name,
      Email__c:                email,
      Phone__c:                phone            || '',
      Company__c:              company,
      MSA_Contract_Number__c:  contract_number  || '',
      Affected_Service__c:     affected_service || '',
    });

    console.log(`[/api/case] Case created: ${caseId}`);
    return res.status(200).send('Thank you! Your support request has been submitted. We\'ll be in touch shortly.');

  } catch (err) {
    console.error('[/api/case] Unhandled error:', err.message);
    return res.status(500).send('Oops! Something went wrong and we couldn\'t submit your request. Please try again or email us directly at support@simpsec.org.');
  }
};
