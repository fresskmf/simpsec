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
 * ─── Auth flow (OAuth 2.0 Username–Password) ────────────────────────────────
 *  1. POST to https://login.salesforce.com/services/oauth2/token
 *     with grant_type=password + Connected App credentials + user credentials
 *  → Salesforce returns { access_token, instance_url, ... }
 *
 *  2. POST to {instance_url}/services/data/v59.0/sobjects/Lead/
 *     with Bearer token in Authorization header
 *  → Salesforce creates the Lead and returns { id, success }
 *
 *  3. If pulse data is present, POST to .../sobjects/Pulse_Check__c/
 *     linked to the new Lead's Id
 * ────────────────────────────────────────────────────────────────────────────
 *
 * Environment variables required (never committed — see .env.example):
 *   SF_CLIENT_ID       — Connected App Consumer Key
 *   SF_CLIENT_SECRET   — Connected App Consumer Secret
 *   SF_USERNAME        — Salesforce API user login email
 *   SF_PASSWORD        — Salesforce API user password
 *   SF_SECURITY_TOKEN  — Salesforce security token for the API user
 *   ALLOWED_ORIGIN     — (optional) CORS origin, defaults to simpsec.wasmer.app
 */

const https = require('https');
const querystring = require('querystring');

// ─── Rate limiter ─────────────────────────────────────────────────────────────
// Simple sliding-window limiter using a module-scope Map.
// Works because Vercel keeps function instances warm between invocations.
// Not perfectly accurate across multiple concurrent instances, but more than
// sufficient for a low-traffic inquiry form.

const RATE_LIMIT_MAX      = 5;               // max submissions per window
const RATE_LIMIT_WINDOW   = 60 * 60 * 1000; // 1 hour in ms

// Map<ip, number[]> — stores timestamps of recent requests per IP
const rateLimitStore = new Map();

/**
 * Returns true if the IP has exceeded the rate limit.
 * Also prunes expired timestamps to keep memory bounded.
 */
function isRateLimited(ip) {
  const now  = Date.now();
  const hits = (rateLimitStore.get(ip) || []).filter(t => now - t < RATE_LIMIT_WINDOW);

  if (hits.length >= RATE_LIMIT_MAX) {
    rateLimitStore.set(ip, hits); // keep pruned list
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
    const options = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'POST',
      headers,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── Step 1: Obtain a short-lived Salesforce access token ────────────────────

/**
 * Uses the Username–Password OAuth flow to get a bearer token.
 * The password + security token must be concatenated (no separator).
 *
 * Returns { accessToken, instanceUrl }
 */
async function getSalesforceToken() {
  // Validate that all required env vars are present before making a network call
  const required = ['SF_CLIENT_ID', 'SF_CLIENT_SECRET', 'SF_USERNAME', 'SF_PASSWORD', 'SF_SECURITY_TOKEN'];
  for (const key of required) {
    if (!process.env[key]) throw new Error(`Missing env var: ${key}`);
  }

  const body = querystring.stringify({
    grant_type:    'password',
    client_id:     process.env.SF_CLIENT_ID,
    client_secret: process.env.SF_CLIENT_SECRET,
    username:      process.env.SF_USERNAME,
    // Salesforce requires password and security token concatenated with no separator
    password:      process.env.SF_PASSWORD + process.env.SF_SECURITY_TOKEN,
  });

  const loginUrl = process.env.SF_LOGIN_URL || 'https://login.salesforce.com';
  const { statusCode, body: raw } = await httpsPost(
    `${loginUrl}/services/oauth2/token`,
    {
      'Content-Type':   'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(body),
    },
    body
  );

  if (statusCode !== 200) {
    // Log the full error server-side but never expose it to the client
    console.error('[/api/lead] Salesforce auth error:', raw);
    throw new Error(`Salesforce authentication failed (HTTP ${statusCode})`);
  }

  const json = JSON.parse(raw);
  return { accessToken: json.access_token, instanceUrl: json.instance_url };
}

// ─── Step 2: Create the Lead record ──────────────────────────────────────────

/**
 * POSTs a Lead object to the Salesforce REST API.
 * Returns the new Lead's Id string.
 *
 * @param {string} accessToken
 * @param {string} instanceUrl  — e.g. https://myorg.my.salesforce.com
 * @param {object} leadData     — Salesforce Lead field map
 */
async function createLead(accessToken, instanceUrl, leadData) {
  const body = JSON.stringify(leadData);
  const url  = `${instanceUrl}/services/data/v59.0/sobjects/Lead/`;

  const { statusCode, body: raw } = await httpsPost(
    url,
    {
      Authorization:  `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
    body
  );

  // Salesforce returns 201 Created on success
  if (statusCode !== 201) {
    console.error('[/api/lead] Lead creation error:', raw);
    throw new Error(`Lead creation failed (HTTP ${statusCode})`);
  }

  return JSON.parse(raw).id;
}

// ─── Step 3: Create the Pulse_Check__c record ────────────────────────────────

/**
 * Creates a Pulse_Check__c record linked to the given Lead.
 * Only called when pulse data is present on the submission.
 * Returns the new record's Id.
 *
 * @param {string} accessToken
 * @param {string} instanceUrl
 * @param {object} checkData   — Pulse_Check__c field map
 */
async function createPulseCheck(accessToken, instanceUrl, checkData) {
  const body = JSON.stringify(checkData);
  const url  = `${instanceUrl}/services/data/v59.0/sobjects/Pulse_Check__c/`;

  const { statusCode, body: raw } = await httpsPost(
    url,
    {
      Authorization:    `Bearer ${accessToken}`,
      'Content-Type':   'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
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
  // ── CORS ──────────────────────────────────────────────────────────────────
  const allowedOrigin = process.env.ALLOWED_ORIGIN || 'https://simpsec.wasmer.app';
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle pre-flight request
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Rate limiting ──────────────────────────────────────────────────────────
  // x-forwarded-for is set by Vercel's proxy; fall back to socket address.
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown')
    .split(',')[0].trim();

  if (isRateLimited(ip)) {
    console.warn(`[/api/lead] Rate limit hit for IP: ${ip}`);
    return res.status(429).json({ error: 'Too many submissions. Please try again later.' });
  }

  const {
    firstName,
    lastName,
    email,
    phone,
    company,
    industry,
    interest,
    // Pulse Check metadata (populated by inquiry-pulse.js)
    pulseSource,
    pulseRisk,
    pulseScore,
    pulseGaps,
    pulseAxisRisk,
    // Session UID (populated by inquiry-uid.js)
    inquiryUid,
    // Honeypot — real users never fill this; bots usually do
    website,
  } = req.body;

  // ── Spam protection: honeypot field ───────────────────────────────────────
  // If the hidden "website" field is filled, this is almost certainly a bot.
  // We respond 200 so the bot doesn't retry; no Lead is created.
  if (website) {
    console.warn('[/api/lead] Honeypot triggered — submission silently dropped');
    return res.status(200).json({ success: true });
  }

  // ── Basic required-field validation ───────────────────────────────────────
  if (!firstName || !lastName || !email || !company) {
    return res.status(400).json({ error: 'Missing required fields: firstName, lastName, email, company' });
  }

  // Simple email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  // ── Build Lead Description — brief summary only; full detail on Pulse_Check__c ─
  const descParts = [];
  if (pulseRisk || pulseScore) {
    descParts.push(`Pulse Check: ${pulseRisk || 'n/a'} (score: ${pulseScore || 'n/a'}) — see related Pulse Check record`);
  }
  if (inquiryUid) descParts.push(`Inquiry UID: ${inquiryUid}`);

  try {
    // ── Step 1: Authenticate ───────────────────────────────────────────────
    const { accessToken, instanceUrl } = await getSalesforceToken();

    // ── Step 2: Create Lead ────────────────────────────────────────────────
    const leadId = await createLead(accessToken, instanceUrl, {
      FirstName:   firstName,
      LastName:    lastName,
      Email:       email,
      Phone:       phone    || '',
      Company:     company,
      Industry:    industry || '',
      Description: descParts.join('\n'),
      LeadSource:  'SimpSec Website',
      // Interest__c is a custom field — confirm it exists in your Salesforce org
      // (Setup > Object Manager > Lead > Fields & Relationships)
      Interest__c: interest || '',
    });

    console.log(`[/api/lead] Lead created: ${leadId}`);

    // ── Step 3: Create Pulse_Check__c (only if a quiz was taken) ──────────
    // pulseSource is set by inquiry-pulse.js when localStorage has quiz data.
    // Quiz_Type__c defaults to 'Cyber' — the only quiz currently wired to
    // the inquiry form. Update this when Footprint is connected.
    if (pulseSource) {
      const pulseCheckId = await createPulseCheck(accessToken, instanceUrl, {
        Lead__c:        leadId,
        Quiz_Type__c:   'Cyber',
        Risk_Band__c:   pulseRisk             || null,
        Score__c:       pulseScore            ? parseFloat(pulseScore) : null,
        Top_Gaps__c:    pulseGaps             || '',
        Source_Page__c: pulseSource           || '',
        Taken_At__c:    new Date().toISOString(),
        Axis_Scores__c: pulseAxisRisk         || '',
      });
      console.log(`[/api/lead] Pulse Check created: ${pulseCheckId}`);
    }

    return res.status(200).json({ success: true, leadId });

  } catch (err) {
    // Never expose internal error details (tokens, org URLs) to the browser
    console.error('[/api/lead] Unhandled error:', err.message);
    return res.status(500).json({ error: 'Failed to submit inquiry. Please try again or email us directly.' });
  }
};
