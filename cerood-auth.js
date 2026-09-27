
/* ==========================================
   CEROOD COMMON AUTH POPUP
   cerood-auth.js
   ========================================== */

(function () {

    'use strict';

    if (window.CeroodAuth) {
        return;
    }

    const SESSION_KEY =
        'cerood_renewed_customer_session';

    const USER_KEY =
        'catus_logged_user';

    let host = null;

    let previousOverflow = '';

    /* ==========================================
       CLOSE POPUP
       ========================================== */

    function close() {

        if (!host) {
            return;
        }

        host.remove();

        host = null;

        document.body.style.overflow =
            previousOverflow;

    }

    /* ==========================================
       OPEN POPUP
       ========================================== */

    function open() {

        if (host) {
            return;
        }

        previousOverflow =
            document.body.style.overflow;

        host = document.createElement('div');

        host.id =
            'cerood-common-auth-host';

        Object.assign(host.style, {

            position: 'fixed',

            inset: '0',

            width: '100%',

            height: '100dvh',

            zIndex: '2147483000'

        });

        const frame =
            document.createElement('iframe');

        frame.src =
            '/cerood-auth.html';

        frame.title =
            'Cerood Login and Registration';

        frame.setAttribute(
            'aria-label',
            'Cerood Account'
        );

        Object.assign(frame.style, {

            width: '100%',

            height: '100%',

            border: '0',

            display: 'block'

        });

        host.appendChild(frame);

        document.body.appendChild(host);

        document.body.style.overflow =
            'hidden';

    }

    /* ==========================================
       MESSAGE FROM AUTH HTML
       ========================================== */

    window.addEventListener(
        'message',
        function (event) {

            if (

                event.origin !==
                window.location.origin ||

                !host ||

                event.source !==
                host.querySelector('iframe')
                    ?.contentWindow ||

                event.data?.source !==
                'cerood-auth-frame'

            ) {

                return;

            }

            const type =
                event.data.type;

            /* CLOSE */

            if (type === 'close') {

                close();

                return;

            }

            /* LOGIN SUCCESS */

            if (type === 'success') {

                close();

                window.dispatchEvent(

                    new CustomEvent(
                        'cerood:login',
                        {

                            detail:
                                event.data.user

                        }
                    )

                );

                window.dispatchEvent(

                    new Event(
                        'cerood:auth-changed'
                    )

                );

                return;

            }

            /* ==================================
               REGISTRATION / FORGOT PASSWORD
               ================================== */

            if (

                type === 'register' ||

                type === 'forgot'

            ) {

                close();

                window.dispatchEvent(

                    new CustomEvent(
                        'cerood:auth-action',
                        {

                            detail: {

                                action: type

                            }

                        }
                    )

                );

                return;

            }

        }
    );

    /* ==========================================
       COMMON AUTH API
       ========================================== */

    window.CeroodAuth = {

        /* OPEN LOGIN */

        open: open,

        /* CLOSE LOGIN */

        close: close,

        /* CHECK LOGIN SESSION */

        isLoggedIn() {

            return Boolean(

                localStorage.getItem(
                    SESSION_KEY
                )

            );

        },

        /* GET CUSTOMER DETAILS */

        getUser() {

            try {

                const storedUser =
                    localStorage.getItem(
                        USER_KEY
                    );

                if (!storedUser) {

                    return null;

                }

                return JSON.parse(
                    storedUser
                );

            } catch (error) {

                console.warn(
                    'Cerood user data unavailable:',
                    error
                );

                return null;

            }

        },

        /* LOGOUT */

        logout() {

            localStorage.removeItem(
                USER_KEY
            );

            localStorage.removeItem(
                SESSION_KEY
            );

            window.dispatchEvent(

                new Event(
                    'cerood:auth-changed'
                )

            );

        }

    };

})();
