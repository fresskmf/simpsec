/* =========================================================
   SimpSec Pulse Overlay
   - Overlay only
   - Safe guards everywhere
   - No results-page logic
   - FIX: axis normalization + stable axis order for radar
========================================================= */

const PULSE_STORAGE_KEY = 'simpsec_pulse_result_v2';
const RESULTS_PAGE_URL = '/pulse-results.html';

/* ---------------------------------------------------------
   Questions
--------------------------------------------------------- */

const PULSE_QUESTIONS = [
  {
    category: 'Email Security',
    axis: 'Email',
    text: 'Have you seen suspicious or fake emails recently?',
    answers: [
      { label: 'No', score: 0, gap: null },
      { label: 'Not sure', score: 5, gap: 'Phishing risk is unclear' },
      { label: 'Yes', score: 10, gap: 'Phishing incidents are happening' },
    ],
  },
  {
    category: 'Accounts & Logins',
    axis: 'Access',
    text: 'Do all important accounts require a login code from your phone?',
    answers: [
      { label: 'Yes', score: 0, gap: null },
      { label: 'Some', score: 5, gap: 'MFA is inconsistent' },
      { label: 'No', score: 10, gap: 'MFA is missing' },
    ],
  },
  {
    category: 'Backups & Recovery',
    axis: 'Backups',
    text: 'If files were lost today, could you recover them quickly?',
    answers: [
      { label: 'Yes', score: 0, gap: null },
      { label: 'Not sure', score: 5, gap: 'Backup/recovery confidence is low' },
      { label: 'No', score: 10, gap: 'Backups aren’t tested' },
    ],
  },
  {
    category: 'People',
    axis: 'People',
    text: 'Does everyone know what to do if something feels suspicious?',
    answers: [
      { label: 'Yes', score: 0, gap: null },
      { label: 'Somewhat', score: 5, gap: 'Team guidance is limited' },
      { label: 'No', score: 10, gap: 'Incident readiness is low' },
    ],
  },
  {
    category: 'Devices',
    axis: 'Devices',
    text: 'Are work devices consistently updated and protected?',
    answers: [
      { label: 'Yes', score: 0, gap: null },
      { label: 'Not sure', score: 5, gap: 'Updates aren’t consistent' },
      { label: 'No', score: 10, gap: 'Updates aren’t reliably happening' },
    ],
  },
  {
    category: 'Vendors',
    axis: 'Vendors',
    text: 'Do vendors or contractors still have access?',
    answers: [
      { label: 'No', score: 0, gap: null },
      { label: 'Not sure', score: 5, gap: 'Vendor access is unknown' },
      { label: 'Yes', score: 10, gap: 'Vendor access isn’t fully controlled' },
    ],
  },
  {
    category: 'Admin Access',
    axis: 'Access',
    text: 'Do you know who has admin-level access?',
    answers: [
      { label: 'Yes', score: 0, gap: null },
      { label: 'Not sure', score: 5, gap: 'Admin access is unknown' },
      { label: 'No', score: 10, gap: 'Admin access needs cleanup' },
    ],
  },
  {
    category: 'Devices',
    axis: 'Devices',
    text: 'Could a lost laptop be locked or wiped quickly?',
    answers: [
      { label: 'Yes', score: 0, gap: null },
      { label: 'Not sure', score: 5, gap: 'Device control is inconsistent' },
      { label: 'No', score: 10, gap: 'Lost-device response is weak' },
    ],
  },
  {
    category: 'Access',
    axis: 'Access',
    text: 'Are shared logins used to get work done?',
    answers: [
      { label: 'No', score: 0, gap: null },
      { label: 'Sometimes', score: 5, gap: 'Shared logins happen' },
      { label: 'Often', score: 10, gap: 'Shared accounts are common' },
    ],
  },
  {
    category: 'Readiness',
    axis: 'Readiness',
    text: 'Would everyone know what to do during a security issue?',
    answers: [
      { label: 'Yes', score: 0, gap: null },
      { label: 'Not sure', score: 5, gap: 'Incident steps aren’t clear' },
      { label: 'No', score: 10, gap: 'Incident readiness is low' },
    ],
  },
];

/* ---------------------------------------------------------
   FIX: stable axis order (radar charts MUST have consistent ordering)
   - Use this order in results page too.
--------------------------------------------------------- */

const AXES_ORDER = ['Email', 'Access', 'Backups', 'People', 'Devices', 'Vendors', 'Readiness'];
const MAX_SCORE_PER_QUESTION = 10;

/* ---------------------------------------------------------
   State
--------------------------------------------------------- */

let currentIndex = 0;
let answers = [];

/* ---------------------------------------------------------
   Overlay DOM builder
--------------------------------------------------------- */

function buildOverlayDOM() {
  const root = document.createElement('div');
  root.className = 'pulse-overlay-root';

  root.innerHTML = `
    <div class="pulse-backdrop" data-pulse-close></div>
    <div class="pulse-modal" role="dialog" aria-modal="true">
      <div class="pulse-panel">
        <div class="pulse-topbar">
          <div class="pulse-title">
            <h4>Not Certain About Your Current Risk Level?</h4>
            <div class="pulse-mini">Answer 10 quick questions, and we'll let you know where you stand.</div>
          </div>
          <button class="pulse-close" data-pulse-close>
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="pulse-body">
          <div class="pulse-progress-row">
            <div class="pulse-step" id="pcStepText"></div>
            <div class="pulse-progressbar">
              <div class="pulse-progressfill" id="pcProgressFill"></div>
            </div>
          </div>

          <div class="pulse-question">
            <h3 id="pcQuestion"></h3>
            <div class="pulse-answers" id="pcAnswers"></div>

            <div class="pulse-nav">
              <div class="pulse-left">
                <button class="theme-btn style-5" id="pcBackBtn" type="button">Back</button>
                <button class="theme-btn style-5" id="pcRestartBtn" type="button">Restart</button>
              </div>
              <div class="pulse-nav-category" id="pcNavCategory"></div>
            </div>
          </div>

          <div class="pulse-subnote">
            This is a quick pulse check, not a full audit.
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(root);
  return root;
}

/* ---------------------------------------------------------
   Overlay Logic
--------------------------------------------------------- */

let overlayRoot = null;
let overlayEventsBound = false;

function openOverlay() {
  if (!overlayRoot) overlayRoot = buildOverlayDOM();

  if (!overlayEventsBound) {
    bindOverlayEvents();
    overlayEventsBound = true;
  }

  document.body.classList.add('pulse-lock');

  restartPulse();

  // Ensure we transition every time (even on first open)
  overlayRoot.classList.remove('is-open');
  void overlayRoot.offsetHeight; // force reflow
  requestAnimationFrame(() => {
    overlayRoot.classList.add('is-open');
  });
}

function closeOverlay() {
  if (!overlayRoot) return;
  overlayRoot.classList.remove('is-open');
  document.body.classList.remove('pulse-lock');
}

function bindOverlayEvents() {
  overlayRoot.querySelectorAll('[data-pulse-close]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      closeOverlay();
    });
  });

  const backBtn = overlayRoot.querySelector('#pcBackBtn');
  const restartBtn = overlayRoot.querySelector('#pcRestartBtn');

  if (backBtn) backBtn.addEventListener('click', goBack);
  if (restartBtn) restartBtn.addEventListener('click', restartPulse);
}

/* ---------------------------------------------------------
   Render Question
--------------------------------------------------------- */

function renderQuestion() {
  const q = PULSE_QUESTIONS[currentIndex];
  if (!q) return;

  const stepEl = document.getElementById('pcStepText');
  const fillEl = document.getElementById('pcProgressFill');
  const questionEl = document.getElementById('pcQuestion');
  const navCatEl = document.getElementById('pcNavCategory');
  const answersEl = document.getElementById('pcAnswers');

  if (!stepEl || !fillEl || !questionEl || !navCatEl || !answersEl) return;

  stepEl.textContent = `Question ${currentIndex + 1} of ${PULSE_QUESTIONS.length}`;
  fillEl.style.width = `${((currentIndex + 1) / PULSE_QUESTIONS.length) * 100}%`;

  questionEl.textContent = q.text;
  navCatEl.innerHTML = `<i class="fa-solid fa-shield-halved"></i><span>${q.category}</span>`;

  answersEl.innerHTML = '';

  q.answers.forEach((a) => {
    const btn = document.createElement('button');
    btn.className = 'theme-btn pulse-answer';
    btn.type = 'button';
    btn.textContent = a.label;
    btn.addEventListener('click', () => selectAnswer(a));
    answersEl.appendChild(btn);
  });
}

function selectAnswer(answer) {
  answers[currentIndex] = answer;
  currentIndex++;

  if (currentIndex >= PULSE_QUESTIONS.length) finishPulse();
  else renderQuestion();
}

function goBack() {
  if (currentIndex === 0) return;
  currentIndex--;
  renderQuestion();
}

function restartPulse() {
  currentIndex = 0;
  answers = [];
  renderQuestion();
}

/* ---------------------------------------------------------
   FIXED Scoring + Results
   - Normalizes each axis to 0..100 based on number of questions for that axis
   - Stores axisRisk in stable AXES_ORDER so radar can render cleanly
--------------------------------------------------------- */

function finishPulse() {
  // raw totals per axis (0..(questions*10))
  const axisRaw = {};
  const gaps = [];

  answers.forEach((a, i) => {
    const q = PULSE_QUESTIONS[i];
    if (!q || !a) return;

    axisRaw[q.axis] = (axisRaw[q.axis] || 0) + a.score;
    if (a.gap) gaps.push({ gap: a.gap, category: q.category, axis: q.axis });
  });

  // count questions per axis so we can normalize fairly
  const axisQuestionCounts = {};
  PULSE_QUESTIONS.forEach((q) => {
    axisQuestionCounts[q.axis] = (axisQuestionCounts[q.axis] || 0) + 1;
  });

  // normalized 0..100 in stable order
  const axisRisk = {};
  AXES_ORDER.forEach((axis) => {
    const count = axisQuestionCounts[axis] || 0;
    const maxPossible = count * MAX_SCORE_PER_QUESTION;
    const raw = axisRaw[axis] || 0;

    // If an axis isn't used (count=0), keep it at 0.
    const pct = maxPossible > 0 ? Math.round((raw / maxPossible) * 100) : 0;

    axisRisk[axis] = Math.max(0, Math.min(100, pct));
  });

  // overall score = average exposure across axes in the defined order
  const usedAxes = AXES_ORDER.filter((a) => (axisQuestionCounts[a] || 0) > 0);
  const avg =
    usedAxes.length > 0
      ? usedAxes.reduce((sum, a) => sum + (axisRisk[a] || 0), 0) / usedAxes.length
      : 0;

  const score = Math.max(0, Math.min(100, Math.round(avg)));

  let band = 'Low';
  if (score >= 75) band = 'Extreme';
  else if (score >= 55) band = 'High';
  else if (score >= 35) band = 'Medium';

  // Optional: keep top gaps unique (avoid duplicates if axes repeat)
  const topGaps = gaps.slice(0, 5);

  const result = {
    score,
    band,
    axesOrder: AXES_ORDER, // <— important for results page plotting
    axisRisk, // normalized 0..100 in stable order
    topGaps,
  };

  localStorage.setItem(PULSE_STORAGE_KEY, JSON.stringify(result));
  window.location.href = RESULTS_PAGE_URL;
}

/* ---------------------------------------------------------
   Init
--------------------------------------------------------- */

document.addEventListener('click', (e) => {
  const trigger = e.target.closest('[data-pulse-open]');
  if (!trigger) return;
  e.preventDefault();
  openOverlay();
});

console.log('[Pulse Overlay] Loaded:', window.location.pathname);
