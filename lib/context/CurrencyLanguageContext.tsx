'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CurrencyConfig } from '@/types';
import { INITIAL_SETTINGS } from '@/lib/data/initial-data';
import { DataStore } from '@/lib/store/data-store';
import { formatPrice } from '@/lib/utils';
import { getTranslation, SupportedLanguage } from '@/lib/i18n/translations';

interface CurrencyLanguageContextType {
  currency: CurrencyConfig;
  currencies: CurrencyConfig[];
  setCurrencyCode: (code: string) => void;
  formatAmount: (amountInINR: number) => string;
  formatPriceValue: (amountInINR: number) => string;
  language: string;
  languages: { code: string; name: string; nativeName: string }[];
  setLanguage: (lang: string) => void;
  t: (key: string, fallback?: string) => string;
  isAutoDetected: boolean;
  detectedCountry?: string;
}

const CurrencyLanguageContext = createContext<CurrencyLanguageContextType | undefined>(undefined);

const CURRENCY_STORAGE_KEY = 'ozeira_currency_v1';
const USER_SET_CURRENCY_KEY = 'ozeira_user_selected_currency_v1';
const LANGUAGE_STORAGE_KEY = 'ozeira_language_v1';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
];

// Country Code to Supported Currency Mapping
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  IN: 'INR',
  US: 'USD',
  CA: 'USD',
  AU: 'USD',
  NZ: 'USD',
  SG: 'USD',
  GB: 'GBP',
  UK: 'GBP',
  AE: 'AED',
  SA: 'AED',
  QA: 'AED',
  KW: 'AED',
  BH: 'AED',
  OM: 'AED',
  FR: 'EUR',
  DE: 'EUR',
  IT: 'EUR',
  ES: 'EUR',
  NL: 'EUR',
  BE: 'EUR',
  AT: 'EUR',
  PT: 'EUR',
  IE: 'EUR',
  GR: 'EUR',
  FI: 'EUR',
};

function detectCurrencyFromTimezone(): { currency: string; countryCode: string } {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz.includes('Kolkata') || tz.includes('Calcutta') || tz.includes('India')) {
      return { currency: 'INR', countryCode: 'IN' };
    }
    if (tz.startsWith('America/')) {
      return { currency: 'USD', countryCode: 'US' };
    }
    if (tz.includes('London')) {
      return { currency: 'GBP', countryCode: 'GB' };
    }
    if (tz.includes('Dubai') || tz.includes('Riyadh') || tz.includes('Qatar')) {
      return { currency: 'AED', countryCode: 'AE' };
    }
    if (tz.startsWith('Europe/')) {
      return { currency: 'EUR', countryCode: 'FR' };
    }
  } catch {}
  return { currency: 'INR', countryCode: 'IN' };
}

export function CurrencyLanguageProvider({ children }: { children: React.ReactNode }) {
  const [currencies, setCurrencies] = useState<CurrencyConfig[]>(INITIAL_SETTINGS.currencies);
  const [currency, setCurrency] = useState<CurrencyConfig>(INITIAL_SETTINGS.currencies[0]);
  const [language, setLanguageState] = useState<string>('en');
  const [isAutoDetected, setIsAutoDetected] = useState(false);
  const [detectedCountry, setDetectedCountry] = useState<string | undefined>(undefined);

  // 1. Initialize Currency & Detect Visitor Geolocation
  useEffect(() => {
    try {
      const settings = DataStore.getSettings();
      const activeCurrencies = (settings?.currencies?.length ? settings.currencies : INITIAL_SETTINGS.currencies).filter((c) => c.isEnabled);
      setCurrencies(activeCurrencies);

      const hasUserSelected = localStorage.getItem(USER_SET_CURRENCY_KEY) === 'true';
      const storedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY);

      if (hasUserSelected && storedCurrency) {
        const match = activeCurrencies.find((c) => c.code === storedCurrency);
        if (match) {
          setCurrency(match);
          return;
        }
      }

      // Auto-detect visitor's country & currency based on IP and timezone
      const tzInfo = detectCurrencyFromTimezone();
      const fallbackCode = tzInfo.currency;
      setDetectedCountry(tzInfo.countryCode);

      const tzMatch = activeCurrencies.find((c) => c.code === fallbackCode);
      if (tzMatch) {
        setCurrency(tzMatch);
        setIsAutoDetected(true);
      }

      // Attempt async IP geolocation detection
      fetch('https://ipapi.co/json/')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.country_code) {
            setDetectedCountry(data.country_code);
            const mappedCurrency = COUNTRY_TO_CURRENCY[data.country_code] || data.currency || fallbackCode;
            const geoMatch = activeCurrencies.find((c) => c.code === mappedCurrency);
            if (geoMatch && !localStorage.getItem(USER_SET_CURRENCY_KEY)) {
              setCurrency(geoMatch);
              localStorage.setItem(CURRENCY_STORAGE_KEY, geoMatch.code);
              setIsAutoDetected(true);
            }
          }
        })
        .catch(() => {
          // Keep timezone fallback
        });
    } catch (e) {
      console.error('Error loading currency settings', e);
    }
  }, []);

  // 2. Initialize Language & Setup Google Translate Widget
  useEffect(() => {
    try {
      const storedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY) || 'en';
      setLanguageState(storedLang);
      document.documentElement.lang = storedLang;
      document.documentElement.dir = storedLang === 'ar' ? 'rtl' : 'ltr';

      // If English (default), ensure all translation cookies are wiped
      if (storedLang === 'en' && typeof document !== 'undefined') {
        const domain = window.location.hostname;
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain};`;
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
      }

      // Setup Google Translate hidden element and script
      if (typeof window !== 'undefined') {
        if (!document.getElementById('google_translate_element')) {
          const div = document.createElement('div');
          div.id = 'google_translate_element';
          div.style.display = 'none';
          document.body.appendChild(div);
        }

        (window as any).googleTranslateElementInit = () => {
          try {
            new (window as any).google.translate.TranslateElement(
              {
                pageLanguage: 'en',
                includedLanguages: 'en,hi,fr,es,ar',
                autoDisplay: false,
                layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
              },
              'google_translate_element'
            );
          } catch (e) {}
        };

        if (!document.getElementById('google-translate-script')) {
          const script = document.createElement('script');
          script.id = 'google-translate-script';
          script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
          script.async = true;
          document.body.appendChild(script);
        }
      }
    } catch (e) {
      console.error('Error loading language settings', e);
    }
  }, []);

  const setCurrencyCode = (code: string) => {
    const found = currencies.find((c) => c.code === code);
    if (found) {
      setCurrency(found);
      localStorage.setItem(CURRENCY_STORAGE_KEY, code);
      localStorage.setItem(USER_SET_CURRENCY_KEY, 'true'); // Flag user explicit selection
      setIsAutoDetected(false);
    }
  };

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);

    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

      const domain = window.location.hostname;
      if (lang === 'en') {
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain};`;
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
        
        const selectElem = document.querySelector('.goog-te-combo') as HTMLSelectElement;
        if (selectElem) {
          selectElem.value = 'en';
          selectElem.dispatchEvent(new Event('change'));
        }
        window.location.reload();
        return;
      }

      const transVal = `/en/${lang}`;
      document.cookie = `googtrans=${transVal}; path=/; domain=${domain};`;
      document.cookie = `googtrans=${transVal}; path=/;`;

      // Trigger Google Translate dropdown if loaded
      const selectElem = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      if (selectElem) {
        selectElem.value = lang;
        selectElem.dispatchEvent(new Event('change'));
      } else {
        setTimeout(() => {
          window.location.reload();
        }, 150);
      }
    }
  };

  const t = useCallback(
    (key: string, fallback?: string): string => {
      return getTranslation(language as SupportedLanguage, key, fallback);
    },
    [language]
  );

  const formatAmount = (amountInINR: number): string => {
    return formatPrice(amountInINR, currency.code, currency.symbol, currency.rateAgainstINR);
  };

  return (
    <CurrencyLanguageContext.Provider
      value={{
        currency,
        currencies,
        setCurrencyCode,
        formatAmount,
        formatPriceValue: formatAmount,
        language,
        languages: SUPPORTED_LANGUAGES,
        setLanguage,
        t,
        isAutoDetected,
        detectedCountry,
      }}
    >
      {children}
    </CurrencyLanguageContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyLanguageContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyLanguageProvider');
  }
  return context;
}

export function useLanguage() {
  const context = useContext(CurrencyLanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a CurrencyLanguageProvider');
  }
  return {
    language: context.language,
    languages: context.languages,
    setLanguage: context.setLanguage,
    t: context.t,
  };
}

