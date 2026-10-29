// Apps whose links should open in the app instead of the web. Android gets
// an intent with the app's package and the web URL as fallback, so the
// system opens the app when it's installed and the page when it isn't. iOS
// gets the app's URL scheme where it's documented and stable; elsewhere the
// https URL is left to the app's universal links.

export interface DeepLinkApp {
  key: string;
  name: string;
  /** Hostnames (exact or as a suffix after a dot) this app owns */
  hosts: string[];
  /** Android package that handles these https links */
  android?: string;
  /** iOS URL scheme for this URL, or null when there's none for that path */
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
    ios: (url) => `music://${url.host}${pathAndQuery(url)}`,
  },
  {
    key: "apple-podcasts",
    name: "Apple Podcasts",
    hosts: ["podcasts.apple.com"],
    ios: (url) => `podcasts://${url.host}${pathAndQuery(url)}`,
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
    ios: (url) =>
      url.hostname.endsWith("deezer.com") ? `deezer://www.deezer.com${url.pathname}` : null,
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
    ios: (url) => {
      const [channel, second] = segments(url);
      if (channel === "videos" && second) return `twitch://video/${second}`;
      return channel && !second ? `twitch://stream/${channel}` : null;
    },
  },
  {
    key: "netflix",
    name: "Netflix",
    hosts: ["netflix.com"],
    android: "com.netflix.mediaclient",
    ios: (url) => {
      const parts = segments(url);
      const at = parts.findIndex((p) => p === "title" || p === "watch");
      return at >= 0 && parts[at + 1]
        ? `nflx://www.netflix.com/${parts[at]}/${parts[at + 1]}`
        : null;
    },
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
    ios: (url) => {
      const [first, second] = segments(url);
      const reserved = ["p", "reel", "reels", "stories", "explore", "tv", "accounts"];
      // Profiles have a documented scheme; posts and reels go through
      // Instagram's universal links instead
      return first && !second && !reserved.includes(first)
        ? `instagram://user?username=${encodeURIComponent(first)}`
        : null;
    },
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
    ios: (url) => {
      const [user, kind, id] = segments(url);
      if (!user || ["i", "home", "search", "explore", "hashtag"].includes(user)) return null;
      if (kind === "status" && id && /^\d+$/.test(id)) return `twitter://status?id=${id}`;
      return kind ? null : `twitter://user?screen_name=${encodeURIComponent(user)}`;
    },
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
    ios: (url) => {
      const [name, post] = segments(url);
      if (!name || name.startsWith("+") || name === "joinchat") return null;
      return post && /^\d+$/.test(post)
        ? `tg://resolve?domain=${name}&post=${post}`
        : `tg://resolve?domain=${name}`;
    },
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
    ios: (url) =>
      url.hostname.includes("amazon.")
        ? `com.amazon.mobile.shopping.web://${url.host}${pathAndQuery(url)}`
        : null,
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
    ios: (url) =>
      url.hostname === "goo.gl" && !url.pathname.startsWith("/maps")
        ? null
        : `comgooglemapsurl://${url.host}${pathAndQuery(url)}`,
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
