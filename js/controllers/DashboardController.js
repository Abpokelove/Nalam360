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
      function loadDashboardData() {
        $scope.loading = true;
        $scope.error = null;

        ApiFactory.getAppointments().then(function (appRes) {
          $scope.appointments = appRes;
          return ApiFactory.getReminders();
        }).then(function (remRes) {
          $scope.reminders = remRes;
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
      $scope.$watch(function () { return AuthService.getRole(); }, function () {
        loadDashboardData();
      });

      loadDashboardData();
    }
  ]);
})();
