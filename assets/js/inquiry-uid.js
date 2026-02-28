/* =========================================================
   - Generates a stable UID per inquiry session
   - Injects into hidden form field
   - Persists via sessionStorage for success + booking
========================================================= */

(function () {
  const STORAGE_KEY = 'simpsec_inquiry_uid';

  function generateUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function initInquiryUID() {
    const field = document.getElementById('inquiry_uid');
    if (!field) return; // not on inquiry page

    let uid = sessionStorage.getItem(STORAGE_KEY);
    if (!uid) {
      uid = generateUID();
      sessionStorage.setItem(STORAGE_KEY, uid);
    }

    field.value = uid;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInquiryUID);
  } else {
    initInquiryUID();
  }
})();
