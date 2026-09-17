(function () {
  'use strict';

  var app = angular.module('Nalam360App');

  // Status Pill Directive
  app.directive('statusPill', function () {
    return {
      restrict: 'E',
      scope: {
        value: '@'
      },
      template: '<span class="status-pill" ng-class="value">{{ value | statusLabel }}</span>'
    };
  });

  // State Loading Spinner Component Directive
  app.directive('loadingSpinner', function () {
    return {
      restrict: 'E',
      scope: {
        message: '@'
      },
      template:
        '<div class="state-loading">' +
          '<div class="spinner"></div>' +
          '<span>{{ message || "Loading data..." }}</span>' +
        '</div>'
    };
  });

  // State Empty Component Directive
  app.directive('emptyState', function () {
    return {
      restrict: 'E',
      scope: {
        icon: '@',
        title: '@',
        desc: '@'
      },
      template:
        '<div class="state-empty">' +
          '<div class="state-empty-icon">' +
            '<span class="material-symbols-outlined">{{ icon || "inbox" }}</span>' +
          '</div>' +
          '<div class="state-empty-title">{{ title || "No records found" }}</div>' +
          '<div class="state-empty-desc" ng-if="desc">{{ desc }}</div>' +
        '</div>'
    };
  });

  // Real-Time HTML5 Canvas ECG Pulse Wave Vitals Monitor Directive
  app.directive('vitalsCanvas', ['$interval', function ($interval) {
    return {
      restrict: 'E',
      template: '<canvas class="vitals-chart-canvas" width="600" height="110" style="width: 100%; height: 110px; border-radius: 8px; background: #0f172a; display: block;"></canvas>',
      link: function (scope, element) {
        var canvas = element.find('canvas')[0];
        if (!canvas || !canvas.getContext) return;
        var ctx = canvas.getContext('2d');
        var width = canvas.width;
        var height = canvas.height;
        var step = 0;

        function draw() {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, width, height);

          // Subtle grid background
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1;
          for (var x = 0; x < width; x += 30) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
          }
          for (var y = 0; y < height; y += 20) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
          }

          // Animated ECG Pulse Waveform
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 2.5;
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#10b981';
          ctx.beginPath();

          var centerY = height / 2;
          for (var i = 0; i < width; i++) {
            var xPos = i;
            var pos = (i + step) % 180;
            var yPos = centerY;

            if (pos > 70 && pos < 78) {
              yPos = centerY - 25;
            } else if (pos >= 78 && pos < 88) {
              yPos = centerY + 38;
            } else if (pos >= 88 && pos < 100) {
              yPos = centerY - 15;
            }

            if (i === 0) {
              ctx.moveTo(xPos, yPos);
            } else {
              ctx.lineTo(xPos, yPos);
            }
          }
          ctx.stroke();
          ctx.shadowBlur = 0;

          step += 3;
        }

        var timer = $interval(draw, 40);
        element.on('$destroy', function () {
          $interval.cancel(timer);
        });
      }
    };
  }]);

})();
