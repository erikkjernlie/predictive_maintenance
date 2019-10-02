import { Locale } from "../types/locale";

function getLocale(): Locale {
  const locale: string | undefined = localStorage["locale"];

  switch (locale) {
    case "en":
    case "nb":
      return locale;
    default:
      return "en";
  }
}

export function setLocale(locale: string) {
  localStorage.setItem("locale", locale);
}

export default getLocale();
