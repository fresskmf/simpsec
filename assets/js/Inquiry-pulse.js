/* =========================================================
   - Pulls Pulse results from:
     1) URL query params (preferred)
     2) localStorage fallback
   - Injects into hidden inquiry form fields
========================================================= */

(function () {
  const STORAGE_KEY = 'simpsec_pulse_result_v2';

  function init() {
    const form = document.getElementById('inquiry-form');
    if (!form) return;

    const set = (name, val) => {
      const el = form.querySelector(`[name="${name}"]`);
      if (el) el.value = val == null ? '' : String(val);
    };

    const qp = new URLSearchParams(window.location.search);

    let source = qp.get('source') || '';
    let risk = qp.get('risk') || '';
    let score = qp.get('score') || '';
    let gaps = qp.get('gaps') || '';

    let axisRisk = null;
    let axesOrder = null;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const r = JSON.parse(stored);

        axisRisk = r.axisRisk || null;
        axesOrder = r.axesOrder || null;

        if (!source) source = 'pulse-check';
        if (!risk) risk = r.band || '';

        // Only fill score/gaps from storage if URL didn’t provide them
        if (!score && score !== '0') score = r.score ?? '';
        if (!gaps && Array.isArray(r.topGaps)) {
          gaps = r.topGaps.map((g) => g.gap).join(', ');
        }
      }
    } catch (e) {
      // ignore
    }

    set('pulse_source', source);
    set('pulse_risk', risk);
    set('pulse_score', score);
    set('pulse_gaps', gaps);
    set('pulse_axis_risk_json', axisRisk ? JSON.stringify(axisRisk) : '');
    set('pulse_axes_order_json', axesOrder ? JSON.stringify(axesOrder) : '');

    // Optional: uncomment for a quick proof in console
    // console.log('[inquiry-pulse] injected', { source, risk, score, gaps });
  }

  // Run reliably regardless of where the script is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
