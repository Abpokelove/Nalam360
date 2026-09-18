(function () {
  'use strict';

  angular.module('Nalam360App').controller('AuthController', [
    '$scope',
    '$location',
    'AuthService',
    'NotificationService',
    function ($scope, $location, AuthService, NotificationService) {

      $scope.selectedRole = 'patient'; // Default active role tab

      $scope.loginForm = {
        identity: 'patient@nalam360.test',
        password: 'patient123'
      };

      $scope.registerForm = {
        name: '',
        mobile: '',
        village: '',
        gender: 'Male',
        dob: '',
        password: ''
      };

      $scope.villagesList = ['Melur', 'Karur', 'Hosur', 'Sivakasi', 'Pollachi', 'Tenkasi', 'Periyakulam'];
      $scope.loading = false;
      $scope.errorMsg = null;

      // Role Tab Switcher (Patient, Doctor, Admin)
      $scope.selectRole = function (role) {
        $scope.selectedRole = role;
        $scope.errorMsg = null;

        if (role === 'patient') {
          $scope.loginForm.identity = 'patient@nalam360.test';
          $scope.loginForm.password = 'patient123';
        } else if (role === 'doctor') {
          $scope.loginForm.identity = 'doctor@nalam360.test';
          $scope.loginForm.password = 'doctor123';
        } else if (role === 'admin') {
          $scope.loginForm.identity = 'admin@nalam360.test';
          $scope.loginForm.password = 'admin123';
        }
      };

      // 1-Click Shortcut Credentials Fillers
      $scope.fillDemoPatient = function () { $scope.selectRole('patient'); };
      $scope.fillDemoDoctor = function () { $scope.selectRole('doctor'); };
      $scope.fillDemoAdmin = function () { $scope.selectRole('admin'); };

      // Real-Time Live Validation Indicators
      $scope.isIdentityValid = function () {
        var val = ($scope.loginForm.identity || '').trim();
        if (!val) return false;
        var isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
        var isMobile = /^\d{10}$/.test(val.replace(/\D/g, ''));
        return isEmail || isMobile;
      };

      $scope.isPasswordValid = function () {
        var pwd = $scope.loginForm.password || '';
        return pwd.length >= 6;
      };

      // Register Real-Time Live Validation Indicators
      $scope.isRegisterNameValid = function () {
        return ($scope.registerForm.name || '').trim().length >= 2;
      };

      $scope.isRegisterMobileValid = function () {
        return /^\d{10}$/.test(($scope.registerForm.mobile || '').replace(/\D/g, ''));
      };

      $scope.isRegisterVillageValid = function () {
        return !!$scope.registerForm.village;
      };

      $scope.isRegisterPasswordValid = function () {
        return ($scope.registerForm.password || '').length >= 4;
      };

      // Submit Login
      $scope.submitLogin = function () {
        $scope.errorMsg = null;

        if (!$scope.isIdentityValid()) {
          $scope.errorMsg = 'Please enter a valid email address or 10-digit mobile number.';
          return;
        }

        if (!$scope.isPasswordValid()) {
          $scope.errorMsg = 'Password must be at least 4 characters long.';
          return;
        }

        $scope.loading = true;

        AuthService.login({
          mobile: $scope.loginForm.identity,
          password: $scope.loginForm.password
        }).then(function (result) {
          $scope.loading = false;
          NotificationService.success('Welcome back, ' + result.user.name + '!');
          $location.path(AuthService.getDashboardRoute());
        }).catch(function (error) {
          $scope.loading = false;
          $scope.errorMsg = error.message || 'Invalid credentials. Please check your login details.';
          NotificationService.error($scope.errorMsg);
        });
      };

      // Submit Register
      $scope.submitRegister = function () {
        $scope.errorMsg = null;

        if (!$scope.isRegisterNameValid() || !$scope.isRegisterMobileValid() || !$scope.isRegisterPasswordValid()) {
          $scope.errorMsg = 'Please fulfill all highlighted validation requirements.';
          return;
        }

        $scope.loading = true;

        AuthService.register($scope.registerForm).then(function (result) {
          $scope.loading = false;
          NotificationService.success('Account created successfully! Welcome to Nalam360.');
          $location.path('/login');
        }).catch(function (error) {
          $scope.loading = false;
          $scope.errorMsg = error.message || 'Registration failed.';
          NotificationService.error($scope.errorMsg);
        });
      };

    }
  ]);
})();
