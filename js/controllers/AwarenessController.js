(function () {
  'use strict';

  angular.module('Nalam360App').controller('AwarenessController', [
    '$scope',
    'ApiFactory',
    'NotificationService',
    function ($scope, ApiFactory, NotificationService) {

      $scope.loading = true;
      $scope.error = null;
      $scope.articles = [];
      $scope.selectedCategory = 'All';
      $scope.categories = ['All', 'General Health', 'Cardiology', 'Pediatrics'];

      function fetchArticles() {
        $scope.loading = true;
        $scope.error = null;

        ApiFactory.getAwarenessArticles().then(function (result) {
          $scope.articles = result;
          $scope.loading = false;
        }).catch(function (err) {
          $scope.loading = false;
          $scope.error = 'Unable to load health awareness guides.';
          NotificationService.error($scope.error);
        });
      }

      $scope.filterCategory = function (art) {
        if ($scope.selectedCategory === 'All') return true;
        return art.category === $scope.selectedCategory;
      };

      fetchArticles();
    }
  ]);
})();
