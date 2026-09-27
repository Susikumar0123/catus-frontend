/* Cerood common login popup loader — phase 1 */

(function () {
    'use strict';

    if (window.CeroodAuth) return;

    let host = null;
    let previousOverflow = '';

    function close() {
        if (host) {
            host.remove();
            host = null;

            document.body.style.overflow = previousOverflow;
        }
    }

    function open() {
        if (host) return;

        previousOverflow = document.body.style.overflow;

        host = document.createElement('div');
        host.id = 'cerood-common-auth-host';

        Object.assign(host.style, {
            position: 'fixed',
            inset: '0',
            zIndex: '2147483000'
        });

        const frame = document.createElement('iframe');

        frame.src = '/cerood-auth.html';
        frame.title = 'Cerood login and registration';

        frame.setAttribute(
            'aria-label',
            'Cerood login'
        );

        Object.assign(frame.style, {
            width: '100%',
            height: '100%',
            border: '0',
            display: 'block'
        });

        host.append(frame);

        document.body.append(host);

        document.body.style.overflow = 'hidden';
    }

    window.addEventListener('message', event => {

        if (
            event.origin !== location.origin ||
            event.source !== host?.querySelector('iframe')?.contentWindow ||
            event.data?.source !== 'cerood-auth-frame'
        ) {
            return;
        }

        if (event.data.type === 'close') {
            close();
        }

        if (event.data.type === 'success') {

            close();

            window.dispatchEvent(
                new CustomEvent('cerood:login', {
                    detail: event.data.user
                })
            );

            window.dispatchEvent(
                new Event('cerood:auth-changed')
            );
        }

    });

    window.CeroodAuth = {

        open,

        close,

        isLoggedIn() {
            return Boolean(
                localStorage.getItem(
                    'cerood_renewed_customer_session'
                )
            );
        },

        logout() {

            localStorage.removeItem(
                'catus_logged_user'
            );

            localStorage.removeItem(
                'cerood_renewed_customer_session'
            );

            window.dispatchEvent(
                new Event('cerood:auth-changed')
            );
        }

    };

})();