/* =========================================================
   - Reads the Inquiry UID from sessionStorage
   - Appends it to booking links (Calendly/Bookings/etc.)
   - Optionally displays it (if you add a placeholder element)
========================================================= */

(function () {
  const STORAGE_KEY = 'simpsec_inquiry_uid';

  function appendQueryParam(href, key, value) {
    try {
      const url = new URL(href, window.location.href);
      url.searchParams.set(key, value);
      return url.toString();
    } catch (e) {
      // If href is something odd (rare), just return it unchanged
      return href;
    }
  }

  function initInquirySuccess() {
    const uid = sessionStorage.getItem(STORAGE_KEY);
    if (!uid) return;

    // 1) Append UID to any booking links you mark
    // Add this attribute to links you want to receive the UID:
    // data-pass-inquiry-uid
    const links = document.querySelectorAll('a[data-pass-inquiry-uid]');
    links.forEach((a) => {
      const original = a.getAttribute('href');
      if (!original) return;

      const updated = appendQueryParam(original, 'inquiry_uid', uid);
      a.setAttribute('href', updated);
    });

    // 2) Optional: show UID on the page (for internal use)
    // Add <span data-inquiry-uid></span> where you want it to appear.
    const uidSpans = document.querySelectorAll('[data-inquiry-uid]');
    uidSpans.forEach((el) => {
      el.textContent = uid;
    });

    // 3) Optional: clear UID after landing here (only if you want one-time correlation)
    // Commented out by default because you may want it for booking / follow-up.
    // sessionStorage.removeItem(STORAGE_KEY);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInquirySuccess);
  } else {
    initInquirySuccess();
  }
})();
