/* =========================================================
   SimpSec Pulse Overlay — Config-Driven Engine
   - Reads quiz config from window.PULSE_CONFIGS[key]
   - key comes from data-pulse-open="key" (fallback: 'cyber')
   - Load a config script (e.g. pulse-config-cyber.js) before this file
   - No results-page logic — engine only
   - FIX: axis normalization + stable axis order for radar
========================================================= */

window.PULSE_CONFIGS = window.PULSE_CONFIGS || {};

const MAX_SCORE_PER_QUESTION = 10;

/* ---------------------------------------------------------
   State
--------------------------------------------------------- */

let currentIndex = 0;
let answers = [];
let activeConfig = null; // set when overlay opens

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

function openOverlay(key) {
  const cfg = window.PULSE_CONFIGS[key || 'cyber'];
  if (!cfg) {
    console.warn('[Pulse Overlay] No config found for key:', key || 'cyber');
    return;
  }
  activeConfig = cfg;

  if (!overlayRoot) overlayRoot = buildOverlayDOM();

  if (!overlayEventsBound) {
    bindOverlayEvents();
    overlayEventsBound = true;
  }

  document.body.classList.add('pulse-lock');

  restartPulse();

  overlayRoot.classList.remove('is-open');
  void overlayRoot.offsetHeight;
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
  if (!activeConfig) return;
  const q = activeConfig.questions[currentIndex];
  if (!q) return;

  const stepEl = document.getElementById('pcStepText');
  const fillEl = document.getElementById('pcProgressFill');
  const questionEl = document.getElementById('pcQuestion');
  const navCatEl = document.getElementById('pcNavCategory');
  const answersEl = document.getElementById('pcAnswers');

  if (!stepEl || !fillEl || !questionEl || !navCatEl || !answersEl) return;

  const total = activeConfig.questions.length;
  stepEl.textContent = `Question ${currentIndex + 1} of ${total}`;
  fillEl.style.width = `${((currentIndex + 1) / total) * 100}%`;

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

  if (!activeConfig) return;
  if (currentIndex >= activeConfig.questions.length) finishPulse();
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
   Scoring + Results
   - Normalizes each axis to 0..100 based on questions per axis
   - Stores axisRisk in stable axesOrder so radar renders cleanly
--------------------------------------------------------- */

function finishPulse() {
  if (!activeConfig) return;

  const { questions, axesOrder, storageKey, resultsUrl } = activeConfig;

  const axisRaw = {};
  const gaps = [];

  answers.forEach((a, i) => {
    const q = questions[i];
    if (!q || !a) return;
    axisRaw[q.axis] = (axisRaw[q.axis] || 0) + a.score;
    if (a.gap) gaps.push({ gap: a.gap, category: q.category, axis: q.axis });
  });

  const axisQuestionCounts = {};
  questions.forEach((q) => {
    axisQuestionCounts[q.axis] = (axisQuestionCounts[q.axis] || 0) + 1;
  });

  const axisRisk = {};
  axesOrder.forEach((axis) => {
    const count = axisQuestionCounts[axis] || 0;
    const maxPossible = count * MAX_SCORE_PER_QUESTION;
    const raw = axisRaw[axis] || 0;
    const pct = maxPossible > 0 ? Math.round((raw / maxPossible) * 100) : 0;
    axisRisk[axis] = Math.max(0, Math.min(100, pct));
  });

  const usedAxes = axesOrder.filter((a) => (axisQuestionCounts[a] || 0) > 0);
  const avg =
    usedAxes.length > 0
      ? usedAxes.reduce((sum, a) => sum + (axisRisk[a] || 0), 0) / usedAxes.length
      : 0;

  const score = Math.max(0, Math.min(100, Math.round(avg)));

  let band = 'Low';
  if (score >= 75) band = 'Extreme';
  else if (score >= 55) band = 'High';
  else if (score >= 35) band = 'Medium';

  const topGaps = gaps.slice(0, 5);

  const result = {
    score,
    band,
    axesOrder,
    axisRisk,
    topGaps,
  };

  localStorage.setItem(storageKey, JSON.stringify(result));
  window.location.href = resultsUrl;
}

/* ---------------------------------------------------------
   Init
--------------------------------------------------------- */

document.addEventListener('click', (e) => {
  const trigger = e.target.closest('[data-pulse-open]');
  if (!trigger) return;
  e.preventDefault();
  const key = trigger.dataset.pulseOpen || 'cyber';
  openOverlay(key);
});

console.log('[Pulse Overlay] Loaded:', window.location.pathname);
