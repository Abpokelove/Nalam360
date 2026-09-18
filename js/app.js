(function () {
  'use strict';

  var app = angular.module('Nalam360App', ['ngRoute', 'ngAnimate']);

  app.config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {

    $locationProvider.html5Mode(false);
    $locationProvider.hashPrefix('');

    $routeProvider
      /* =========================================================================
         1. PUBLIC & ENTRY ROUTES
         ========================================================================= */
      .when('/onboarding', {
        templateUrl: 'views/onboarding/onboarding.html',
        controller: 'MainController',
        access: 'public'
      })
      .when('/login', {
        templateUrl: 'views/auth/login.html',
        controller: 'AuthController',
        access: 'public'
      })
      .when('/register', {
        templateUrl: 'views/auth/register.html',
        controller: 'AuthController',
        access: 'public'
      })
      .when('/access-denied', {
        templateUrl: 'views/shared/access-denied.html',
        access: 'public'
      })

      /* =========================================================================
         2. CANONICAL PATIENT ROUTES (roles: ['patient'])
         ========================================================================= */
      .when('/patient/dashboard', {
        templateUrl: 'views/patient/dashboard.html',
        controller: 'DashboardController',
        requiresAuth: true,
        roles: ['patient']
      })
      .when('/patient/healthcare', {
        templateUrl: 'views/patient/healthcare.html',
        controller: 'HealthcareController',
        requiresAuth: true,
        roles: ['patient']
      })
      .when('/patient/doctors', {
        templateUrl: 'views/patient/doctors.html',
        controller: 'HealthcareController',
        requiresAuth: true,
        roles: ['patient']
      })
      .when('/patient/appointments', {
        templateUrl: 'views/patient/appointments.html',
        controller: 'AppointmentController',
        requiresAuth: true,
        roles: ['patient']
      })
      .when('/patient/reminders', {
        templateUrl: 'views/patient/reminders.html',
        controller: 'ReminderController',
        requiresAuth: true,
        roles: ['patient']
      })
      .when('/patient/camps', {
        templateUrl: 'views/patient/camps.html',
        controller: 'CampController',
        requiresAuth: true,
        roles: ['patient']
      })
      .when('/patient/awareness', {
        templateUrl: 'views/patient/awareness.html',
        controller: 'AwarenessController',
        requiresAuth: true,
        roles: ['patient']
      })
      .when('/patient/emergency', {
        templateUrl: 'views/patient/emergency.html',
        controller: 'EmergencyController',
        requiresAuth: true,
        roles: ['patient']
      })
      .when('/patient/profile', {
        templateUrl: 'views/patient/profile.html',
        controller: 'ProfileController',
        requiresAuth: true,
        roles: ['patient']
      })

      /* =========================================================================
         3. CANONICAL DOCTOR ROUTES (roles: ['doctor'])
         ========================================================================= */
      .when('/doctor/dashboard', {
        templateUrl: 'views/doctor/dashboard.html',
        controller: 'DoctorDashboardController',
        requiresAuth: true,
        roles: ['doctor']
      })
      .when('/doctor/patients', {
        templateUrl: 'views/doctor/patients.html',
        controller: 'DoctorPatientsController',
        requiresAuth: true,
        roles: ['doctor']
      })
      .when('/doctor/appointments', {
        templateUrl: 'views/doctor/appointments.html',
        controller: 'AppointmentController',
        requiresAuth: true,
        roles: ['doctor']
      })
      .when('/doctor/camps', {
        templateUrl: 'views/doctor/camps.html',
        controller: 'CampController',
        requiresAuth: true,
        roles: ['doctor']
      })
      .when('/doctor/awareness', {
        templateUrl: 'views/doctor/awareness.html',
        controller: 'AwarenessController',
        requiresAuth: true,
        roles: ['doctor']
      })
      .when('/doctor/emergency', {
        templateUrl: 'views/doctor/emergency.html',
        controller: 'EmergencyController',
        requiresAuth: true,
        roles: ['doctor']
      })
      .when('/doctor/profile', {
        templateUrl: 'views/doctor/profile.html',
        controller: 'ProfileController',
        requiresAuth: true,
        roles: ['doctor']
      })

      /* =========================================================================
         4. CANONICAL ADMIN ROUTES (roles: ['admin'])
         ========================================================================= */
      .when('/admin/dashboard', {
        templateUrl: 'views/admin/dashboard.html',
        controller: 'AdminController',
        requiresAuth: true,
        roles: ['admin']
      })
      .when('/admin/users', {
        templateUrl: 'views/admin/users.html',
        controller: 'AdminController',
        requiresAuth: true,
        roles: ['admin']
      })
      .when('/admin/doctors', {
        templateUrl: 'views/admin/doctors.html',
        controller: 'AdminController',
        requiresAuth: true,
        roles: ['admin']
      })
      .when('/admin/camps', {
        templateUrl: 'views/admin/camps.html',
        controller: 'CampController',
        requiresAuth: true,
        roles: ['admin']
      })
      .when('/admin/awareness', {
        templateUrl: 'views/admin/awareness.html',
        controller: 'AwarenessController',
        requiresAuth: true,
        roles: ['admin']
      })
      .when('/admin/emergency', {
        templateUrl: 'views/admin/emergency.html',
        controller: 'EmergencyController',
        requiresAuth: true,
        roles: ['admin']
      })
      .when('/admin/profile', {
        templateUrl: 'views/admin/profile.html',
        controller: 'ProfileController',
        requiresAuth: true,
        roles: ['admin']
      })

      .otherwise({
        redirectTo: function () {
          var auth = angular.element(document.body).injector().get('AuthService');
          if (!auth.isOnboardingDone()) return '/onboarding';
          if (!auth.isLoggedIn()) return '/login';
          return auth.getDashboardRoute();
        }
      });
  }]);

  /* =========================================================================
     ROUTE GUARD LISTENER FOR ONBOARDING, AUTH, AND ROLE AUTHORIZATION
     ========================================================================= */
  app.run(['$rootScope', '$location', 'AuthService', 'NotificationService', function ($rootScope, $location, AuthService, NotificationService) {
    $rootScope.$on('$routeChangeStart', function (event, next) {
      // 1. Onboarding check on first launch or after development state reset
      if (!AuthService.isOnboardingDone() && next && next.originalPath !== '/onboarding') {
        event.preventDefault();
        $location.path('/onboarding');
        return;
      }

      // 2. Unauthenticated user attempt to visit protected route -> redirect to /login
      if (next && next.requiresAuth && !AuthService.isLoggedIn()) {
        event.preventDefault();
        NotificationService.warning('Please sign in to access Nalam360.');
        $location.path('/login');
        return;
      }

      // 3. Authenticated user trying to visit /login or /register or /onboarding -> redirect to role dashboard
      if (AuthService.isLoggedIn() && next && (next.originalPath === '/login' || next.originalPath === '/register' || next.originalPath === '/onboarding')) {
        event.preventDefault();
        $location.path(AuthService.getDashboardRoute());
        return;
      }

      // 4. Role Authorization Guard
      if (next && next.roles && AuthService.isLoggedIn()) {
        var userRole = AuthService.getRole();
        if (next.roles.indexOf(userRole) === -1) {
          event.preventDefault();
          NotificationService.error('Access Denied. You do not have permission for this section.');
          $location.path(AuthService.getDashboardRoute());
          return;
        }
      }
    });
  }]);

})();
