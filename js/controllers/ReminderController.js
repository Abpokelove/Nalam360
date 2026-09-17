(function () {
  'use strict';

  angular.module('Nalam360App').controller('ReminderController', [
    '$scope',
    'ApiFactory',
    'NotificationService',
    function ($scope, ApiFactory, NotificationService) {

      $scope.loading = true;
      $scope.error = null;
      $scope.reminders = [];

      $scope.selectedSlotFilter = 'All'; // 'All', 'Morning', 'Afternoon', 'Night'

      // New Reminder Form
      $scope.isModalOpen = false;
      $scope.newReminder = {
        name: '',
        slot: 'Morning',
        instruction: 'After food'
      };
      $scope.submitting = false;

      function fetchReminders() {
        $scope.loading = true;
        $scope.error = null;

        ApiFactory.getReminders().then(function (result) {
          $scope.reminders = result;
          $scope.loading = false;
        }).catch(function (err) {
          $scope.loading = false;
          $scope.error = 'Unable to load medication reminders.';
          NotificationService.error($scope.error);
        });
      }

      $scope.filterBySlot = function (reminder) {
        if ($scope.selectedSlotFilter === 'All') return true;
        return reminder.slot === $scope.selectedSlotFilter;
      };

      $scope.openModal = function () {
        $scope.newReminder = { name: '', slot: 'Morning', instruction: 'After food' };
        $scope.isModalOpen = true;
      };

      $scope.closeModal = function () {
        $scope.isModalOpen = false;
      };

      $scope.addReminder = function () {
        if (!$scope.newReminder.name) {
          NotificationService.error('Medicine name is required.');
          return;
        }

        $scope.submitting = true;

        ApiFactory.createReminder($scope.newReminder).then(function (created) {
          $scope.reminders.unshift(created);
          $scope.submitting = false;
          $scope.closeModal();
          NotificationService.success('Medication reminder added!');
        }).catch(function () {
          $scope.submitting = false;
          NotificationService.error('Failed to add reminder.');
        });
      };

      $scope.toggleComplete = function (reminder) {
        ApiFactory.toggleReminderComplete(reminder.id).then(function (updated) {
          reminder.completed = updated.completed;
          NotificationService.success(updated.name + ' marked as ' + (updated.completed ? 'completed' : 'pending'));
        }).catch(function () {
          NotificationService.error('Failed to update status.');
        });
      };

      $scope.deleteReminder = function (reminder) {
        ApiFactory.deleteReminder(reminder.id).then(function () {
          var index = $scope.reminders.findIndex(function (r) { return r.id === reminder.id; });
          if (index !== -1) {
            $scope.reminders.splice(index, 1);
          }
          NotificationService.info('Reminder deleted.');
        }).catch(function () {
          NotificationService.error('Failed to delete reminder.');
        });
      };

      fetchReminders();
    }
  ]);
})();
