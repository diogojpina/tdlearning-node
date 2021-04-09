"use strict";Object.defineProperty(exports, "__esModule", {value: true}); function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
 class LocaleService {
  

  constructor (i18nProvider) {
    LocaleService.i18nProvider = i18nProvider
  }

   getCurrentLocale () {
    return LocaleService.i18nProvider.getLocale()
  }

   getLocales () {
    return LocaleService.i18nProvider.getLocales()
  }

   setLocale (locale) {
    if (this.getLocales().indexOf(locale) !== -1) {
      LocaleService.i18nProvider.setLocale(locale)
    }
  }

   static translate (key, args = undefined) {
    return LocaleService.i18nProvider.__(key, args)
  }
} exports.LocaleService = LocaleService;
