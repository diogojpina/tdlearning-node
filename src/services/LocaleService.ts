import I18n from 'i18n'
export class LocaleService {
  static i18nProvider: I18n

  constructor (i18nProvider) {
    LocaleService.i18nProvider = i18nProvider
  }

  public getCurrentLocale (): string {
    return LocaleService.i18nProvider.getLocale()
  }

  public getLocales (): string[] {
    return LocaleService.i18nProvider.getLocales()
  }

  public setLocale (locale): void {
    if (this.getLocales().indexOf(locale) !== -1) {
      LocaleService.i18nProvider.setLocale(locale)
    }
  }

  public static translate (key: string, args = undefined): string {
    return LocaleService.i18nProvider.__(key, args)
  }
}
