(function () {
  'use strict';

  angular.module('Nalam360App').controller('MainController', [
    '$scope',
    '$location',
    '$timeout',
    'AuthService',
    'NotificationService',
    function ($scope, $location, $timeout, AuthService, NotificationService) {

      $scope.auth = AuthService.state;
      $scope.authService = AuthService;
      $scope.toasts = NotificationService.toasts;
      $scope.isSidebarOpen = false;
      $scope.selectedLang = 'en';

      var pageTitles = {
        '/onboarding': 'Welcome to Nalam360',
        '/login': 'Portal Sign In',
        '/register': 'Create Patient Account',

        '/patient/dashboard': 'Patient Overview',
        '/patient/healthcare': 'Find Care Directory',
        '/patient/doctors': 'Doctor Network',
        '/patient/appointments': 'Care Schedule',
        '/patient/reminders': 'Medication Tracker',
        '/patient/camps': 'Community Health Camps',
        '/patient/awareness': 'Health Guides',
        '/patient/emergency': 'Emergency Assistance',
        '/patient/profile': 'Patient Profile & Support',

        '/doctor/dashboard': 'Doctor Workspace',
        '/doctor/patients': 'Sector Patients Roster',
        '/doctor/appointments': 'Doctor Schedule',
        '/doctor/camps': 'Health Camps Roster',
        '/doctor/awareness': 'Awareness Guides',
        '/doctor/emergency': 'Emergency Hotlines Desk',
        '/doctor/profile': 'Doctor Settings',

        '/admin/dashboard': 'Admin Command Center',
        '/admin/users': 'Admin - User & Role Management',
        '/admin/doctors': 'Admin - Doctor Directory',
        '/admin/camps': 'Admin - Health Camps',
        '/admin/awareness': 'Admin - Health Guides',
        '/admin/emergency': 'Admin - Emergency Hotlines',
        '/admin/profile': 'Admin Settings'
      };

      $scope.isAuthPage = function () {
        var path = $location.path();
        return path === '/onboarding' || path === '/login' || path === '/register';
      };

      $scope.getCurrentPageTitle = function () {
        var path = $location.path();
        return pageTitles[path] || 'Rural Care Portal';
      };

      $scope.isActiveRoute = function (route) {
        return $location.path() === route;
      };

      $scope.goToDashboard = function () {
        $location.path(AuthService.getDashboardRoute());
      };

      $scope.finishOnboarding = function () {
        AuthService.completeOnboarding();
        NotificationService.success('Welcome to Nalam360! Please sign in.');
        $location.path('/login');
      };

      $scope.resetDevelopmentState = function () {
        AuthService.resetOnboarding();
        NotificationService.info('Development state reset. Returning to onboarding.');
        $location.path('/onboarding');
      };

      $scope.toggleSidebar = function () {
        $scope.isSidebarOpen = !$scope.isSidebarOpen;
      };

      $scope.closeSidebar = function () {
        $scope.isSidebarOpen = false;
      };

      $scope.toggleLanguage = function () {
        $scope.selectedLang = $scope.selectedLang === 'en' ? 'ta' : 'en';
        var langName = $scope.selectedLang === 'en' ? 'English' : 'Tamil (தமிழ்)';
        NotificationService.success('Language changed to ' + langName);
      };

      $scope.logout = function () {
        AuthService.logout();
        NotificationService.info('You have signed out.');
        $timeout(function () {
          $location.path('/login');
        });
      };

      $scope.removeToast = function (id) {
        NotificationService.remove(id);
      };

      $scope.$on('$routeChangeSuccess', function () {
        $scope.isSidebarOpen = false;
      });
    }
  ]);
})();
