import { LOCALE_TAGS, type Locale, type Messages } from "@/app/i18n";

// Display names for the attribution keys stored with each click
const APP_NAMES: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  messenger: "Messenger",
  threads: "Threads",
  tiktok: "TikTok",
  whatsapp: "WhatsApp",
  twitter: "X (Twitter)",
  linkedin: "LinkedIn",
  snapchat: "Snapchat",
  line: "LINE",
  wechat: "WeChat",
  telegram: "Telegram",
  gsa: "Google App",
  pinterest: "Pinterest",
  reddit: "Reddit",
  discord: "Discord",
  kakaotalk: "KakaoTalk",
};

export function appLabel(key: string | null, t: Messages): string {
  if (key === null) return t.analytics.browser;
  return APP_NAMES[key] ?? t.analytics.otherApp;
}

export function deviceLabel(key: string | null, t: Messages): string {
  const names = t.analytics.deviceNames;
  return key && key in names ? names[key as keyof typeof names] : t.analytics.unknown;
}

const regionNames = new Map<Locale, Intl.DisplayNames>();

export function countryLabel(code: string | null, locale: Locale, t: Messages): string {
  if (!code || code === "XX" || code === "T1") return t.analytics.unknown;
  let names = regionNames.get(locale);
  if (!names) {
    names = new Intl.DisplayNames([LOCALE_TAGS[locale]], { type: "region" });
    regionNames.set(locale, names);
  }
  try {
    return names.of(code) ?? code;
  } catch {
    return code;
  }
}
