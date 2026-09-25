
'use strict';

// ==========================================
// CEROOD SELLER FRONTEND CONFIGURATION
// ==========================================

window.CEROOD_SELLER = {

  API_BASE_URL:
    ['localhost', '127.0.0.1'].includes(
      window.location.hostname
    )
      ? 'http://localhost:3000'
      : 'https://catus-backend-d2js.onrender.com',

  TOKEN_KEY:
    'cerood_seller_token',

  SELLER_KEY:
    'cerood_seller_profile',

  LOGIN_PAGE:
    'seller-login.html',

  DASHBOARD_PAGE:
    'seller-dashboard.html',

  REGISTER_PAGE:
    'seller-register.html'

};


// ==========================================
// SELLER SESSION HELPERS
// ==========================================

window.CeroodSellerAuth = {

  getToken() {

    return localStorage.getItem(
      window.CEROOD_SELLER.TOKEN_KEY
    ) || '';

  },


  getSeller() {

    try {

      return JSON.parse(
        localStorage.getItem(
          window.CEROOD_SELLER.SELLER_KEY
        ) || 'null'
      );

    } catch {

      return null;

    }

  },


  saveSession(token, seller) {

    localStorage.setItem(
      window.CEROOD_SELLER.TOKEN_KEY,
      token
    );

    localStorage.setItem(
      window.CEROOD_SELLER.SELLER_KEY,
      JSON.stringify(seller)
    );

  },


  clearSession() {

    localStorage.removeItem(
      window.CEROOD_SELLER.TOKEN_KEY
    );

    localStorage.removeItem(
      window.CEROOD_SELLER.SELLER_KEY
    );

  },


  async request(path, options = {}) {

    const token = this.getToken();

    const headers = {

      ...(options.headers || {})

    };

    if (token) {

      headers.Authorization =
        'Bearer ' + token;

    }

    const response = await fetch(

      window.CEROOD_SELLER.API_BASE_URL +
      path,

      {

        ...options,

        headers,

        cache: 'no-store'

      }

    );

    let data;

    try {

      data = await response.json();

    } catch {

      data = {

        success: false,

        message:
          'Invalid response from server.'

      };

    }

    if (response.status === 401) {

      this.clearSession();

    }

    return {

      response,

      data

    };

  }

};
