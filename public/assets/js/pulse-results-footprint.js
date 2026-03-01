/* SimpSec Pulse Results — Digital Footprint
   TODO: Fill in GAP_COPY and EXPERIENCE_BY_RISK_AXES once quiz questions are finalized.
   - Reads results from localStorage (simpsec_pulse_footprint_v1)
   - Populates exposure, band, priorities, radar chart (responsive)
   - Right-side slider with arrows + dots
   - Radar has slow pulsing glow
*/

const STORAGE_KEY = 'simpsec_pulse_footprint_v1';

let radarPulsePhase = 0;
let radarPulseRAF = null;

/* -----------------------
   Helpers
------------------------ */
function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function buildEmailBody(result) {
  const lines = [];
  lines.push('SimpSec Digital Footprint Pulse Check Results');
  lines.push('');
  lines.push(`Risk: ${result.band}`);
  lines.push(`Exposure: ${result.score}%`);
  lines.push('');

  lines.push('Top priorities:');
  (result.topGaps || []).forEach((g, i) => lines.push(`${i + 1}. ${g.gap} (${g.category})`));

  lines.push('');
  lines.push('Axis exposure:');
  Object.entries(result.axisRisk || {}).forEach(([k, v]) => lines.push(`- ${k}: ${v}%`));

  return lines.join('\n');
}

function setList(el, items) {
  if (!el) return;
  el.innerHTML = '';
  (items || []).forEach((txt) => {
    const li = document.createElement('li');
    li.textContent = txt;
    el.appendChild(li);
  });
}

/* -----------------------
   Gap-driven copy
   TODO: Populate once quiz questions are finalized.
------------------------ */
const GAP_COPY = {
  'Password reuse is common': {
    insight: 'Reusing passwords means one breach can compromise all your accounts.',
    action: 'We help you set up a password manager and secure every account individually.',
  },
  'Password reuse is occasional': {
    insight: 'Even occasional reuse creates a chain — one leaked password can unlock others.',
    action: 'We identify shared passwords and help you replace them safely.',
  },
  'Social profiles are fully public': {
    insight: 'Public profiles give attackers personal details used in targeted scams.',
    action: 'We review your social exposure and tighten privacy settings.',
  },
  'Social exposure is partial': {
    insight: 'Partial exposure still provides enough info for targeted phishing.',
    action: 'We audit which accounts are public and recommend what to lock down.',
  },
  'Devices are unlocked and unprotected': {
    insight: 'An unlocked device hands full access to anyone who picks it up.',
    action: 'We configure device locks and encryption so your data stays protected.',
  },
  'Device lock is inconsistent': {
    insight: 'Inconsistent locks mean some devices are a single grab away from exposure.',
    action: 'We standardize device security across all your personal devices.',
  },
  'App permissions are overly broad': {
    insight: 'Overly permissive apps can access your location, contacts, and camera silently.',
    action: 'We audit your app permissions and remove unnecessary access.',
  },
  'App permissions are unclear': {
    insight: 'Unknown permissions often mean apps have more access than you realize.',
    action: 'We review your installed apps and simplify permissions.',
  },
  'Credentials have been exposed in a breach': {
    insight: 'Exposed credentials can be used to access accounts years after the breach.',
    action: 'We identify affected accounts and get you secured with fresh credentials.',
  },
  'Breach exposure is unknown': {
    insight: 'Not knowing if you\'ve been breached is as risky as knowing and doing nothing.',
    action: 'We run a breach check and help you act on anything that comes up.',
  },
  'Personal files have no backup': {
    insight: 'Without a backup, a single device failure means permanent data loss.',
    action: 'We set up automatic backups so your files are safe without thinking about it.',
  },
  'Personal backups are inconsistent': {
    insight: 'Inconsistent backups usually means the most recent files are the most at risk.',
    action: 'We automate your backup process so it happens without manual effort.',
  },
};

function renderInsightAndActions(result) {
  const insightEl = document.getElementById('prInsight');
  const actionEl = document.getElementById('prWhatWeDo');
  if (!insightEl || !actionEl) return;

  insightEl.innerHTML = '';
  actionEl.innerHTML = '';

  const used = new Set();
  const gaps = (result.topGaps || []).slice(0, 3);

  gaps.forEach((g) => {
    const map = GAP_COPY[g.gap];
    if (!map) return;
    if (used.has(g.gap)) return;
    used.add(g.gap);

    const li1 = document.createElement('li');
    li1.textContent = map.insight;
    insightEl.appendChild(li1);

    const li2 = document.createElement('li');
    li2.textContent = map.action;
    actionEl.appendChild(li2);
  });

  if (!insightEl.children.length) {
    setList(insightEl, ['Your personal security habits are solid, with only minor gaps.']);
    setList(actionEl, ['We help keep your personal data protected as threats evolve.']);
  }
}

/* -----------------------
   "You May Have Experienced This"
   TODO: Populate once quiz questions are finalized.
------------------------ */
const EXPERIENCE_BY_RISK_AXES = {
  Low: [
    { axis: 'Passwords', text: 'Forgetting which password goes with which account' },
    { axis: 'Social', text: 'Getting a friend request from someone you already know' },
    { axis: 'Devices', text: 'A device being slow and not knowing why' },
    { axis: 'Privacy', text: 'Ads following you around that feel too personal' },
    { axis: 'Identity', text: 'Getting a password reset email you did not request' },
    { axis: 'Data', text: 'A file being lost when a device was replaced' },
  ],
  Medium: [
    { axis: 'Passwords', text: 'An account being locked after suspicious login attempts' },
    { axis: 'Social', text: 'A social profile being impersonated or cloned' },
    { axis: 'Devices', text: 'Personal photos being accessible when a phone was lost' },
    { axis: 'Privacy', text: 'Location data being shared without knowing it' },
    { axis: 'Identity', text: 'Personal info showing up in a data breach notification' },
    { axis: 'Data', text: 'Files being lost after a phone or laptop broke' },
  ],
  High: [
    { axis: 'Passwords', text: 'An account being accessed by someone else' },
    { axis: 'Social', text: 'Messages being sent from your account without your knowledge' },
    { axis: 'Identity', text: 'Unauthorized activity appearing on a financial account' },
    { axis: 'Devices', text: 'Sensitive data being exposed after a device was stolen' },
    { axis: 'Privacy', text: 'Personal details used in a targeted scam or phishing attempt' },
    { axis: 'Data', text: 'Important personal files lost permanently with no recovery option' },
  ],
  Extreme: [
    { axis: 'Identity', text: 'Identity theft requiring significant time and effort to resolve' },
    { axis: 'Passwords', text: 'Multiple accounts compromised from a single password breach' },
    { axis: 'Social', text: 'Reputation damage from an account takeover' },
    { axis: 'Data', text: 'Years of personal data lost with no backup to restore from' },
    { axis: 'Privacy', text: 'Personal location or routine information used by someone with bad intent' },
    { axis: 'Devices', text: 'A device used as an entry point into business or financial accounts' },
  ],
};

function renderExperienceSectionSorted(result) {
  const card = document.getElementById('prExperienceCard');
  const list = document.getElementById('prExperienceList');
  if (!card || !list || !result) return;

  const band = result.band || 'Medium';
  const pool = EXPERIENCE_BY_RISK_AXES[band] || EXPERIENCE_BY_RISK_AXES.Medium;

  const axisRisk = result.axisRisk || {};
  const axisOrder = Object.keys(axisRisk).sort((a, b) => (axisRisk[b] || 0) - (axisRisk[a] || 0));

  const picked = [];
  const used = new Set();

  axisOrder.forEach((axis) => {
    pool.forEach((item) => {
      if (picked.length >= 6) return;
      if (item.axis !== axis) return;
      if (used.has(item.text)) return;
      used.add(item.text);
      picked.push(item.text);
    });
  });

  pool.forEach((item) => {
    if (picked.length >= 6) return;
    if (used.has(item.text)) return;
    used.add(item.text);
    picked.push(item.text);
  });

  if (!picked.length) {
    list.innerHTML = '';
    card.style.display = 'none';
    return;
  }

  list.innerHTML = '';
  picked.slice(0, 6).forEach((text) => {
    const li = document.createElement('li');
    li.textContent = text;
    list.appendChild(li);
  });

  card.style.display = '';
}

/* -----------------------
   Radar (responsive + pulsing glow)
------------------------ */
function drawRadar(canvas, axisRisk, axesOrder) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const axes =
    Array.isArray(axesOrder) && axesOrder.length ? axesOrder.slice() : Object.keys(axisRisk || {});

  if (!axes.length) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }

  const values = axes.map((a) => Math.max(0, Math.min(100, Number(axisRisk?.[a]) || 0)));

  const parent = canvas.parentElement;
  const cssWidth = Math.max(
    280,
    Math.floor((parent ? parent.clientWidth : canvas.clientWidth) || 600)
  );
  const cssHeight = Math.floor(cssWidth * (520 / 900));

  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(cssWidth * dpr);
  canvas.height = Math.floor(cssHeight * dpr);
  canvas.style.width = cssWidth + 'px';
  canvas.style.height = cssHeight + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const cs = getComputedStyle(document.documentElement);
  const stroke = (cs.getPropertyValue('--theme') || '#75fafa').trim();
  const accent = (cs.getPropertyValue('--accent2') || '#21e4bf').trim();
  const text = (cs.getPropertyValue('--text') || '#CDCDCD').trim();

  const w = cssWidth;
  const h = cssHeight;
  const cx = w / 2;
  const cy = h / 2 + 10;
  const radius = Math.min(w, h) * 0.34;

  ctx.clearRect(0, 0, w, h);

  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = accent;
  for (let r = 1; r <= 4; r++) {
    ctx.beginPath();
    ctx.arc(cx, cy, (radius * r) / 4, 0, Math.PI * 2);
    ctx.stroke();
  }

  const angleStep = (Math.PI * 2) / axes.length;

  ctx.globalAlpha = 0.8;
  ctx.fillStyle = text;
  ctx.font = (w < 420 ? '12px' : '14px') + ' Rubik, sans-serif';

  axes.forEach((label, i) => {
    const ang = -Math.PI / 2 + i * angleStep;
    const x = cx + radius * Math.cos(ang);
    const y = cy + radius * Math.sin(ang);

    ctx.strokeStyle = accent;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.stroke();

    const pad = w < 420 ? 22 : 30;
    const lx = cx + (radius + pad) * Math.cos(ang);
    const ly = cy + (radius + pad) * Math.sin(ang);

    const shift = label.length * (w < 420 ? 3 : 3.4);
    ctx.globalAlpha = 1;
    ctx.fillText(label, lx - shift, ly);
    ctx.globalAlpha = 0.8;
  });

  ctx.save();

  const pulse = (Math.sin(radarPulsePhase) + 1) / 2;
  const baseBlur = w < 420 ? 8 : 12;
  const glowBlur = baseBlur + pulse * (w < 420 ? 4 : 8);
  const glowAlpha = 0.85 + pulse * 0.15;

  ctx.shadowColor = stroke;
  ctx.shadowBlur = glowBlur;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  ctx.globalAlpha = glowAlpha;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  values.forEach((v, i) => {
    const ang = -Math.PI / 2 + i * angleStep;
    const rr = (radius * v) / 100;
    const x = cx + rr * Math.cos(ang);
    const y = cy + rr * Math.sin(ang);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.stroke();

  ctx.shadowBlur = glowBlur * 0.6;
  ctx.globalAlpha = 0.16 + pulse * 0.06;
  ctx.fillStyle = stroke;
  ctx.fill();

  ctx.restore();
  ctx.globalAlpha = 1;
}

/* -----------------------
   Slider (translateX)
------------------------ */
function initResultsSlider() {
  const track = document.getElementById('prSliderTrack');
  if (!track) return;

  const titleEl = document.getElementById('prSlideTitle');
  const prevBtn = document.getElementById('prSlidePrev');
  const nextBtn = document.getElementById('prSlideNext');
  const dotsWrap = document.getElementById('prSlideDots');

  let slides = Array.from(track.querySelectorAll('.pulse-slide'));
  slides = slides.filter((s) => s.style.display !== 'none');

  if (!slides.length) return;

  slides.forEach((s) => {
    s.style.flex = '0 0 100%';
  });

  let idx = 0;

  function apply(i) {
    idx = (i + slides.length) % slides.length;

    if (titleEl) {
      titleEl.textContent = slides[idx].getAttribute('data-slide-title') || 'Section';
    }

    track.style.transform = `translateX(-${idx * 100}%)`;

    if (dotsWrap) {
      const dots = Array.from(dotsWrap.querySelectorAll('button'));
      dots.forEach((d, n) => d.classList.toggle('is-active', n === idx));
    }
  }

  if (dotsWrap) {
    dotsWrap.innerHTML = '';
    slides.forEach((_, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.addEventListener('click', () => apply(i));
      dotsWrap.appendChild(b);
    });
  }

  if (prevBtn) prevBtn.addEventListener('click', () => apply(idx - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => apply(idx + 1));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') apply(idx - 1);
    if (e.key === 'ArrowRight') apply(idx + 1);
  });

  apply(idx);
}

/* -----------------------
   Radar Pulse
------------------------ */
function startRadarPulse(canvas, axisRisk, axesOrder) {
  if (!canvas) return;
  if (radarPulseRAF) cancelAnimationFrame(radarPulseRAF);

  function tick() {
    radarPulsePhase += 0.02;
    drawRadar(canvas, axisRisk, axesOrder);
    radarPulseRAF = requestAnimationFrame(tick);
  }

  tick();
}

/* -----------------------
   Init
------------------------ */
function init() {
  const el = {
    summary: document.getElementById('prSummary'),
    riskTitle: document.getElementById('prRiskTitle'),
    scoreLine: document.getElementById('prScoreLine'),
    topGaps: document.getElementById('prTopGaps'),
    emailBtn: document.getElementById('prEmailBtn'),
    inquiryBtn: document.getElementById('prInquiryBtn'),
    radar: document.getElementById('prRadar'),
  };

  const result = safeParse(localStorage.getItem(STORAGE_KEY));

  if (!result) {
    if (el.summary) el.summary.textContent = 'No results found. Take the Pulse Check first.';
    if (el.riskTitle) el.riskTitle.textContent = "You're At Risk";
    if (el.scoreLine) el.scoreLine.textContent = '0% exposed';
    if (el.topGaps) el.topGaps.innerHTML = '<li>Go back and complete the pulse check.</li>';
    return;
  }

  const exposed = Math.max(0, Math.min(100, Number(result.score) || 0));

  if (el.summary) {
    el.summary.textContent = `You're at ${String(
      result.band || ''
    ).toLowerCase()} risk based on ${result.topGaps ? result.topGaps.length + ' signals' : 'a few quick signals'}.`;
  }
  if (el.riskTitle) el.riskTitle.textContent = `You're At ${result.band} Risk`;
  if (el.scoreLine) el.scoreLine.textContent = `${exposed}% exposed`;

  if (el.topGaps) {
    el.topGaps.innerHTML = '';
    const gaps = result.topGaps || [];
    if (!gaps.length) {
      el.topGaps.innerHTML = '<li>No major gaps flagged.</li>';
    } else {
      gaps.forEach((g) => {
        const li = document.createElement('li');
        li.textContent = `${g.gap} (${g.category})`;
        el.topGaps.appendChild(li);
      });
    }
  }

  renderInsightAndActions(result);
  renderExperienceSectionSorted(result);

  const axesOrder = Array.isArray(result.axesOrder) ? result.axesOrder : null;

  startRadarPulse(el.radar, result.axisRisk || {}, axesOrder);
  window.addEventListener('resize', () => drawRadar(el.radar, result.axisRisk || {}, axesOrder));

  if (el.emailBtn) {
    el.emailBtn.addEventListener('click', () => {
      const subject = encodeURIComponent('My SimpSec Digital Footprint Pulse Check Results');
      const body = encodeURIComponent(buildEmailBody(result));
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
    });
  }

  if (el.inquiryBtn) {
    const gapsStr = (result.topGaps || []).map((g) => g.gap).join(', ');
    const qp = new URLSearchParams();
    qp.set('source', 'footprint-pulse');
    qp.set('risk', result.band);
    qp.set('score', String(exposed));
    qp.set('gaps', gapsStr);
    el.inquiryBtn.href = `inquiry.html?${qp.toString()}`;
  }

  initResultsSlider();
}

document.addEventListener('DOMContentLoaded', init);
