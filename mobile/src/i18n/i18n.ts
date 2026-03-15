import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from './locales/en';
import tr from './locales/tr';

const LANGUAGE_KEY = 'solara_language';

const detectDeviceLanguage = (): string => {
    try {
        // Try to infer device locale (e.g. "tr-TR", "en-US")
        const locale = Intl?.DateTimeFormat?.().resolvedOptions().locale || '';
        if (locale.toLowerCase().startsWith('tr')) {
            return 'tr';
        }
        return 'en';
    } catch {
        // Fallback to Turkish if detection fails
        return 'tr';
    }
};

export const getStoredLanguage = async (): Promise<string> => {
    try {
        const lang = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (lang) {
            return lang;
        }
        const deviceLang = detectDeviceLanguage();
        await AsyncStorage.setItem(LANGUAGE_KEY, deviceLang);
        return deviceLang;
    } catch {
        return detectDeviceLanguage();
    }
};

export const storeLanguage = async (lang: string): Promise<void> => {
    try {
        await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    } catch {
        // ignore
    }
};

const initI18n = async () => {
    const storedLang = await getStoredLanguage();

    await i18n.use(initReactI18next).init({
        compatibilityJSON: 'v4',
        resources: {
            en: { translation: en },
            tr: { translation: tr },
        },
        lng: storedLang,
        fallbackLng: 'tr',
        interpolation: {
            escapeValue: false,
        },
    });
};

initI18n();

export default i18n;
