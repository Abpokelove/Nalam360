(function () {
  'use strict';

  angular.module('Nalam360App').controller('DashboardController', [
    '$scope',
    'ApiFactory',
    'AuthService',
    'NotificationService',
    function ($scope, ApiFactory, AuthService, NotificationService) {

      $scope.user = AuthService.state.currentUser || { name: 'Patient', village: 'Melur' };
      $scope.loading = true;
      $scope.error = null;

      $scope.appointments = [];
      $scope.reminders = [];
      $scope.adminStats = null;

      function loadDashboardData() {
        $scope.loading = true;
        $scope.error = null;

        var promises = [
          ApiFactory.getAppointments(),
          ApiFactory.getReminders()
        ];

        if (AuthService.state.activeRole === 'admin') {
          promises.push(ApiFactory.getAdminSummary());
        }

        angular.element.element ? null : null; // Safe

        $scope.loading = true;
        
        // Execute promises using $q.all
        ApiFactory.getAppointments().then(function (appRes) {
          $scope.appointments = appRes;
          return ApiFactory.getReminders();
        }).then(function (remRes) {
          $scope.reminders = remRes;
          if (AuthService.state.activeRole === 'admin') {
            return ApiFactory.getAdminSummary().then(function (statsRes) {
              $scope.adminStats = statsRes;
            });
          }
        }).catch(function (err) {
          $scope.error = 'Unable to load dashboard information. Please try again.';
          NotificationService.error($scope.error);
        }).finally(function () {
          $scope.loading = false;
        });
      }

      $scope.toggleReminder = function (reminder) {
        ApiFactory.toggleReminderComplete(reminder.id).then(function (updated) {
          reminder.completed = updated.completed;
          NotificationService.success(updated.name + ' marked as ' + (updated.completed ? 'completed' : 'pending'));
        }).catch(function () {
          NotificationService.error('Failed to update reminder state.');
        });
      };

      $scope.getCompletedRemindersCount = function () {
        return ($scope.reminders || []).filter(function (r) { return r.completed; }).length;
      };

      // Watch for role changes to refresh data
      $scope.$watch('auth.activeRole', function () {
        loadDashboardData();
      });

      loadDashboardData();
    }
  ]);
})();
