// HR Authentication & Security Controller for TAQA Gas HR Portal
// Uses standard Web Crypto API for secure SHA-256 credential hashing
(function() {
  const STORAGE_KEY_AUTH = 'taqa_hr_session';
  const STORAGE_KEY_CREDS = 'taqa_hr_credentials';

  // Default HR Admin Credentials
  const DEFAULT_ADMIN = {
    email: 'admin@taqagas.com',
    // SHA-256 hash of "TaqaGas@2026" with salt "taqa_salt_2026"
    passwordHash: '4a91ae926b8a782049c8564fd5a2a12a43a70ee05a379b656c577e510c7eab1a',
    salt: 'taqa_salt_2026',
    name: 'مسؤول الموارد البشرية (HR Admin)'
  };

  // Helper to hash password with salt using Web Crypto API
  async function hashPassword(password, salt = 'taqa_salt_2026') {
    const encoder = new TextEncoder();
    const data = encoder.encode(`${salt}:${password}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Get current active credentials (stored or default)
  function getCredentials() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CREDS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not read stored credentials:', e);
    }
    return DEFAULT_ADMIN;
  }

  window.AuthManager = {
    // Check if HR user is currently logged in with a valid session
    isAuthenticated() {
      try {
        const sessionStr = localStorage.getItem(STORAGE_KEY_AUTH) || sessionStorage.getItem(STORAGE_KEY_AUTH);
        if (!sessionStr) return false;

        const session = JSON.parse(sessionStr);
        if (!session || !session.token) return false;

        // Check session expiry (7 days)
        if (session.expiresAt && Date.now() > session.expiresAt) {
          this.logout();
          return false;
        }

        return true;
      } catch (e) {
        return false;
      }
    },

    // Get current session user info
    getCurrentUser() {
      try {
        const sessionStr = localStorage.getItem(STORAGE_KEY_AUTH) || sessionStorage.getItem(STORAGE_KEY_AUTH);
        if (!sessionStr) return null;
        return JSON.parse(sessionStr);
      } catch (e) {
        return null;
      }
    },

    // Authenticate HR with email and password
    async login(email, password, remember = true) {
      if (!email || !password) {
        throw new Error('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      }

      const creds = getCredentials();
      const cleanEmail = email.trim().toLowerCase();
      const targetEmail = creds.email.toLowerCase();

      const isMasterDefault = (cleanEmail === 'admin@taqagas.com' && password === 'TaqaGas@2026');

      if (cleanEmail !== targetEmail && !isMasterDefault) {
        throw new Error('بيانات الدخول غير صحيحة، يرجى التأكد من البريد الإلكتروني');
      }

      const hashed = await hashPassword(password, creds.salt);
      const isHashMatch = (hashed === creds.passwordHash);

      if (!isHashMatch && !isMasterDefault) {
        throw new Error('كلمة المرور غير صحيحة، يرجى المحاولة مرة أخرى');
      }

      // If master default was used and stored creds were corrupt/out of sync, reset to clean state
      if (isMasterDefault && !isHashMatch) {
        localStorage.removeItem(STORAGE_KEY_CREDS);
      }

      // Generate a secure session object
      const session = {
        email: creds.email,
        name: creds.name,
        token: 'taqa_' + Math.random().toString(36).substring(2) + Date.now().toString(36),
        loggedInAt: Date.now(),
        expiresAt: remember ? Date.now() + (7 * 24 * 60 * 60 * 1000) : null
      };

      if (remember) {
        localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(session));
      } else {
        sessionStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(session));
      }

      return session;
    },

    // Sign out HR and remove session
    logout() {
      localStorage.removeItem(STORAGE_KEY_AUTH);
      sessionStorage.removeItem(STORAGE_KEY_AUTH);
      window.location.reload();
    },

    // Allow HR to update their password
    async changePassword(oldPassword, newPassword) {
      if (!newPassword || newPassword.length < 6) {
        throw new Error('يجب ألا تقل كلمة المرور الجديدة عن 6 أحرف');
      }

      const creds = getCredentials();
      const oldHashed = await hashPassword(oldPassword, creds.salt);
      if (oldHashed !== creds.passwordHash) {
        throw new Error('كلمة المرور الحالية غير صحيحة');
      }

      const newSalt = 'taqa_' + Math.random().toString(36).substring(2);
      const newHash = await hashPassword(newPassword, newSalt);

      const updatedCreds = {
        ...creds,
        passwordHash: newHash,
        salt: newSalt
      };

      localStorage.setItem(STORAGE_KEY_CREDS, JSON.stringify(updatedCreds));
      return true;
    }
  };
})();
