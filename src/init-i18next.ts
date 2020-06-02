import i18next, { LanguageDetectorModule, Services, InitOptions } from 'i18next';
import { initReactI18next } from 'react-i18next';
import translationDE from './locales/de/translation.json';
import translationEN from './locales/en/translation.json';
import moment from 'moment';
import 'moment/locale/de';
import 'moment/locale/en-gb';
import * as RNLocalize from "react-native-localize";

console.log('RNLocalize.getLocales:', RNLocalize.getLocales());
console.log('RNLocalize.getTimeZone:', RNLocalize.getTimeZone());

const d = new Date();
console.log('TimezoneOffset:', d.getTimezoneOffset());

const currentLanguage = RNLocalize.getLocales()[0].languageCode == 'de' ? 'de' : 'en';

moment.locale(currentLanguage);

const languageDetector: LanguageDetectorModule = {
    type: 'languageDetector',
    init: (services: Services, detectorOptions: object, i18nextOptions: InitOptions) => { },
    detect: () => currentLanguage,
    cacheUserLanguage: (lng: string) => { },
};

function zeroFill(number: number, length: number) {
    return (Array(length).join('0') + number).slice(-length);
}

i18next
    .use(languageDetector)
    .use(initReactI18next)
    .init({
        fallbackLng: 'de',
        debug: true,
        resources: {
            de: {
                translation: translationDE,
            },
            en: {
                translation: translationEN,
            }
        },
        interpolation: {
            format: function (value, format, lng) {
                if (value instanceof Date) return moment(value).format(format);
                else if (moment.isMoment(value)) return value.format(format);
                else if (moment.isDuration(value)) return Math.floor(value.asHours()) + ':' + zeroFill(value.minutes(), 2);
                else return value;
            }
        }
    });
