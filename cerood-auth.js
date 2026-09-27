
/* Cerood common authentication bridge — keep existing server login and store checkouts. */
(function () {
  'use strict';
  if (window.CeroodAuth) return;

  const SESSION_KEY = 'cerood_renewed_customer_session';
  const USER_KEY = 'catus_logged_user';
  let host = null;
  let previousOverflow = '';
  let pendingAction = null;

  function readUser() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (!raw) return null;
      const user = JSON.parse(raw);
      return user && typeof user === 'object' && !Array.isArray(user) ? user : null;
    } catch (_) { return null; }
  }

  function isLoggedIn() {
    // The user profile alone is not proof of an authenticated session.
    return Boolean(localStorage.getItem(SESSION_KEY) && readUser());
  }

  function notify() {
    window.dispatchEvent(new CustomEvent('cerood:auth-changed', {
      detail: { loggedIn: isLoggedIn(), user: isLoggedIn() ? readUser() : null }
    }));
  }

  function close() {
    if (!host) return;
    host.remove();
    host = null;
    document.body.style.overflow = previousOverflow;
    pendingAction = null;
  }

  function open() {
    if (host) return;
    previousOverflow = document.body.style.overflow;
    host = document.createElement('div');
    host.id = 'cerood-common-auth-host';
    Object.assign(host.style, {
      position: 'fixed', inset: '0', width: '100%', height: '100dvh',
      zIndex: '2147483000'
    });
    const frame = document.createElement('iframe');
    frame.src = '/cerood-auth.html';
    frame.title = 'Cerood Login and Registration';
    frame.setAttribute('aria-label', 'Cerood Account');
    Object.assign(frame.style, { width: '100%', height: '100%', border: '0', display: 'block' });
    host.appendChild(frame);
    document.body.appendChild(host);
    document.body.style.overflow = 'hidden';
  }

  window.addEventListener('message', function (event) {
    if (event.origin !== window.location.origin || !host ||
        event.source !== host.querySelector('iframe')?.contentWindow ||
        event.data?.source !== 'cerood-auth-frame') return;

    if (event.data.type === 'close') {
      close();
      return;
    }
    if (event.data.type === 'success') {
      // cerood-auth.html stores the server-issued session before sending success.
      // Do not create a session from the iframe message alone.
      const action = pendingAction;
      close();
      notify();
      if (isLoggedIn()) {
        window.dispatchEvent(new CustomEvent('cerood:login', { detail: readUser() }));
        if (typeof action === 'function') action();
      }
      return;
    }
    if (event.data.type === 'register' || event.data.type === 'forgot') {
      const type = event.data.type;
      close();
      window.dispatchEvent(new CustomEvent('cerood:auth-action', {
        detail: { action: type }
      }));
    }
  });

  // Reflect logins and logouts performed in another Cerood tab.
  window.addEventListener('storage', function (event) {
    if (event.key === SESSION_KEY || event.key === USER_KEY || event.key === null) notify();
  });
  window.addEventListener('pageshow', notify);

  window.CeroodAuth = {
    open, close, isLoggedIn,
    getUser: readUser,
    requireLogin(action) {
      if (isLoggedIn()) {
        if (typeof action === 'function') action();
        return true;
      }
      pendingAction = typeof action === 'function' ? action : null;
      open();
      return false;
    },
    refresh: notify,
    logout() {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(USER_KEY);
      close();
      notify();
      window.dispatchEvent(new Event('cerood:logout'));
    }
  };
})();
