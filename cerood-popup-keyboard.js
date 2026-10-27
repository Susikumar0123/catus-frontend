(function () {
  'use strict';
  const mobile = window.matchMedia('(max-width:850px)');
  const viewport = window.visualViewport;
  let frame = 0;
  const editable = el => el && el.matches('input:not([type=button]):not([type=submit]):not([type=checkbox]):not([type=radio]):not([type=hidden]),textarea,[contenteditable=true]');
  function clear() {
    document.querySelectorAll('.cerood-keyboard-overlay,.cerood-keyboard-card').forEach(el => el.classList.remove('cerood-keyboard-overlay', 'cerood-keyboard-card'));
    document.documentElement.classList.remove('cerood-popup-input-active');
  }
  function update() {
    frame = 0;
    const field = document.activeElement;
    clear();
    if (!mobile.matches || !editable(field)) return;
    let root = field.closest('dialog,#locationPopupModal,#authModal,[role=dialog],.cart-modal-overlay,.auth-modal-wrapper,.modal-overlay,.popup-overlay');
    if (!root || root.matches('header,nav,.uc-homepage-wrapper,.header-main-container') || field.closest('.uc-homepage-wrapper,.header-main-container')) return;
    const height = viewport ? viewport.height : window.innerHeight;
    const top = viewport ? viewport.offsetTop : 0;
    document.documentElement.style.setProperty('--cerood-visible-popup-height', height + 'px');
    document.documentElement.style.setProperty('--cerood-visible-popup-top', top + 'px');
    document.documentElement.classList.add('cerood-popup-input-active');
    root.classList.add('cerood-keyboard-overlay');
    const card = field.closest('.loc-modal-card,.auth-modal-container,.modal-content,.popup-content,.modal-card,.dialog-content') || (root.tagName === 'DIALOG' ? root : [...root.children].find(el => el.contains(field)));
    if (card && card !== root) card.classList.add('cerood-keyboard-card');
    // Scroll the popup's own containers, never the underlying page.
    const visibleBottom = top + height - 20;
    const visibleTop = top + 20;
    for (let el = field.parentElement; el; el = el.parentElement) {
      const style = getComputedStyle(el);
      if (/(auto|scroll)/.test(style.overflowY) && el.scrollHeight > el.clientHeight) {
        const rect = field.getBoundingClientRect();
        const parent = el.getBoundingClientRect();
        const bottom = Math.min(visibleBottom, parent.bottom - 12);
        const upper = Math.max(visibleTop, parent.top + 12);
        if (rect.bottom > bottom) el.scrollTop += rect.bottom - bottom;
        else if (rect.top < upper) el.scrollTop -= upper - rect.top;
      }
      if (el === root) break;
    }
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  document.addEventListener('focusin', schedule);
  document.addEventListener('focusout', schedule);
  document.addEventListener('input', schedule);
  window.addEventListener('resize', schedule, { passive: true });
  mobile.addEventListener('change', schedule);
  if (viewport) {
    viewport.addEventListener('resize', schedule, { passive: true });
    viewport.addEventListener('scroll', schedule, { passive: true });
  }
})();
