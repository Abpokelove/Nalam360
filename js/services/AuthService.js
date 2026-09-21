(function () {
  'use strict';

  angular.module('Nalam360App').factory('AuthService', ['ApiFactory', '$window', function (ApiFactory, $window) {
    var ONBOARDING_KEY = 'nalam360_onboarding_done';
    var SESSION_KEY = 'nalam360_active_session';
    var TOKEN_KEY = 'nalam360_access_token';

    var savedSession = null;
    try {
      savedSession = JSON.parse($window.localStorage.getItem(SESSION_KEY));
    } catch (e) {
      savedSession = null;
    }

    var state = {
      currentUser: savedSession ? savedSession.user : null,
      token: $window.localStorage.getItem(TOKEN_KEY) || null,
      isLoggedIn: !!(savedSession && savedSession.user),
      onboardingDone: $window.localStorage.getItem(ONBOARDING_KEY) === 'true'
    };

    function saveSession(user, token) {
      state.currentUser = user;
      state.isLoggedIn = !!user;
      if (token) {
        state.token = token;
        $window.localStorage.setItem(TOKEN_KEY, token);
      }
      if (user) {
        $window.localStorage.setItem(SESSION_KEY, JSON.stringify({ user: user }));
      } else {
        state.token = null;
        $window.localStorage.removeItem(SESSION_KEY);
        $window.localStorage.removeItem(TOKEN_KEY);
      }
    }

    return {
      state: state,

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

      logout: function () {
        try {
          ApiFactory.logout();
        } catch (e) {
          // ignore API error on logout
        }
        saveSession(null, null);
      },

      isLoggedIn: function () {
        return state.isLoggedIn && !!state.currentUser;
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
        if (!this.isLoggedIn()) return '/login';
        var role = state.currentUser.role;
        if (role === 'doctor') return '/doctor/dashboard';
        if (role === 'admin') return '/admin/dashboard';
        return '/patient/dashboard'; // Patient default
      }
    };
  }]);
})();
