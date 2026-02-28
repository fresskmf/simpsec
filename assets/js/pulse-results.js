/* SimpSec Pulse Results (FULL SWAP)
   - Reads results from localStorage (simpsec_pulse_result_v2)
   - Populates exposure, band, priorities, radar chart (responsive)
   - Insight + Here's What We Do as dynamic bullet lists based on top gaps
   - "You May Have Experienced This" is dynamic, sorted by highest axis exposure first
   - Right-side slider actually slides (translateX) with arrows + dots
   - Radar has slow pulsing glow
   - No em dashes used
*/

const STORAGE_KEY = 'simpsec_pulse_result_v2';

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
  lines.push('SimpSec Pulse Check Results');
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
------------------------ */
const GAP_COPY = {
  'MFA is missing': {
    insight: 'Accounts without multi factor protection are a common entry point for attackers.',
    action: 'We enforce strong login protection across email and key business tools.',
  },
  'MFA is inconsistent': {
    insight: 'When only some accounts are protected, the weakest login becomes the target.',
    action: 'We standardize login security so protection is consistent everywhere.',
  },
  'Phishing incidents are happening': {
    insight: 'Recent phishing activity means attackers are already testing your team.',
    action: 'We harden email and reduce the chance that a bad message turns into an incident.',
  },
  'Phishing risk is unclear': {
    insight:
      'When phishing risk is unclear, teams usually do not have a consistent reporting habit.',
    action: 'We set a simple process for reporting suspicious messages quickly.',
  },
  'Backup/recovery confidence is low': {
    insight: 'Uncertain recovery plans often turn small incidents into downtime.',
    action: 'We make backups measurable, tested, and easy to restore.',
  },
  'Backups aren’t tested': {
    insight: 'Backups that are not tested often fail at the worst possible time.',
    action: 'We run a quick restore test and document a simple recovery process.',
  },
  'Admin access is unknown': {
    insight: 'Unknown admin access makes it hard to contain problems quickly.',
    action: 'We identify admin accounts and reduce access to the minimum needed.',
  },
  'Admin access needs cleanup': {
    insight: 'Messy admin access increases risk because one compromise can reach more systems.',
    action: 'We clean up privileged access and remove old accounts or roles.',
  },
  'Vendor access isn’t fully controlled': {
    insight: 'Unmanaged vendor access is a common long term weak spot.',
    action: 'We time box vendor access and remove it when the work is done.',
  },
  'Vendor access is unknown': {
    insight: 'When vendor access is unknown, old access often stays longer than intended.',
    action: 'We inventory vendor access and remove anything not actively needed.',
  },
  'Shared accounts are common': {
    insight: 'Shared logins reduce accountability and increase risk if a password leaks.',
    action: 'We move shared tools to named accounts and limit access properly.',
  },
  'Shared logins happen': {
    insight: 'Even occasional shared logins can become normal during busy weeks.',
    action: 'We reduce shared logins by creating individual access where it matters most.',
  },
  'Lost-device response is weak': {
    insight: 'If a device is lost, being able to lock or wipe it quickly matters.',
    action: 'We set up device controls so lost devices can be locked or wiped quickly.',
  },
  'Device control is inconsistent': {
    insight:
      'Inconsistent device control usually means some devices are protected and others are not.',
    action: 'We standardize device security basics across every work device.',
  },
  'Updates aren’t reliably happening': {
    insight: 'Unreliable updates leave known vulnerabilities open longer than necessary.',
    action: 'We enable automatic updates or assign updates to be managed consistently.',
  },
  'Updates aren’t consistent': {
    insight: 'Inconsistent updates usually means exposure varies by device and by employee.',
    action: 'We standardize updates so every device stays current without manual effort.',
  },
  'Incident readiness is low': {
    insight: 'Without clear first steps, teams lose time during an incident.',
    action: 'We create simple first steps so everyone knows what to do first.',
  },
  'Incident steps aren’t clear': {
    insight: 'Most businesses have an idea of what to do, but not a shared process.',
    action: 'We write a short incident checklist the team can follow under pressure.',
  },
  'Team guidance is limited': {
    insight: 'Without guidance, people either ignore issues or panic.',
    action: 'We add lightweight training and clear expectations.',
  },
  'Security habits aren’t consistent': {
    insight:
      'Inconsistent habits usually means security depends on the individual, not the business.',
    action: 'We set simple expectations that do not require technical knowledge.',
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
    setList(insightEl, ['Your fundamentals are in place, with only minor inconsistencies.']);
    setList(actionEl, ['We help keep your security simple and consistent as you grow.']);
  }
}

/* -----------------------
   "You May Have Experienced This"
------------------------ */
const EXPERIENCE_BY_RISK_AXES = {
  Low: [
    { axis: 'Access', text: 'Access being granted temporarily and never removed' },
    { axis: 'Vendors', text: 'Old vendor access lingering longer than intended' },
    { axis: 'Backups', text: 'Backups existing but never being checked' },
    { axis: 'Devices', text: 'Security being inconsistent between devices' },
    { axis: 'People', text: 'Security habits varying from person to person' },
    { axis: 'Readiness', text: 'No clear owner for security upkeep' },
    { axis: 'Email', text: 'Suspicious emails being ignored because nothing happened' },
    { axis: 'Access', text: 'Shared accounts being used for convenience' },
  ],
  Medium: [
    { axis: 'Email', text: 'A phishing email causing confusion or concern' },
    { axis: 'Email', text: 'An account being locked for suspicious activity' },
    { axis: 'Access', text: 'Uncertainty around who has admin access' },
    { axis: 'Backups', text: 'Files being lost or needing restoration' },
    { axis: 'Access', text: 'Shared logins being used to get work done faster' },
    { axis: 'Readiness', text: 'Security issues being handled reactively' },
    { axis: 'Vendors', text: 'Vendor access being left in place after work ends' },
    { axis: 'Devices', text: 'Updates not happening consistently across devices' },
    { axis: 'People', text: 'People not being sure what to do when something feels off' },
  ],
  High: [
    { axis: 'Email', text: 'A phishing email leading to sensitive data exposure' },
    { axis: 'Email', text: 'A fake invoice or payment request being approved' },
    { axis: 'Email', text: 'An email account accessed by someone outside the company' },
    { axis: 'Backups', text: 'Files being encrypted, deleted, or unrecoverable' },
    { axis: 'Vendors', text: 'A former employee or vendor still having system access' },
    { axis: 'Access', text: 'One compromised login exposing multiple systems' },
    { axis: 'Devices', text: 'A lost or stolen laptop containing company data' },
    { axis: 'Readiness', text: 'Access not being shut down quickly after something felt wrong' },
  ],
  Extreme: [
    { axis: 'Email', text: 'Business operations disrupted due to account compromise' },
    { axis: 'Email', text: 'Financial loss from fraudulent payments' },
    { axis: 'Access', text: 'Widespread account lockouts across the team' },
    { axis: 'Backups', text: 'Critical files unavailable during an incident' },
    { axis: 'Readiness', text: 'No clear ownership during a security issue' },
    { axis: 'Backups', text: 'Recovery taking days instead of hours' },
    { axis: 'Vendors', text: 'A third party access path being used to get in' },
    { axis: 'Devices', text: 'Multiple devices needing cleanup at the same time' },
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

  card.style.display = ''; // allow it to show as a slide
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

  // rings
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = accent;
  for (let r = 1; r <= 4; r++) {
    ctx.beginPath();
    ctx.arc(cx, cy, (radius * r) / 4, 0, Math.PI * 2);
    ctx.stroke();
  }

  const angleStep = (Math.PI * 2) / axes.length;

  // axis lines + labels
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

    // simple anchor shift (keep your vibe)
    const shift = label.length * (w < 420 ? 3 : 3.4);
    ctx.globalAlpha = 1;
    ctx.fillText(label, lx - shift, ly);
    ctx.globalAlpha = 0.8;
  });

  // polygon with slow pulsing glow
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
  // Only exclude slides that are explicitly hidden inline (experience slide when empty)
  slides = slides.filter((s) => s.style.display !== 'none');

  if (!slides.length) return;

  // Ensure every slide is 100% width
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

  // Build dots
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
    if (el.riskTitle) el.riskTitle.textContent = 'You’re At Risk';
    if (el.scoreLine) el.scoreLine.textContent = '0% exposed';
    if (el.topGaps) el.topGaps.innerHTML = '<li>Go back and complete the pulse check.</li>';
    return;
  }

  const exposed = Math.max(0, Math.min(100, Number(result.score) || 0));

  if (el.summary) {
    el.summary.textContent = `You’re at ${String(
      result.band || ''
    ).toLowerCase()} risk based on 10 quick signals.`;
  }
  if (el.riskTitle) el.riskTitle.textContent = `You’re At ${result.band} Risk`;
  if (el.scoreLine) el.scoreLine.textContent = `${exposed}% exposed`;

  // Top priorities
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

  // Start radar animation + redraw on resize
  startRadarPulse(el.radar, result.axisRisk || {}, axesOrder);
  window.addEventListener('resize', () => drawRadar(el.radar, result.axisRisk || {}, axesOrder));

  // Email button
  if (el.emailBtn) {
    el.emailBtn.addEventListener('click', () => {
      const subject = encodeURIComponent('My SimpSec Pulse Check Results');
      const body = encodeURIComponent(buildEmailBody(result));
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
    });
  }

  // Prefill inquiry
  if (el.inquiryBtn) {
    const gapsStr = (result.topGaps || []).map((g) => g.gap).join(', ');
    const qp = new URLSearchParams();
    qp.set('source', 'pulse-check');
    qp.set('risk', result.band);
    qp.set('score', String(exposed));
    qp.set('gaps', gapsStr);
    el.inquiryBtn.href = `inquiry.html?${qp.toString()}`;
  }

  // Slider last (after experience card may be unhidden)
  initResultsSlider();
}

document.addEventListener('DOMContentLoaded', init);
