(function () {
  'use strict';

  angular.module('Nalam360App').factory('NotificationService', ['$timeout', function ($timeout) {
    var toasts = [];

    function show(message, type, duration) {
      var id = 'toast_' + Date.now();
      var toast = {
        id: id,
        message: message,
        type: type || 'success' // 'success', 'error', 'warning'
      };
      toasts.push(toast);

      $timeout(function () {
        remove(id);
      }, duration || 4000);
    }

    function remove(id) {
      var index = toasts.findIndex(function (t) { return t.id === id; });
      if (index !== -1) {
        toasts.splice(index, 1);
      }
    }

    return {
      toasts: toasts,
      show: show,
      success: function (msg) { show(msg, 'success'); },
      error: function (msg) { show(msg, 'error'); },
      warning: function (msg) { show(msg, 'warning'); },
      remove: remove
    };
  }]);
})();
