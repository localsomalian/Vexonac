"use client";
import { createI18nClient } from "next-international/client";

export const {
  useI18n,
  useScopedI18n,
  I18nProviderClient,
  useChangeLocale,
  useCurrentLocale,
} = createI18nClient({
  en: () => import("./en"),
  fr: () => import("./fr"),
  de: () => import("./de"),
  es: () => import("./es"),
  pt: () => import("./pt"),
  it: () => import("./it"),
  nl: () => import("./nl"),
  ko: () => import("./ko"),
});

export const locales = [
  {
    code: "en",
    name: "English",
  },
  {
    code: "fr",
    name: "Français",
  },
  {
    code: "es",
    name: "Español",
  },
  {
    code: "de",
    name: "Deutsch",
  },
  {
    code: "pt",
    name: "Português",
  },
  {
    code: "it",
    name: "Italiano",
  },
  {
    code: "nl",
    name: "Nederlands",
  },
  {
    code: "ko",
    name: "한국어",
  },
] as const;
