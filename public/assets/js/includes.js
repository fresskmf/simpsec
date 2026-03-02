/* =========================================================
   SimpSec Includes (Header/Footer)
   - Sync XHR to ensure header exists before main.js binds
   - Keeps .html URLs (phase 1)
   ========================================================= */

(function () {
  'use strict';

  function loadInto(id, url) {
    var mount = document.getElementById(id);
    if (!mount) return;

    try {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, false); // sync (intentional)
      xhr.send(null);

      if (xhr.status >= 200 && xhr.status < 300) {
        mount.innerHTML = xhr.responseText;
      } else {
        console.warn('[includes] Failed to load', url, xhr.status);
      }
    } catch (e) {
      console.warn('[includes] Error loading', url, e);
    }
  }

  // Run immediately when the script is parsed
  loadInto('site-header', '/public/partials/header.html');
  loadInto('site-footer', '/public/partials/footer.html');

  // Let any code re-bind after injection (optional hook)
  try {
    window.dispatchEvent(new Event('simpsec:includes:loaded'));
  } catch (_) {}
})();
