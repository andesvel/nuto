// Apps whose links should open in the app instead of the web. Android gets
// an intent with the app's package and the web URL as fallback, so the
// system opens the app when it's installed and the page when it isn't.
// iOS has no such fallback: a scheme for a missing app goes nowhere. So
// `ios` is only set for apps nearly everyone has, and only used to leave
// in-app browsers; everything else goes to Safari and its universal links.

export interface DeepLinkApp {
  key: string;
  name: string;
  /** Hostnames (exact or as a suffix after a dot) this app owns */
  hosts: string[];
  /** Android package that handles these https links */
  android?: string;
  /**
   * iOS URL scheme for this URL, or null when there's none for that path.
   * Only for near-universal apps (see above).
   */
  ios?: (url: URL) => string | null;
}

const segments = (url: URL) => url.pathname.split("/").filter(Boolean);
const pathAndQuery = (url: URL) => `${url.pathname}${url.search}`;

export const DEEP_LINK_APPS: DeepLinkApp[] = [
  {
    key: "youtube-music",
    name: "YouTube Music",
    hosts: ["music.youtube.com"],
    android: "com.google.android.apps.youtube.music",
  },
  {
    key: "youtube",
    name: "YouTube",
    hosts: ["youtube.com", "youtu.be", "youtube-nocookie.com"],
    android: "com.google.android.youtube",
    ios: (url) => {
      if (url.hostname.endsWith("youtu.be")) {
        const [id] = segments(url);
        return id ? `youtube://watch?v=${id}` : null;
      }
      return `youtube://${pathAndQuery(url).replace(/^\//, "")}`;
    },
  },
  {
    key: "spotify",
    name: "Spotify",
    hosts: ["open.spotify.com", "spotify.link"],
    android: "com.spotify.music",
    ios: (url) => {
      // open.spotify.com/(intl-xx/)?<type>/<id>
      const parts = segments(url).filter((p) => !p.startsWith("intl-"));
      const [type, id] = parts;
      const types = ["track", "album", "artist", "playlist", "episode", "show", "user"];
      return type && id && types.includes(type) ? `spotify:${type}:${id}` : null;
    },
  },
  {
    key: "apple-music",
    name: "Apple Music",
    hosts: ["music.apple.com"],
    android: "com.apple.android.music",
  },
  {
    key: "soundcloud",
    name: "SoundCloud",
    hosts: ["soundcloud.com", "on.soundcloud.com"],
    android: "com.soundcloud.android",
  },
  {
    key: "deezer",
    name: "Deezer",
    hosts: ["deezer.com", "deezer.page.link"],
    android: "deezer.android.app",
  },
  {
    key: "amazon-music",
    name: "Amazon Music",
    hosts: ["music.amazon.com"],
    android: "com.amazon.mp3",
  },
  {
    key: "twitch",
    name: "Twitch",
    hosts: ["twitch.tv"],
    android: "tv.twitch.android.app",
  },
  {
    key: "netflix",
    name: "Netflix",
    hosts: ["netflix.com"],
    android: "com.netflix.mediaclient",
  },
  {
    key: "prime-video",
    name: "Prime Video",
    hosts: ["primevideo.com"],
    android: "com.amazon.avod.thirdpartyclient",
  },
  {
    key: "disney-plus",
    name: "Disney+",
    hosts: ["disneyplus.com"],
    android: "com.disney.disneyplus",
  },
  {
    key: "instagram",
    name: "Instagram",
    hosts: ["instagram.com"],
    android: "com.instagram.android",
  },
  {
    key: "threads",
    name: "Threads",
    hosts: ["threads.net", "threads.com"],
    android: "com.instagram.barcelona",
  },
  {
    key: "tiktok",
    name: "TikTok",
    hosts: ["tiktok.com"],
    android: "com.zhiliaoapp.musically",
  },
  {
    key: "twitter",
    name: "X",
    hosts: ["x.com", "twitter.com"],
    android: "com.twitter.android",
  },
  {
    key: "whatsapp",
    name: "WhatsApp",
    hosts: ["wa.me", "api.whatsapp.com", "chat.whatsapp.com"],
    android: "com.whatsapp",
    ios: (url) => {
      if (url.hostname === "chat.whatsapp.com") return null;
      const phone =
        url.hostname === "wa.me" ? segments(url)[0] : url.searchParams.get("phone");
      const text = url.searchParams.get("text");
      const query = new URLSearchParams();
      if (phone) query.set("phone", phone.replace(/\D/g, ""));
      if (text) query.set("text", text);
      return phone || text ? `whatsapp://send?${query}` : null;
    },
  },
  {
    key: "telegram",
    name: "Telegram",
    hosts: ["t.me", "telegram.me"],
    android: "org.telegram.messenger",
  },
  {
    key: "discord",
    name: "Discord",
    hosts: ["discord.gg", "discord.com"],
    android: "com.discord",
  },
  {
    key: "linkedin",
    name: "LinkedIn",
    hosts: ["linkedin.com", "lnkd.in"],
    android: "com.linkedin.android",
  },
  {
    key: "amazon",
    name: "Amazon",
    hosts: ["amazon.com", "amazon.com.mx", "amazon.es", "amazon.co.uk", "amazon.de", "amazon.com.br", "amzn.to", "a.co"],
    android: "com.amazon.mShop.android.shopping",
  },
  {
    key: "mercadolibre",
    name: "Mercado Libre",
    hosts: [
      "mercadolibre.com",
      "mercadolibre.com.mx",
      "mercadolibre.com.co",
      "mercadolibre.com.ar",
      "mercadolibre.cl",
      "mercadolivre.com.br",
    ],
    android: "com.mercadolibre",
  },
  {
    key: "google-maps",
    name: "Google Maps",
    hosts: ["maps.google.com", "maps.app.goo.gl", "goo.gl"],
    android: "com.google.android.apps.maps",
  },
];

function ownsHost(app: DeepLinkApp, hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^www\./, "").replace(/^m\./, "");
  return app.hosts.some((h) => host === h || host.endsWith(`.${h}`));
}

/** The app a destination URL belongs to, if Nuto knows how to open it. */
export function findDeepLinkApp(url: URL): DeepLinkApp | null {
  // google.com/maps is the one path-scoped entry
  if (/(^|\.)google\.[a-z.]+$/.test(url.hostname) && url.pathname.startsWith("/maps")) {
    return DEEP_LINK_APPS.find((a) => a.key === "google-maps") ?? null;
  }
  return DEEP_LINK_APPS.find((app) => ownsHost(app, url.hostname)) ?? null;
}

/**
 * Android intent that opens `url` in `pkg` when installed and loads
 * `fallback` (default: `url` itself) when it isn't. Without a package it
 * hands the URL to the default browser.
 */
export function androidIntent(url: URL, pkg?: string, fallback: string = url.toString()): string {
  const scheme = url.protocol.replace(":", "");
  const rest = url.toString().replace(/^https?:\/\//, "");
  const parts = [`scheme=${scheme}`];
  if (pkg) parts.push(`package=${pkg}`);
  parts.push(`S.browser_fallback_url=${encodeURIComponent(fallback)}`);
  return `intent://${rest}#Intent;${parts.join(";")};end`;
}
