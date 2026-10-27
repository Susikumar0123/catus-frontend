(function () {
  'use strict';
  function init() {
    const selector = '#locationPopupModal,#ceroodManualAddressModal,#authModal,#cartModal,.cart-modal-overlay,.auth-modal-wrapper,.modal-overlay,.popup-overlay';
    const previous = new Set();
    const suspended = [];
    let order = 0, queued = false;
    function visible(el) {
      const style = getComputedStyle(el);
      return el.isConnected && !el.hidden && style.display !== 'none' && style.visibility !== 'hidden' && el.getClientRects().length > 0;
    }
    function modalDialogs() {
      return [...document.querySelectorAll('dialog[open]')].filter(el => {
        try { return el.matches(':modal'); } catch (_) { return true; }
      });
    }
    function sync() {
      queued = false;
      const roots = [...document.querySelectorAll(selector)].filter(el => el.tagName !== 'DIALOG' && !el.closest('dialog') && (getComputedStyle(el).position === 'fixed' || /^(locationPopupModal|ceroodManualAddressModal|authModal|cartModal)$/.test(el.id)));
      const active = roots.filter(visible);
      const newlyOpened = active.filter(el => !previous.has(el));
      for (const root of newlyOpened) {
        root.classList.add('cerood-popup-layer-active');
        root.style.setProperty('--cerood-popup-layer', String(2147483600 + (++order % 40)));
      }
      if (newlyOpened.length) {
        const focused = document.activeElement;
        // Ordinary div overlays cannot appear above the browser's modal top layer.
        // Temporarily close the parent dialog; retain its actual nodes and values.
        for (const dialog of modalDialogs()) {
          if (!suspended.includes(dialog)) suspended.push(dialog);
          dialog.close();
        }
        if (focused && newlyOpened.some(root => root.contains(focused))) focused.focus({ preventScroll: true });
      }
      for (const root of previous) if (!active.includes(root)) root.classList.remove('cerood-popup-layer-active');
      previous.clear(); active.forEach(root => previous.add(root));
      document.documentElement.classList.toggle('cerood-legacy-popup-open', active.length > 0);
      if (!active.length && !modalDialogs().length) {
        while (suspended.length) {
          const dialog = suspended.pop();
          if (!dialog.isConnected || dialog.open) continue;
          try { dialog.showModal(); } catch (_) { /* Removed or unavailable dialog: leave closed. */ }
          break;
        }
      }
    }
    function schedule() { if (!queued) { queued = true; requestAnimationFrame(sync); } }
    new MutationObserver(schedule).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['style', 'class', 'hidden', 'open'] });
    document.addEventListener('close', schedule, true);
    sync();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
