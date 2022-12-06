import i18next, { LanguageDetectorModule, Services, InitOptions } from 'i18next';
import { initReactI18next } from 'react-i18next';
import translationDE from './locales/de/translation.json';
import translationEN from './locales/en/translation.json';
import moment from 'moment';
import 'moment/locale/de';
import 'moment/locale/en-gb';
import * as RNLocalize from "react-native-localize";
import { Platform, PlatformAndroidStatic } from "react-native";

const d = new Date();
console.log('TimezoneOffset:', d.getTimezoneOffset());

const model = (Platform as PlatformAndroidStatic).constants.Model;
  
const currentLanguage = model.startsWith('Subsystem for Android') || RNLocalize.getLocales()[0].languageCode == 'de' ? 'de' : 'en';
console.log('currentLanguage:', currentLanguage);

moment.locale(currentLanguage);

const languageDetector: LanguageDetectorModule = {
    type: 'languageDetector',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    init: (services: Services, detectorOptions: unknown, i18nextOptions: InitOptions) => { },
    detect: () => currentLanguage,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    cacheUserLanguage: (lng: string) => { },
};

function zeroFill(number: number, length: number) {
    return (Array(length).join('0') + number).slice(-length);
}

i18next
    .use(languageDetector)
    .use(initReactI18next)
    .init({
        compatibilityJSON: 'v3',
        fallbackLng: 'de',
        debug: false,
        resources: {
            de: {
                translation: translationDE,
            },
            en: {
                translation: translationEN,
            }
        },
        interpolation: {
            format: function (value, format) {
                if (value instanceof Date) return moment(value).format(format);
                else if (moment.isMoment(value)) return value.format(format);
                else if (moment.isDuration(value)) return Math.floor(value.asHours()) + ':' + zeroFill(value.minutes(), 2);
                else return value;
            }
        }
    });
