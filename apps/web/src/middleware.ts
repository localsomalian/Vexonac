import { createI18nMiddleware } from "next-international/middleware";
import { NextRequest } from "next/server";

const I18nMiddleware = createI18nMiddleware({
  locales: ["en", "fr", "de", "es", "pt", "it", "nl", "ko"],
  defaultLocale: "en",
  urlMappingStrategy: "rewriteDefault",
});

export function middleware(request: NextRequest) {
  // Apply i18n middleware for all requests
  return I18nMiddleware(request);
}

export const config = {
  matcher: [
    "/((?!api|api-docs|static|.*\\..*|_next|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest).*)",
  ],
};
