/**
 * inquiry-submit.js
 *
 * Handles the SimpSec inquiry form submission.
 *
 * - Intercepts the native form submit
 * - Client-side honeypot check (server also checks)
 * - Collects all fields (visible + hidden pulse/UID metadata)
 * - POSTs JSON to /api/lead
 * - On success: redirects to /inquiry-success.html (preserving existing UX)
 * - On failure: shows an inline error message without losing form data
 */

(function () {
  'use strict';

  function init() {
    const form = document.getElementById('inquiry-form');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      // ── Client-side honeypot check ──────────────────────────────────────
      // The "website" field is hidden from real users via CSS (aria-hidden +
      // position:absolute off-screen). Bots filling every field will trigger this.
      const honeypot = form.querySelector('[name="website"]');
      if (honeypot && honeypot.value.trim() !== '') {
        // Silently redirect — don't reveal to the bot that it was blocked
        window.location.href = '/inquiry-success.html';
        return;
      }

      // ── Collect field values ────────────────────────────────────────────
      const get = (name) => {
        const el = form.querySelector(`[name="${name}"]`);
        return el ? el.value.trim() : '';
      };

      // Collect all checked "Interested in" checkboxes as a comma-joined string
      const interestBoxes = form.querySelectorAll('[name="interested_in[]"]:checked');
      const interest = Array.from(interestBoxes).map((cb) => cb.value).join(', ');

      const payload = {
        // Core lead fields
        firstName: get('first_name'),
        lastName:  get('last_name'),
        email:     get('email'),
        phone:     get('phone'),
        company:   get('company'),
        industry:  get('industry'),
        interest,

        // Pulse Check metadata injected by inquiry-pulse.js
        pulseSource:    get('pulse_source'),
        pulseRisk:      get('pulse_risk'),
        pulseScore:     get('pulse_score'),
        pulseGaps:      get('pulse_gaps'),
        pulseAxisRisk:  get('pulse_axis_risk_json'),

        // Session UID injected by inquiry-uid.js
        inquiryUid: get('inquiry_uid'),

        // Honeypot value (always empty for real users; also checked server-side)
        website: honeypot ? honeypot.value : '',
      };

      // ── Disable submit button while request is in flight ───────────────
      const submitBtn = form.querySelector('[type="submit"]');
      const originalText = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending\u2026';
      }

      // Clear any previous error
      const existingError = document.getElementById('inquiry-error');
      if (existingError) existingError.remove();

      // ── POST to the serverless API ──────────────────────────────────────
      try {
        const response = await fetch('/api/lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Redirect to the existing success page — inquiry-success.js will
          // pick up the UID from sessionStorage and display it there.
          window.location.href = '/inquiry-success.html';
        } else {
          throw new Error(data.error || 'Submission failed. Please try again.');
        }

      } catch (err) {
        // Re-enable the button so the user can retry
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }

        // Show an inline error message beneath the form
        const errorEl = document.createElement('p');
        errorEl.id = 'inquiry-error';
        errorEl.style.cssText = 'color:#e74c3c;margin-top:12px;font-size:0.9em;';
        errorEl.textContent =
          err.message || 'Something went wrong. Please try again or email us directly.';
        form.appendChild(errorEl);
      }
    });
  }

  // Run after DOM is ready regardless of where the script tag is placed
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
