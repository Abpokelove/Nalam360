(function () {
  'use strict';

  angular.module('Nalam360App').factory('AuthService', ['ApiFactory', '$window', function (ApiFactory, $window) {
    var ONBOARDING_KEY = 'nalam360_onboarding_done';
    var SESSION_KEY = 'nalam360_active_session';

    var savedSession = null;
    try {
      savedSession = JSON.parse($window.localStorage.getItem(SESSION_KEY));
    } catch (e) {
      savedSession = null;
    }

    var state = {
      currentUser: savedSession ? savedSession.user : null,
      isLoggedIn: !!(savedSession && savedSession.user),
      onboardingDone: $window.localStorage.getItem(ONBOARDING_KEY) === 'true'
    };

    function saveSession(user) {
      state.currentUser = user;
      state.isLoggedIn = !!user;
      if (user) {
        $window.localStorage.setItem(SESSION_KEY, JSON.stringify({ user: user }));
      } else {
        $window.localStorage.removeItem(SESSION_KEY);
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
        saveSession(null);
        $window.localStorage.removeItem(ONBOARDING_KEY);
      },

      login: function (credentials) {
        return ApiFactory.login(credentials).then(function (result) {
          saveSession(result.user);
          return result;
        });
      },

      register: function (userData) {
        return ApiFactory.register(userData).then(function (result) {
          saveSession(result.user);
          return result;
        });
      },

      logout: function () {
        saveSession(null);
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
