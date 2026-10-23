(function () {
  'use strict';
  if (window.ceroodContactEventsInstalled) return;
  window.ceroodContactEventsInstalled = true;
  document.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest('a[href]');
    if (!link) return;
    var href = link.getAttribute('href') || '';
    var channel = /^tel:/i.test(href) ? 'call' : /^https:\/\/(wa\.me|api\.whatsapp\.com)(\/|$)/i.test(href) ? 'whatsapp' : '';
    if (!channel) return;
    // Record intent only. A click does not mean a connected call or a booking.
    // Never send the message, telephone number, address or URL query string.
    var payload = {contact_channel: channel, page_path: window.location.pathname};
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'contact_click', payload);
    } else {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(Object.assign({event: 'contact_click'}, payload));
    }
  });
})();
