(function () {
  'use strict';

  var app = angular.module('Nalam360App');

  // Capitalize status text
  app.filter('statusLabel', function () {
    return function (value) {
      if (!value) return '';
      return String(value).replace(/^./, function (letter) {
        return letter.toUpperCase();
      });
    };
  });

  // Extract 2-letter uppercase initials
  app.filter('initials', function () {
    return function (value) {
      if (!value) return 'N360';
      var parts = String(value).trim().split(/\s+/);
      if (parts.length === 1) {
        return parts[0].substring(0, 2).toUpperCase();
      }
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };
  });

  // Filter items by village name
  app.filter('villageFilter', function () {
    return function (items, villageName) {
      if (!items || !villageName) return items;
      return items.filter(function (item) {
        return (item.village || '').toLowerCase() === villageName.toLowerCase();
      });
    };
  });

  // Format INR Currency (₹)
  app.filter('inrCurrency', function () {
    return function (amount) {
      if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
      return '₹' + Number(amount).toLocaleString('en-IN');
    };
  });

})();
