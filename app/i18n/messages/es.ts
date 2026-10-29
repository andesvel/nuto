import {
  MAX_LONG_URL_LENGTH,
  MAX_PASSWORD_LENGTH,
  MAX_SHORT_CODE_LENGTH,
} from "@/utils/validate-link-input";
import type { Messages } from "./en";

// Neutral Latin American Spanish, addressing the reader as "tú".
export const es: Messages = {
  meta: {
    homeTitle: "Nuto · Links cortos que se abren en la app",
    homeDescription:
      "Acortador de links gratis: tus links se saltan el navegador interno de Instagram y TikTok y abren YouTube, Spotify y Apple Music en sus apps. Incluye links con contraseña y con fecha de vencimiento.",
    privacyTitle: "Política de privacidad · Nuto",
    privacyDescription:
      "Qué datos procesa Nuto y para qué: datos de la cuenta y de los links, clics por país y user agent, sin guardar direcciones IP, y contraseñas de links cifradas.",
    disclaimerTitle: "Aviso legal · Nuto",
    disclaimerDescription:
      "Nuto es un acortador de links gratuito y sin fines comerciales. Conoce cómo trata los links que crean los usuarios, qué contenido está prohibido y cómo reportar un link abusivo.",
    dashboardTitle: "Panel · Nuto",
    analyticsTitle: "Estadísticas · Nuto",
    signInTitle: "Iniciar sesión · Nuto",
    signUpTitle: "Crear cuenta · Nuto",
    gateTitle: (slug: string) => `Abriendo ${slug} · Nuto`,
    ogImageAlt: "Nuto: links cortos que se abren en la app",
    appDescription:
      "Acortador de links que escapa de los navegadores internos de las apps y abre YouTube, Spotify y otros links en sus apps nativas.",
    features: [
      "Escapa del navegador interno de Instagram, TikTok y Facebook",
      "Abre links de YouTube y Spotify en sus apps",
      "Códigos cortos personalizados",
      "Links con contraseña",
      "Links con fecha de vencimiento",
      "Conteo de clics",
    ],
  },
  common: {
    cancel: "Cancelar",
    clear: "Borrar",
    loading: "Cargando",
    togglePassword: "Mostrar u ocultar la contraseña",
    showPassword: "Mostrar contraseña",
    hidePassword: "Ocultar contraseña",
  },
  header: {
    goToDashboard: "Ir al panel",
    github: "Nuto en GitHub",
    signIn: "Iniciar sesión",
    searchPlaceholder: "Busca en tus links",
    links: "links",
  },
  theme: {
    change: "Cambiar tema",
    title: "Tema",
    light: "Claro",
    dark: "Oscuro",
    system: "Sistema",
  },
  language: {
    label: "Idioma",
    suggestion: "Esta página también está disponible en español.",
    switchTo: "Ver en español",
    dismiss: "Cerrar",
  },
  inApp: {
    title: (app: string | null) =>
      app
        ? `Estás en el navegador interno de ${app}.`
        : "Estás en el navegador interno de una app.",
    body: "Abre Nuto en tu navegador para iniciar sesión y usarlo completo.",
    open: "Abrir en el navegador",
    dismiss: "Cerrar",
  },
  footer: {
    madeBy: "Hecho por Andres con",
    disclaimer: "Aviso legal",
    privacy: "Política de privacidad",
    reportBug: "Reportar un error",
  },
  hero: {
    titleStart: "Deja de perder visitas en los torpes navegadores",
    titleInApp: "internos",
    titleEnd: "de las apps",
    subtitle:
      "Links cortos para tu bio y tus publicaciones. Cuando alguien los toca dentro de Instagram o TikTok, se saltan el navegador interno y abren YouTube, Spotify o el navegador de esa persona.",
    getStarted: "Empezar",
    learnMore: "Más información",
    howItWorks: "Cómo funciona",
  },
  howItWorks: {
    title: "Cómo funciona",
    intro:
      "Instagram, TikTok y Facebook abren los links en un navegador interno y apretado donde nadie tiene sesión iniciada. Nuto los manda a la app o al navegador que ya usan.",
    steps: [
      {
        title: "Acorta tu link",
        body: "Pega un link de YouTube, Spotify o cualquier otra URL. Elige un código corto o deja que Nuto genere uno.",
      },
      {
        title: "Compártelo donde quieras",
        body: "Ponlo en tu bio de Instagram, en un comentario de TikTok o en una historia.",
      },
      {
        title: "Se abre en la app correcta",
        body: "Cuando alguien lo toca dentro de una app, Nuto se salta el navegador interno y abre su navegador de verdad o la app nativa.",
      },
    ],
  },
  features: {
    title: "Por qué Nuto",
    items: {
      bypass: {
        title: "Sin navegadores internos",
        body: "Los toques desde Instagram, TikTok o Facebook salen del navegador interno y se abren en Safari o en el navegador predeterminado del teléfono.",
      },
      native: {
        title: "Abre las apps nativas",
        body: "En iOS, los links de YouTube y Spotify se abren directo en sus apps. En Android, el sistema le pasa el link a la app que lo maneja.",
      },
      password: {
        title: "Links con contraseña",
        body: "Quien lo visite escribe una contraseña antes de ser redirigido. Se guarda cifrada con hash, y los intentos fallidos repetidos tienen un límite.",
      },
      expiry: {
        title: "Links que vencen",
        body: "Elige una fecha y hora; después de eso, el link deja de redirigir. El panel muestra los clics y la última visita de cada link.",
      },
    },
    disclaimerBefore: "Revisa el",
    disclaimerLink: "aviso legal",
    disclaimerAfter: "antes de compartir contenido sensible.",
  },
  nameOrigin: {
    title: "¿Qué significa “Nuto”?",
    bodyStart:
      "Viene de “diminuto”. Tomamos tus URLs largas y desordenadas y las hacemos",
    bodyEnd:
      "para que sean fáciles de compartir y nunca se rompan en las apps del celular.",
  },
  faq: {
    title: "Preguntas frecuentes",
    items: [
      {
        question: "¿Qué es un navegador interno?",
        answer:
          "Es la vista web que usan apps como Instagram, TikTok y Facebook cuando tocas un link. Ahí no tienes sesión iniciada en nada, y los links de YouTube o Spotify se reproducen en una página apretada en vez de en la app.",
      },
      {
        question: "¿Cómo abre Nuto los links en la app nativa?",
        answer:
          "Nuto revisa dónde se tocó el link. Dentro de un navegador interno en iOS abre Safari, y los links de YouTube y Spotify van directo a sus apps. En Android le pasa el link al sistema, que abre el navegador predeterminado o la app correspondiente. Los navegadores normales reciben una redirección común.",
      },
      {
        question: "¿Nuto es gratis?",
        answer:
          "Sí. Nuto es un proyecto gratuito y sin fines comerciales. Solo necesitas una cuenta gratis para crear links, y cada cuenta tiene un límite de links.",
      },
      {
        question: "¿Puedo proteger un link con contraseña?",
        answer:
          "Sí. Quien lo visite tiene que escribir la contraseña antes de ser redirigido. Se guarda como hash con sal, nunca en texto plano, y los intentos fallidos repetidos tienen un límite.",
      },
      {
        question: "¿Un link puede vencer?",
        answer:
          "Sí. Elige una fecha y hora de vencimiento al crear o editar un link. Cuando pasa, el link deja de redirigir y muestra que venció.",
      },
      {
        question: "¿Qué registra Nuto cuando alguien hace clic en un link?",
        answer:
          "Solo la hora, el país de la visita y el user agent del navegador, para que puedas ver el conteo de clics. Nuto nunca guarda direcciones IP.",
      },
    ],
  },
  cta: {
    title: "¿Listo para empezar?",
    body: "Crea una cuenta gratis y empieza a acortar links que se abren en el lugar correcto.",
  },
  dashboard: {
    noResults: (query: string) => `No hay resultados para “${query}”.`,
    emptyTitle: "Todavía no tienes links",
    emptyBody: "Empieza creando tu primer link corto.",
    createFirst: "Crea tu primer link",
    copyFailed: "No se pudo copiar el link",
    loadFailed: "No se pudieron cargar los links",
    shareTitle: "Link corto",
  },
  sort: {
    trigger: (label: string, order: string) =>
      `Ordenar links: ${label}, ${order}`,
    sortBy: "Ordenar por",
    order: "Orden",
    reset: (label: string) => `Volver a ${label.toLowerCase()}`,
    keys: {
      lastClicked: {
        label: "Actividad reciente",
        orders: { desc: "Más recientes primero", asc: "Menos recientes primero" },
      },
      createdAt: {
        label: "Fecha de creación",
        orders: { desc: "Más nuevos primero", asc: "Más antiguos primero" },
      },
      clicks: {
        label: "Clics",
        orders: { desc: "Más clics", asc: "Menos clics" },
      },
      expiresAt: {
        label: "Vencimiento",
        orders: { asc: "Vencen antes", desc: "Vencen después" },
      },
      shortCode: {
        label: "Código corto",
        orders: { asc: "A → Z", desc: "Z → A" },
      },
    },
  },
  linkCard: {
    noPassword: "Sin contraseña",
    clicks: (count: string, n: number) => `${count} ${n === 1 ? "clic" : "clics"}`,
    noExpiry: "No vence",
  },
  linkForm: {
    newLink: "Nuevo link",
    createTitle: "Crea un nuevo link corto",
    createDescription: "Crea un nuevo link corto llenando el formulario.",
    editTitle: "Editar link",
    editDescription:
      "Cambia el destino, el código corto, la contraseña o el vencimiento de este link.",
    longUrl: "URL larga",
    shortCode: "Código corto",
    randomize: "Aleatorio",
    onlyAlphanumeric: "Solo se permiten letras y números.",
    reserved: "Este código corto está reservado. Elige otro.",
    setPassword: "Poner contraseña",
    passwordPlaceholder: "Protege este link",
    setExpiry: "Poner fecha de vencimiento",
    selectDate: "Elige una fecha",
    time: "Hora",
    create: "Crear",
    creating: "Creando",
    edit: "Guardar",
    editing: "Guardando",
    unlock: "Desbloquear",
    unlockTitle: "Cuidado",
    unlockBody:
      "Esto puede romper el link si ya lo compartiste. Asegúrate de compartir el link nuevo con tu audiencia.",
    unlockConfirm: "Entiendo, desbloquear",
    created: "¡Link creado!",
    edited: "¡Link actualizado!",
  },
  analytics: {
    tabs: { links: "Links", analytics: "Estadísticas", label: "Secciones del panel" },
    ranges: { "7d": "7 días", "30d": "30 días", "90d": "90 días", all: "Todo" },
    rangeLabel: "Periodo",
    allLinks: "Todos los links",
    filterLabel: "Filtrar por link",
    clearFilter: "Ver todos los links",
    kpi: {
      clicks: "Clics",
      vsPrevious: (change: string) => `${change} frente al periodo anterior`,
      noPrevious: "Sin clics en el periodo anterior",
      activeLinks: "Links con clics",
      fromApps: "Desde navegadores internos",
      fromAppsHint: "Clics que Nuto sacó del navegador de una app",
      qrScans: "Escaneos QR",
      linksCreated: "Links creados",
    },
    overTime: "Clics en el tiempo",
    hours: "Horas con más clics",
    hoursHint: "En tu zona horaria",
    topLinks: "Links principales",
    countries: "Países",
    apps: "De dónde vienen los clics",
    devices: "Dispositivos",
    browser: "Navegador normal",
    otherApp: "Otra app",
    unknown: "Desconocido",
    deviceNames: { ios: "iPhone / iPad", android: "Android", desktop: "Escritorio", other: "Otro" },
    clicksCount: (count: string, n: number) => `${count} ${n === 1 ? "clic" : "clics"}`,
    empty: "Todavía no hay clics en este periodo.",
    emptyHint: "Comparte un link o su código QR y los clics aparecerán aquí.",
    tableCaption: (title: string) => `${title}, en tabla`,
    live: {
      toggle: "En vivo",
      on: "Vista en vivo activada",
      off: "Vista en vivo desactivada",
      title: "Última hora",
      lastHour: (count: string) => `${count} en la última hora`,
      recent: "Últimos clics",
      none: "Sin clics en la última hora.",
      updated: "Se actualiza cada 15 segundos mientras esta pestaña esté abierta.",
      qr: "Escaneo QR",
    },
  },
  openPage: {
    title: "Abriendo link · Nuto",
    opening: (app: string | null) => (app ? `Abriendo ${app}…` : "Abriendo tu link…"),
    blockedTitle: (app: string | null) =>
      app ? `${app} mantiene este link en su navegador` : "Esta app mantiene el link en su navegador",
    blockedBody:
      "Toca el menú ⋯ (o el ícono de compartir) y elige “Abrir en el navegador” para seguir en Safari o Chrome.",
    tryAgain: "Reintentar",
    copy: "Copiar link",
    copied: "Copiado",
    continueHere: "Seguir aquí",
  },
  qr: {
    open: (shortCode: string) => `Código QR de /${shortCode}`,
    title: "Código QR",
    description: (shortCode: string) =>
      `Al escanearlo se abre /${shortCode} y cuenta como escaneo QR en tus estadísticas.`,
    color: "Color",
    brand: "Nuto",
    black: "Negro",
    background: "Fondo",
    white: "Blanco",
    transparent: "Transparente",
    logo: "Logo al centro",
    downloadPng: "PNG",
    downloadSvg: "SVG",
    copy: "Copiar imagen",
    copied: "Código QR copiado",
    failed: "No se pudo crear la imagen",
  },
  deleteLink: {
    title: "¿Seguro?",
    bodyStart: "Vas a eliminar",
    bodyEnd: ". Esta acción elimina el link corto de forma permanente.",
    delete: "Eliminar",
    deleting: "Eliminando",
    deleted: "Link eliminado.",
    label: (shortCode: string) => `Eliminar /${shortCode}`,
  },
  passwordWall: {
    title: "URL protegida",
    body: "Esta URL está protegida con contraseña.",
    label: "Contraseña:",
    placeholder: "Escribe la contraseña del link",
    submit: "Entrar",
    checking: "Verificando...",
  },
  errorPage: {
    oops: "¡Ups!",
    error: "Error",
    unexpected: "Ocurrió un error inesperado.",
    notFoundTitle: "No encontrado",
    notFound: "No pudimos encontrar la página que buscas.",
    linkNotFound: "Este link corto no existe.",
    expiredTitle: "Vencido",
    expired: "Este link corto ya venció.",
    goHome: "Ir al inicio",
  },
  errors: {
    missingFields: "Faltan campos obligatorios",
    shortCodeTooLong: `El código corto puede tener como máximo ${MAX_SHORT_CODE_LENGTH} caracteres.`,
    shortCodeInvalid: "El código corto tiene caracteres no válidos.",
    shortCodeReserved: "Este código corto está reservado. Elige otro.",
    urlTooLong: `La URL puede tener como máximo ${MAX_LONG_URL_LENGTH} caracteres.`,
    urlInvalid: "La URL larga no es válida.",
    urlProtocol: "Solo se permiten URLs http y https.",
    expiryInvalid: "El formato de la fecha de vencimiento no es válido.",
    expiryTooSoon:
      "La fecha de vencimiento debe ser al menos un minuto en el futuro.",
    passwordTooLong: `La contraseña puede tener como máximo ${MAX_PASSWORD_LENGTH} caracteres.`,
    crossOrigin: "Solicitud de otro origen rechazada",
    selfReference: "El código corto no puede ser igual a la URL larga.",
    redirectLoop:
      "Este destino crearía un bucle de redirecciones entre links cortos.",
    shortCodeTaken: "Ese código corto ya está en uso. Elige otro.",
    linkLimit: (limit: number | null) =>
      limit === null
        ? "Llegaste al límite de links."
        : `Llegaste a tu límite de ${limit} links.`,
    createFailed: "No se pudo crear el link",
    updateFailed: "No se pudo actualizar el link",
    deleteFailed: "No se pudo eliminar el link",
    notFoundOrForbidden: "El link no existe o no tienes permiso",
    missingShortCode: "Falta el parámetro shortCode",
    tooManyAttempts: "Demasiados intentos. Vuelve a intentarlo en un minuto.",
    invalidPassword: "Contraseña incorrecta",
  },
};
