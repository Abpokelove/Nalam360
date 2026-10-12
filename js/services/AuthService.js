(function () {
  'use strict';

  angular.module('Nalam360App').factory('AuthService', ['ApiFactory', '$window', function (ApiFactory, $window) {
    var ONBOARDING_KEY = 'nalam360_onboarding_done';
    var SESSION_KEY = 'nalam360_active_session';
    var TOKEN_KEY = 'nalam360_access_token';

    var savedSession = null;
    var savedToken = $window.localStorage.getItem(TOKEN_KEY) || null;
    try {
      savedSession = JSON.parse($window.localStorage.getItem(SESSION_KEY));
    } catch (e) {
      savedSession = null;
    }

    var state = {
      currentUser: (savedSession && savedToken) ? savedSession.user : null,
      token: savedToken,
      isLoggedIn: !!(savedSession && savedSession.user && savedToken),
      onboardingDone: $window.localStorage.getItem(ONBOARDING_KEY) === 'true'
    };

    function saveSession(user, token) {
      state.currentUser = user;
      state.isLoggedIn = !!(user && token);
      if (token && user) {
        state.token = token;
        $window.localStorage.setItem(TOKEN_KEY, token);
        $window.localStorage.setItem(SESSION_KEY, JSON.stringify({ user: user }));
      } else {
        state.currentUser = null;
        state.token = null;
        state.isLoggedIn = false;
        $window.localStorage.removeItem(SESSION_KEY);
        $window.localStorage.removeItem(TOKEN_KEY);
      }
    }

    return {
      state: state,

      updateCurrentUser: function (user) {
        if (!user) return;
        state.currentUser = user;
        state.isLoggedIn = true;
        $window.localStorage.setItem(SESSION_KEY, JSON.stringify({ user: user }));
      },

      isOnboardingDone: function () {
        return state.onboardingDone;
      },

      completeOnboarding: function () {
        state.onboardingDone = true;
        $window.localStorage.setItem(ONBOARDING_KEY, 'true');
      },

      resetOnboarding: function () {
        state.onboardingDone = false;
        saveSession(null, null);
        $window.localStorage.removeItem(ONBOARDING_KEY);
      },

      login: function (credentials) {
        return ApiFactory.login(credentials).then(function (result) {
          saveSession(result.user, result.token);
          return result;
        });
      },

      register: function (userData) {
        return ApiFactory.register(userData).then(function (result) {
          saveSession(result.user, result.token);
          return result;
        });
      },

      clearSession: function () {
        saveSession(null, null);
      },

      logout: function () {
        saveSession(null, null);
        try {
          ApiFactory.logout();
        } catch (e) {
          // ignore API error on logout
        }
      },

      isLoggedIn: function () {
        return !!(state.isLoggedIn && state.currentUser && state.token);
      },

      getRole: function () {
        return state.currentUser ? state.currentUser.role : null;
      },

      isPatient: function () {
        return this.isLoggedIn() && state.currentUser.role === 'patient';
      },

      isDoctor: function () {
        return this.isLoggedIn() && state.currentUser.role === 'doctor';
      },

      isAdmin: function () {
        return this.isLoggedIn() && state.currentUser.role === 'admin';
      },

      getDashboardRoute: function () {
        if (!this.isLoggedIn()) return '/onboarding';
        var role = state.currentUser.role;
        if (role === 'doctor') return '/doctor/dashboard';
        if (role === 'admin') return '/admin/dashboard';
        return '/patient/dashboard'; // Patient default
      }
    };
  }]);
})();
