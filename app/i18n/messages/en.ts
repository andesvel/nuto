import {
  MAX_LONG_URL_LENGTH,
  MAX_PASSWORD_LENGTH,
  MAX_SHORT_CODE_LENGTH,
} from "@/utils/validate-link-input";

// Source of truth for every UI string. Other locales must match this shape
// (enforced by the Messages type). Strings that take values are functions.
export const en = {
  meta: {
    homeTitle: "Nuto · Short links that open in native apps",
    homeDescription:
      "Free URL shortener whose links skip Instagram and TikTok in-app browsers and open YouTube, Spotify and Apple Music in their native apps. Password protection and expiring links included.",
    privacyTitle: "Privacy policy · Nuto",
    privacyDescription:
      "What data Nuto processes and why: account and link data, click counts by country and user agent, no stored IP addresses, and encrypted link passwords.",
    disclaimerTitle: "Disclaimer · Nuto",
    disclaimerDescription:
      "Nuto is a free, non-commercial URL shortener. Read how it handles user-created links, what content is prohibited and how to report an abusive short link.",
    dashboardTitle: "Dashboard · Nuto",
    analyticsTitle: "Analytics · Nuto",
    signInTitle: "Sign in · Nuto",
    signUpTitle: "Sign up · Nuto",
    gateTitle: (slug: string) => `Opening ${slug} · Nuto`,
    ogImageAlt: "Nuto: short links that open in native apps",
    appDescription:
      "URL shortener whose links escape in-app browsers and open YouTube, Spotify and other links in their native apps.",
    features: [
      "Escape Instagram, TikTok and Facebook in-app browsers",
      "Open YouTube, Spotify, Netflix, Amazon and 20+ other apps' links in their native apps",
      "Custom short codes",
      "Password-protected links",
      "Expiring links",
      "Click counts",
    ],
  },
  common: {
    cancel: "Cancel",
    clear: "Clear",
    loading: "Loading",
    togglePassword: "Toggle password visibility",
    showPassword: "Show password",
    hidePassword: "Hide password",
  },
  header: {
    goToDashboard: "Go to dashboard",
    github: "Nuto on GitHub",
    signIn: "Sign In",
    searchPlaceholder: "Search your links",
    links: "links",
  },
  theme: {
    change: "Change theme",
    title: "Theme",
    light: "Light",
    dark: "Dark",
    system: "System",
  },
  language: {
    label: "Language",
    suggestion: "This page is also available in English.",
    switchTo: "View in English",
    dismiss: "Dismiss",
  },
  inApp: {
    title: (app: string | null) =>
      app
        ? `You're in ${app}'s built-in browser.`
        : "You're in an app's built-in browser.",
    body: "Open Nuto in your browser to sign in and use it fully.",
    open: "Open in browser",
    dismiss: "Dismiss",
  },
  footer: {
    madeBy: "Made by Andres using",
    disclaimer: "Disclaimer",
    privacy: "Privacy policy",
    reportBug: "Report a bug",
  },
  hero: {
    titleStart: "Stop losing visitors to clunky",
    titleInApp: "in-app",
    titleEnd: "browsers",
    subtitle:
      "Short links for your bio and posts. Tapped inside Instagram or TikTok, they skip the built-in browser and open YouTube, Spotify or the visitor's own browser instead.",
    getStarted: "Get started",
    learnMore: "Learn more",
    howItWorks: "How it works",
  },
  howItWorks: {
    title: "How it works",
    intro:
      "Instagram, TikTok and Facebook open links in a cramped built-in browser where people aren't signed in to anything. Nuto sends them to the app or browser they already use.",
    steps: [
      {
        title: "Shorten your link",
        body: "Paste a YouTube, Spotify or any other URL. Pick a custom short code or let Nuto generate one.",
      },
      {
        title: "Share it anywhere",
        body: "Put it in your Instagram bio, a TikTok comment or a story.",
      },
      {
        title: "It opens in the right app",
        body: "When someone taps it inside an app, Nuto skips the in-app browser and opens their real browser or the native app.",
      },
    ],
  },
  features: {
    title: "Why Nuto",
    items: {
      bypass: {
        title: "Bypass in-app browsers",
        body: "Taps from Instagram, TikTok or Facebook leave the built-in browser and open in Safari or the phone's default browser.",
      },
      native: {
        title: "Launch native apps",
        body: "YouTube, Spotify, Apple Music, Netflix, Twitch, Instagram, X, WhatsApp, Telegram, Amazon, Google Maps and more open straight in their apps, on iPhone and Android, falling back to the web when the app isn't installed.",
      },
      password: {
        title: "Password-protected links",
        body: "Visitors type a password before they're redirected. It's stored hashed, and repeated wrong guesses are rate limited.",
      },
      expiry: {
        title: "Expiring links",
        body: "Pick a date and time; after it, the link stops redirecting. The dashboard shows clicks and the last visit for each link.",
      },
    },
    disclaimerBefore: "Please review the",
    disclaimerLink: "disclaimer",
    disclaimerAfter: "before sharing sensitive content.",
  },
  nameOrigin: {
    title: "What does “Nuto” mean?",
    bodyStart:
      "It's short for “diminuto”, the Spanish word for tiny. We take your messy URLs and make them",
    bodyEnd: "so they're easy to share and never break in mobile apps.",
  },
  faq: {
    title: "Frequently asked questions",
    items: [
      {
        question: "What is an in-app browser?",
        answer:
          "It's the built-in web view that apps like Instagram, TikTok and Facebook use when you tap a link. You aren't signed in to anything there, and links to YouTube or Spotify play in a cramped page instead of the app.",
      },
      {
        question: "How does Nuto open links in the native app?",
        answer:
          "Nuto checks where the link was tapped. Links to apps it knows (YouTube, YouTube Music, Spotify, Apple Music and Podcasts, SoundCloud, Deezer, Twitch, Netflix, Instagram, X, WhatsApp, Telegram, Amazon, Google Maps and others) open in that app on iPhone and Android, or on the web if it isn't installed. Other links leave in-app browsers like Instagram, TikTok or Facebook for Safari or Chrome. If an app blocks that, Nuto shows how to open the link in the browser. Computers get a normal redirect.",
      },
      {
        question: "Is Nuto free?",
        answer:
          "Yes. Nuto is a free, non-commercial project. You only need a free account to create links, and each account has a link limit.",
      },
      {
        question: "Can I protect a link with a password?",
        answer:
          "Yes. Visitors have to enter the password before they're redirected. It's stored hashed with a salt, never in plain text, and repeated wrong attempts are rate limited.",
      },
      {
        question: "Can a link expire?",
        answer:
          "Yes. Set an expiry date and time when you create or edit a link. After it passes, the link stops redirecting and shows that it has expired.",
      },
      {
        question: "What does Nuto record when someone clicks a link?",
        answer:
          "Only the time, the visitor's country and their browser's user agent, so you can see click counts. Nuto never stores IP addresses.",
      },
    ],
  },
  cta: {
    title: "Ready to begin?",
    body: "Create a free account and start shortening links that open in the right place.",
  },
  dashboard: {
    noResults: (query: string) => `No results for “${query}”.`,
    emptyTitle: "No links created yet",
    emptyBody: "Get started by creating your first short link.",
    createFirst: "Create your first link",
    copyFailed: "Failed to copy link",
    loadFailed: "Failed to fetch links",
    shareTitle: "Short link",
  },
  sort: {
    trigger: (label: string, order: string) => `Sort links: ${label}, ${order}`,
    sortBy: "Sort by",
    order: "Order",
    reset: (label: string) => `Reset to ${label.toLowerCase()}`,
    keys: {
      lastClicked: {
        label: "Recent activity",
        orders: { desc: "Most recent first", asc: "Least recent first" },
      },
      createdAt: {
        label: "Date created",
        orders: { desc: "Newest first", asc: "Oldest first" },
      },
      clicks: {
        label: "Clicks",
        orders: { desc: "Most clicks", asc: "Fewest clicks" },
      },
      expiresAt: {
        label: "Expiration",
        orders: { asc: "Expiring soonest", desc: "Expiring latest" },
      },
      shortCode: {
        label: "Short code",
        orders: { asc: "A → Z", desc: "Z → A" },
      },
    },
  },
  linkCard: {
    noPassword: "No password",
    clicks: (count: string, n: number) => `${count} ${n === 1 ? "click" : "clicks"}`,
    noExpiry: "Won't expire",
  },
  linkForm: {
    newLink: "New Link",
    createTitle: "Create a new short link",
    createDescription: "Create a new short link by filling out the form below.",
    editTitle: "Edit link",
    editDescription: "Change the destination, short code, password or expiry of this link.",
    longUrl: "Long URL",
    shortCode: "Short code",
    randomize: "Randomize",
    onlyAlphanumeric: "Only letters and numbers are allowed.",
    reserved: "This short code is reserved. Please choose another one.",
    setPassword: "Set password",
    passwordPlaceholder: "Protect this link",
    setExpiry: "Set due date",
    selectDate: "Select date",
    time: "Time",
    create: "Create",
    creating: "Creating",
    edit: "Edit",
    editing: "Editing",
    unlock: "Unlock",
    unlockTitle: "Be careful",
    unlockBody:
      "This may break existing links if they have already been shared. Make sure to share the new link with your audience.",
    unlockConfirm: "I understand, unlock",
    created: "Link created successfully!",
    edited: "Link edited successfully!",
  },
  analytics: {
    tabs: { links: "Links", analytics: "Analytics", label: "Dashboard sections" },
    ranges: { "7d": "7 days", "30d": "30 days", "90d": "90 days", all: "All time" },
    rangeLabel: "Time range",
    allLinks: "All links",
    filterLabel: "Filter by link",
    clearFilter: "Show all links",
    kpi: {
      clicks: "Clicks",
      vsPrevious: (change: string) => `${change} vs previous period`,
      noPrevious: "No clicks in the previous period",
      activeLinks: "Links with clicks",
      fromApps: "From in-app browsers",
      fromAppsHint: "Clicks Nuto moved out of an app's browser",
      qrScans: "QR scans",
      linksCreated: "Links created",
    },
    overTime: "Clicks over time",
    hours: "Busiest hours",
    hoursHint: "In your time zone",
    topLinks: "Top links",
    countries: "Countries",
    apps: "Where clicks come from",
    devices: "Devices",
    browser: "Regular browser",
    otherApp: "Other app",
    unknown: "Unknown",
    deviceNames: { ios: "iPhone / iPad", android: "Android", desktop: "Desktop", other: "Other" },
    clicksCount: (count: string, n: number) => `${count} ${n === 1 ? "click" : "clicks"}`,
    empty: "No clicks in this period yet.",
    emptyHint: "Share a link or its QR code and clicks will show up here.",
    tableCaption: (title: string) => `${title}, as a table`,
    live: {
      toggle: "Live",
      on: "Live view on",
      off: "Live view off",
      title: "Last hour",
      lastHour: (count: string) => `${count} in the last hour`,
      recent: "Latest clicks",
      none: "No clicks in the last hour.",
      updated: "Updates every 15 seconds while this tab is open.",
      qr: "QR scan",
    },
  },
  openPage: {
    title: "Opening link · Nuto",
    opening: (app: string | null) => (app ? `Opening ${app}…` : "Opening your link…"),
    blockedTitle: (app: string | null) =>
      app ? `${app} is keeping this link in its browser` : "This app is keeping the link in its browser",
    blockedBody:
      "Tap the ⋯ menu (or the share icon) and choose “Open in browser” to continue in your browser.",
    tryAgain: "Try again",
    copy: "Copy link",
    copied: "Copied",
    continueHere: "Continue here",
  },
  qr: {
    open: (shortCode: string) => `QR code for /${shortCode}`,
    title: "QR code",
    description: (shortCode: string) =>
      `Scans open /${shortCode} and count as QR scans in your analytics.`,
    color: "Color",
    brand: "Nuto",
    black: "Black",
    background: "Background",
    white: "White",
    transparent: "Transparent",
    logo: "Logo in the center",
    downloadPng: "PNG",
    downloadSvg: "SVG",
    copy: "Copy image",
    copied: "QR code copied",
    failed: "Couldn't create the image",
  },
  deleteLink: {
    title: "Are you sure?",
    bodyStart: "You're about to delete",
    bodyEnd: ". This action will permanently delete this short link.",
    delete: "Delete",
    deleting: "Deleting",
    deleted: "Link successfully deleted.",
    label: (shortCode: string) => `Delete /${shortCode}`,
  },
  passwordWall: {
    title: "Protected URL",
    body: "This URL is protected by a password.",
    label: "Password:",
    placeholder: "Enter link password",
    submit: "Submit",
    checking: "Checking...",
  },
  errorPage: {
    oops: "Oops!",
    error: "Error",
    unexpected: "An unexpected error occurred.",
    notFoundTitle: "Not found",
    notFound: "The requested page could not be found.",
    linkNotFound: "This short link doesn't exist.",
    expiredTitle: "Expired",
    expired: "This short link has expired.",
    goHome: "Go home",
  },
  errors: {
    missingFields: "Missing required fields",
    shortCodeTooLong: `Short code must be at most ${MAX_SHORT_CODE_LENGTH} characters.`,
    shortCodeInvalid: "Short code has invalid characters.",
    shortCodeReserved: "This short code is reserved. Please choose another one.",
    urlTooLong: `URL must be at most ${MAX_LONG_URL_LENGTH} characters.`,
    urlInvalid: "Invalid long URL provided.",
    urlProtocol: "Only http and https URLs are allowed.",
    expiryInvalid: "Invalid expiration date format provided.",
    expiryTooSoon: "Expiration date must be at least one minute in the future.",
    passwordTooLong: `Password must be at most ${MAX_PASSWORD_LENGTH} characters.`,
    crossOrigin: "Cross-origin request rejected",
    selfReference: "Short code cannot be the same as the long URL.",
    redirectLoop: "This target would create a redirect loop between short links.",
    shortCodeTaken: "Short code is already in use, please choose another one.",
    linkLimit: (limit: number | null) =>
      limit === null
        ? "You've reached your link limit."
        : `You've reached your limit of ${limit} links.`,
    createFailed: "Failed to create link",
    updateFailed: "Failed to update link",
    deleteFailed: "Failed to delete link",
    notFoundOrForbidden: "Link not found or you don't have permission",
    missingShortCode: "Missing shortCode parameter",
    tooManyAttempts: "Too many attempts. Try again in a minute.",
    invalidPassword: "Invalid password",
  },
};

type Widen<T> = T extends string
  ? string
  : T extends (...args: infer A) => infer R
    ? (...args: A) => R
    : T extends readonly (infer U)[]
      ? Widen<U>[]
      : { [K in keyof T]: Widen<T[K]> };

export type Messages = Widen<typeof en>;
export type ErrorCode = {
  [K in keyof Messages["errors"]]: Messages["errors"][K] extends string
    ? K
    : never;
}[keyof Messages["errors"]];
