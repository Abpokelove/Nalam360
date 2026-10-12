(function () {
  'use strict';

  angular.module('Nalam360App').factory('TranslationService', ['$rootScope', '$window', function ($rootScope, $window) {
    var STORAGE_KEY = 'nalam360_language';
    var state = { language: $window.localStorage.getItem(STORAGE_KEY) === 'ta' ? 'ta' : 'en' };
    var tamil = {
      'Nalam360 Healthcare': 'நலம்360 சுகாதாரம்',
      'Patient Portal': 'நோயாளர் தளம்',
      'Patient Portal Access': 'நோயாளர் தள அணுகல்',
      'Doctor Practice Workspace': 'மருத்துவர் பணியிடம்',
      'Admin Command Center': 'நிர்வாக மையம்',
      'Patient Dashboard': 'நோயாளர் முகப்பு',
      'Doctor Dashboard': 'மருத்துவர் முகப்பு',
      'Admin Dashboard': 'நிர்வாக முகப்பு',
      'Find Healthcare': 'சுகாதார சேவைகளைக் கண்டறியவும்',
      'Find Nearby Healthcare': 'அருகிலுள்ள சுகாதார சேவைகள்',
      'Find Care Directory': 'சிகிச்சை சேவை பட்டியல்',
      'Doctors Directory': 'மருத்துவர் பட்டியல்',
      'Care Appointments': 'சிகிச்சை சந்திப்புகள்',
      'Medication Tracker': 'மருந்து நினைவூட்டல்',
      'My Prescriptions': 'எனது மருந்துச் சீட்டுகள்',
      'Health Camps': 'சுகாதார முகாம்கள்',
      'Health Awareness': 'சுகாதார விழிப்புணர்வு',
      'Emergency Assistance': 'அவசர உதவி',
      'Profile & Support': 'சுயவிவரம் மற்றும் உதவி',
      'Locations & Facilities': 'இடங்கள் மற்றும் மருத்துவமனைகள்',
      'Sign In': 'உள்நுழைக',
      'Sign Out': 'வெளியேறு',
      'Register Patient Account': 'நோயாளர் கணக்கை பதிவு செய்யவும்',
      'Create Patient Account': 'நோயாளர் கணக்கை உருவாக்கவும்',
      'Save Profile Changes': 'சுயவிவர மாற்றங்களைச் சேமிக்கவும்',
      'Save Profile': 'சுயவிவரத்தைச் சேமிக்கவும்',
      'Cancel': 'ரத்து செய்',
      'Delete': 'நீக்கு',
      'Edit': 'திருத்து',
      'Save': 'சேமி',
      'Search': 'தேடல்',
      'Filter by Specialty': 'சிறப்புப் பிரிவின்படி வடிகட்டவும்',
      'Filter by Village Sector': 'கிராமத்தின்படி வடிகட்டவும்',
      'Village': 'கிராமம்',
      'Taluk': 'தாலுகா',
      'District': 'மாவட்டம்',
      'Healthcare facility': 'சுகாதார நிலையம்',
      'Primary Health Centre': 'முதன்மை சுகாதார நிலையம்',
      'Availability': 'கிடைக்கும் நிலை',
      'Accepting appointments': 'சந்திப்புகளை ஏற்கிறது',
      'Not accepting appointments': 'சந்திப்புகளை ஏற்கவில்லை',
      'Choose verified district': 'சரிபார்க்கப்பட்ட மாவட்டத்தைத் தேர்ந்தெடுக்கவும்',
      'Choose verified taluk': 'சரிபார்க்கப்பட்ட தாலுகாவைத் தேர்ந்தெடுக்கவும்',
      'Choose verified village': 'சரிபார்க்கப்பட்ட கிராமத்தைத் தேர்ந்தெடுக்கவும்',
      'Choose an open time': 'கிடைக்கும் நேரத்தைத் தேர்ந்தெடுக்கவும்',
      'Checking times...': 'நேரங்களைச் சரிபார்க்கிறது...',
      'Select Preferred Date': 'விருப்பமான தேதியைத் தேர்ந்தெடுக்கவும்',
      'Select Time Slot': 'நேரத்தைத் தேர்ந்தெடுக்கவும்',
      'Book Visit': 'சந்திப்பை பதிவு செய்க',
      'Book Consultation': 'மருத்துவ ஆலோசனையை பதிவு செய்க',
      'Confirm Appointment': 'சந்திப்பை உறுதிப்படுத்தவும்',
      'My Appointments': 'எனது சந்திப்புகள்',
      'No appointments found': 'சந்திப்புகள் இல்லை',
      'No verified local facilities': 'சரிபார்க்கப்பட்ட உள்ளூர் மருத்துவமனைகள் இல்லை',
      'No verified locations are configured': 'சரிபார்க்கப்பட்ட இடங்கள் அமைக்கப்படவில்லை',
      'No prescriptions recorded': 'மருந்துச் சீட்டுகள் பதிவு செய்யப்படவில்லை',
      'No completed consultations': 'முடிக்கப்பட்ட ஆலோசனைகள் இல்லை',
      'Medicine': 'மருந்து',
      'Dosage': 'அளவு',
      'Frequency': 'எத்தனை முறை',
      'Duration': 'கால அளவு',
      'Consultation notes': 'ஆலோசனை குறிப்புகள்',
      'Add medicine': 'மருந்தைச் சேர்க்கவும்',
      'Save prescription': 'மருந்துச் சீட்டைச் சேமிக்கவும்',
      'Update prescription': 'மருந்துச் சீட்டை புதுப்பிக்கவும்',
      'Mark visited': 'வந்ததாகக் குறிக்கவும்',
      'Not visited': 'வரவில்லை எனக் குறிக்கவும்',
      'Scheduled': 'திட்டமிடப்பட்டது',
      'Completed': 'முடிக்கப்பட்டது',
      'Cancelled': 'ரத்து செய்யப்பட்டது',
      'Not Visited': 'வரவில்லை',
      'Available': 'கிடைக்கிறது',
      'Unavailable': 'கிடைக்கவில்லை',
      'Your village': 'உங்கள் கிராமம்',
      'Nearby taluk': 'அருகிலுள்ள தாலுகா',
      'Your location has not been verified': 'உங்கள் இருப்பிடம் சரிபார்க்கப்படவில்லை',
      'Verified locations are not configured': 'சரிபார்க்கப்பட்ட இடங்கள் அமைக்கப்படவில்லை',
      'No verified local listings': 'சரிபார்க்கப்பட்ட உள்ளூர் சேவைகள் இல்லை',
      'No doctors found': 'மருத்துவர்கள் இல்லை',
      'No camps found': 'முகாம்கள் இல்லை',
      'No active camps scheduled': 'செயலில் உள்ள முகாம்கள் திட்டமிடப்படவில்லை',
      'No patients found': 'நோயாளிகள் இல்லை',
      'No patients assigned': 'நோயாளிகள் ஒதுக்கப்படவில்லை',
      'No guides found': 'வழிகாட்டிகள் இல்லை',
      'No location records': 'இடப் பதிவுகள் இல்லை',
      'No healthcare facilities': 'சுகாதார நிலையங்கள் இல்லை',
      'No verified locations are configured': 'சரிபார்க்கப்பட்ட இடங்கள் அமைக்கப்படவில்லை',
      'No medical device is connected. Clinical measurements are not available in this account.': 'மருத்துவ சாதனம் இணைக்கப்படவில்லை. இந்தக் கணக்கில் மருத்துவ அளவீடுகள் இல்லை.',
      'No patient device feed is connected. This dashboard does not display clinical measurements.': 'நோயாளர் சாதனத் தரவு இணைக்கப்படவில்லை. இந்த முகப்பில் மருத்துவ அளவீடுகள் காட்டப்படவில்லை.',
      'Full Name': 'முழுப் பெயர்',
      '10-Digit Mobile Number': '10 இலக்க கைப்பேசி எண்',
      'Account Password': 'கணக்கு கடவுச்சொல்',
      'Gender': 'பாலினம்',
      'Date of Birth': 'பிறந்த தேதி',
      'Mobile Number or Email Address': 'கைப்பேசி எண் அல்லது மின்னஞ்சல் முகவரி',
      'Password': 'கடவுச்சொல்',
      'Subject': 'தலைப்பு',
      'Your Message / Question': 'உங்கள் செய்தி / கேள்வி',
      'Submit Support Inquiry': 'உதவி கோரிக்கையை அனுப்பவும்',
      'Book Visit': 'சந்திப்பை பதிவு செய்க',
      'Cancel Visit': 'சந்திப்பை ரத்து செய்க',
      'New Appointment': 'புதிய சந்திப்பு',
      'Token ID': 'டோக்கன் எண்',
      'Date & Time': 'தேதி மற்றும் நேரம்',
      'Doctor': 'மருத்துவர்',
      'Specialty': 'சிறப்புப் பிரிவு',
      'Status': 'நிலை',
      'Actions': 'செயல்கள்',
      'Scheduled Visits': 'திட்டமிடப்பட்ட சந்திப்புகள்',
      'Daily Prescriptions': 'தினசரி மருந்துகள்',
      'Doses Completed Today': 'இன்று எடுத்த மருந்துகள்',
      'Local Health Sector': 'உள்ளூர் சுகாதாரப் பகுதி',
      'Scheduled Visits Today': 'இன்றைய சந்திப்புகள்',
      'Assigned Sector Patients': 'ஒதுக்கப்பட்ட பகுதி நோயாளிகள்',
      'Completed Consultations': 'முடிக்கப்பட்ட ஆலோசனைகள்',
      'Village Health Camps': 'கிராம சுகாதார முகாம்கள்',
      'Save health camp': 'சுகாதார முகாமைச் சேமிக்கவும்',
      'Schedule a health camp': 'சுகாதார முகாமைத் திட்டமிடவும்',
      'Camp title': 'முகாம் தலைப்பு',
      'Service category': 'சேவை வகை',
      'General medical': 'பொது மருத்துவம்',
      'Eye care': 'கண் பராமரிப்பு',
      'Dental': 'பல் மருத்துவம்',
      'Diabetes screening': 'நீரிழிவு பரிசோதனை',
      'Maternal and child health': 'தாய் மற்றும் குழந்தை நலம்',
      'Source URL': 'தகவல் மூல இணைப்பு',
      'Add location': 'இடத்தைச் சேர்க்கவும்',
      'Add healthcare facility': 'சுகாதார நிலையத்தைச் சேர்க்கவும்',
      'Facility name': 'சுகாதார நிலையப் பெயர்',
      'Facility type': 'நிலைய வகை',
      'Address (optional)': 'முகவரி (விருப்பமானது)',
      'Contact (optional)': 'தொடர்பு எண் (விருப்பமானது)',
      'Verified': 'சரிபார்க்கப்பட்டது',
      'Unverified': 'சரிபார்க்கப்படவில்லை',
      'Appointment status updated.': 'சந்திப்பு நிலை புதுப்பிக்கப்பட்டது.',
      'Profile details saved successfully!': 'சுயவிவர விவரங்கள் சேமிக்கப்பட்டன!',
      'Medication reminder added!': 'மருந்து நினைவூட்டல் சேர்க்கப்பட்டது!',
      'Health camp saved.': 'சுகாதார முகாம் சேமிக்கப்பட்டது.',
      'Prescription saved for the consultation.': 'ஆலோசனைக்கான மருந்துச் சீட்டு சேமிக்கப்பட்டது.',
      'Prescription updated.': 'மருந்துச் சீட்டு புதுப்பிக்கப்பட்டது.',
      'Please select both date and time.': 'தேதி மற்றும் நேரத்தைத் தேர்ந்தெடுக்கவும்.',
      'Choose a complete district, taluk, and village hierarchy.': 'முழுமையான மாவட்டம், தாலுகா, கிராமத் தொடரைத் தேர்ந்தெடுக்கவும்.',
      'The application API is unavailable. Changes cannot be saved.': 'செயலி API கிடைக்கவில்லை. மாற்றங்களைச் சேமிக்க முடியாது.',
      'Demo mode: records are held in memory and will not persist after the server restarts.': 'செயல்விளக்க முறை: பதிவுகள் தற்காலிக நினைவகத்தில் உள்ளன; சேவையகம் மறுதொடங்கும்போது இவை நீங்கும்.',
      'Loading...': 'ஏற்றுகிறது...',
      'Loading doctor directory...': 'மருத்துவர் பட்டியலை ஏற்றுகிறது...',
      'Loading community health camps...': 'சமூக சுகாதார முகாம்களை ஏற்றுகிறது...',
      'Loading appointment schedule...': 'சந்திப்பு அட்டவணையை ஏற்றுகிறது...',
      'Loading prescription records...': 'மருந்துச் சீட்டு பதிவுகளை ஏற்றுகிறது...'
    };

    function translate(value) {
      var text = String(value == null ? '' : value);
      return state.language === 'ta' ? (tamil[text.trim()] || text) : text;
    }

    return {
      state: state,
      translate: translate,
      setLanguage: function (language) {
        state.language = language === 'ta' ? 'ta' : 'en';
        $window.localStorage.setItem(STORAGE_KEY, state.language);
        $rootScope.$broadcast('nalam360:languageChanged');
      },
      toggle: function () {
        this.setLanguage(state.language === 'en' ? 'ta' : 'en');
      }
    };
  }]);

  angular.module('Nalam360App').filter('translate', ['TranslationService', function (TranslationService) {
    return function (value) { return TranslationService.translate(value); };
  }]);

  angular.module('Nalam360App').directive('nalamTranslatePage', ['TranslationService', function (TranslationService) {
    return {
      restrict: 'A',
      link: function (scope, element) {
        var originalText = new WeakMap();
        var originalAttributes = new WeakMap();
        var attributeNames = ['placeholder', 'title', 'aria-label'];

        function translateNode(node) {
          if (node.nodeType === Node.TEXT_NODE) {
            var current = node.nodeValue;
            if (!current || !current.trim() || current.indexOf('{{') !== -1) return;
            if (node.parentElement && (node.parentElement.classList.contains('ng-binding') || node.parentElement.hasAttribute('ng-bind'))) return;
            if (!originalText.has(node)) originalText.set(node, current);
            var source = originalText.get(node);
            var lead = source.match(/^\s*/)[0];
            var trail = source.match(/\s*$/)[0];
            var result = TranslationService.translate(source.trim());
            var translated = lead + result + trail;
            if (node.nodeValue !== translated) node.nodeValue = translated;
            return;
          }
          if (node.nodeType !== Node.ELEMENT_NODE) return;
          var attrs = originalAttributes.get(node) || {};
          attributeNames.forEach(function (name) {
            if (!node.hasAttribute(name)) return;
            if (attrs[name] === undefined) attrs[name] = node.getAttribute(name);
            if (attrs[name].indexOf('{{') !== -1) return;
            var translated = TranslationService.translate(attrs[name]);
            if (node.getAttribute(name) !== translated) node.setAttribute(name, translated);
          });
          originalAttributes.set(node, attrs);
          Array.prototype.forEach.call(node.childNodes, translateNode);
        }

        function applyTranslations() {
          translateNode(element[0]);
        }

        var observer = new MutationObserver(function (mutations) {
          mutations.forEach(function (mutation) {
            if (mutation.type === 'characterData') translateNode(mutation.target);
            else if (mutation.type === 'attributes') translateNode(mutation.target);
            else Array.prototype.forEach.call(mutation.addedNodes, translateNode);
          });
        });
        observer.observe(element[0], { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: attributeNames });
        var stopListening = scope.$on('nalam360:languageChanged', applyTranslations);
        applyTranslations();
        scope.$on('$destroy', function () {
          observer.disconnect();
          stopListening();
        });
      }
    };
  }]);
})();