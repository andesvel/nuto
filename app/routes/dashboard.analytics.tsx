import * as React from "react";
import { Link, redirect, useSearchParams } from "react-router";
import { getAuth } from "@clerk/react-router/ssr.server";
import { Check, ChevronDown, Radio, X } from "lucide-react";
import type { Route } from "./+types/dashboard.analytics";

import Header from "@/components/header";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AreaChart } from "@/components/analytics/area-chart";
import { BarList } from "@/components/analytics/bar-list";
import { HourChart } from "@/components/analytics/hour-chart";
import { LivePanel } from "@/components/analytics/live-panel";
import { appLabel, countryLabel, deviceLabel } from "@/components/analytics/labels";
import { useCountUp } from "@/components/analytics/motion";
import { useHydrated } from "@/components/local-date";
import {
  ANALYTICS_RANGES,
  getAnalytics,
  isAnalyticsRange,
  type AnalyticsData,
  type AnalyticsRange,
} from "../repository/analytics";
import { listActiveLinksForUser } from "../repository/urls";
import {
  clicksByLocalDay,
  clicksByLocalHour,
  percentChange,
} from "@/utils/analytics-series";
import { privateMeta } from "@/utils/seo";
import {
  LOCALE_TAGS,
  localeFromMatches,
  messagesFor,
  useFormatNumber,
  useLocale,
  useT,
} from "@/app/i18n";
import { cn } from "@/lib/utils";

const DEFAULT_RANGE: AnalyticsRange = "30d";
const LIVE_STORAGE_KEY = "nuto:analytics-live";

export function meta({ matches }: Route.MetaArgs) {
  return privateMeta(messagesFor(localeFromMatches(matches)).meta.analyticsTitle);
}

export async function loader(args: Route.LoaderArgs) {
  const { userId } = await getAuth(args);
  if (!userId) {
    return redirect("/sign-in?redirect_url=" + args.request.url);
  }

  const params = new URL(args.request.url).searchParams;
  const rangeParam = params.get("range");
  const range = isAnalyticsRange(rangeParam) ? rangeParam : DEFAULT_RANGE;
  const db = args.context.cloudflare.env.DB;

  const links = await listActiveLinksForUser(db, userId);
  // Only the user's own links can be used as a filter
  const requested = params.get("link");
  const link = links.some((l) => l.shortCode === requested) ? requested : null;

  const analytics = await getAnalytics(db, { userId, range, link });
  return {
    analytics,
    link,
    links: links.map((l) => ({ shortCode: l.shortCode, longUrl: l.longUrl })),
  };
}

function useLiveToggle(): [boolean, (on: boolean) => void] {
  const [live, setLive] = React.useState(false);
  React.useEffect(() => {
    try {
      setLive(localStorage.getItem(LIVE_STORAGE_KEY) === "1");
    } catch {
      // storage blocked: live view stays off until toggled
    }
  }, []);
  const set = (on: boolean) => {
    setLive(on);
    try {
      localStorage.setItem(LIVE_STORAGE_KEY, on ? "1" : "0");
    } catch {
      // the choice just won't persist
    }
  };
  return [live, set];
}

function Section({
  title,
  hint,
  className,
  children,
}: {
  title: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={cn("chart-enter gap-3 p-4", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </Card>
  );
}

function Stat({
  label,
  value,
  suffix,
  detail,
  tone,
}: {
  label: string;
  value: number;
  suffix?: string;
  detail?: string;
  tone?: "up" | "down";
}) {
  const formatNumber = useFormatNumber();
  const shown = useCountUp(value);
  return (
    <Card className="chart-enter gap-1 p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-3xl font-semibold tracking-tight tabular-nums">
        <span>{formatNumber(shown)}</span>
        {suffix && <span className="text-xl text-muted-foreground">{suffix}</span>}
      </p>
      {detail && (
        <p
          key={detail}
          className={cn(
            "text-xs",
            tone === "up" && "text-emerald-600 dark:text-emerald-400",
            tone === "down" && "text-destructive",
            !tone && "text-muted-foreground",
          )}
        >
          {detail}
        </p>
      )}
    </Card>
  );
}

function Toolbar({
  range,
  link,
  links,
  live,
  onLiveChange,
}: {
  range: AnalyticsRange;
  link: string | null;
  links: { shortCode: string; longUrl: string }[];
  live: boolean;
  onLiveChange: (on: boolean) => void;
}) {
  const t = useT();
  const [searchParams] = useSearchParams();
  const withParams = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (value === null) next.delete(key);
      else next.set(key, value);
    }
    const query = next.toString();
    return query ? `?${query}` : "?";
  };

  return (
    <>
      <div
        role="group"
        aria-label={t.analytics.rangeLabel}
        className="inline-flex items-center rounded-md border p-0.5"
      >
        {ANALYTICS_RANGES.map((r) => (
          <Link
            key={r}
            to={withParams({ range: r === DEFAULT_RANGE ? null : r })}
            preventScrollReset
            aria-current={r === range ? "true" : undefined}
            className={cn(
              "rounded-sm px-2.5 py-1 text-sm transition-colors",
              r === range
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t.analytics.ranges[r]}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" aria-label={t.analytics.filterLabel}>
              {link ? (
                <span translate="no" className="font-mono">
                  /{link}
                </span>
              ) : (
                <span>{t.analytics.allLinks}</span>
              )}
              <ChevronDown size={14} className="text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-80 w-64">
            <DropdownMenuLabel>{t.analytics.filterLabel}</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link to={withParams({ link: null })} preventScrollReset>
                <span>{t.analytics.allLinks}</span>
                {!link && <Check className="ml-auto" size={14} />}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {links.map((l) => (
              <DropdownMenuItem key={l.shortCode} asChild>
                <Link to={withParams({ link: l.shortCode })} preventScrollReset>
                  <span translate="no" className="truncate font-mono text-xs">
                    /{l.shortCode}
                  </span>
                  {link === l.shortCode && <Check className="ml-auto" size={14} />}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {link && (
          <Button asChild variant="ghost" size="icon" aria-label={t.analytics.clearFilter}>
            <Link to={withParams({ link: null })} preventScrollReset>
              <X size={16} />
            </Link>
          </Button>
        )}
        <Button
          variant={live ? "default" : "outline"}
          aria-pressed={live}
          aria-label={live ? t.analytics.live.on : t.analytics.live.off}
          onClick={() => onLiveChange(!live)}
        >
          <Radio size={16} />
          <span>{t.analytics.live.toggle}</span>
        </Button>
      </div>
    </>
  );
}

function AnalyticsContent({
  analytics,
  link,
  live,
}: {
  analytics: AnalyticsData;
  link: string | null;
  live: boolean;
}) {
  const t = useT();
  const locale = useLocale();
  const formatNumber = useFormatNumber();
  const offsetMinutes = new Date().getTimezoneOffset();
  const { totals } = analytics;

  const points = React.useMemo(
    () =>
      clicksByLocalDay(analytics.series.buckets, {
        from: analytics.from,
        to: analytics.to,
        offsetMinutes,
      }),
    [analytics, offsetMinutes],
  );
  const hours = React.useMemo(
    () => clicksByLocalHour(analytics.hours, offsetMinutes),
    [analytics, offsetMinutes],
  );
  const dateFormat = React.useMemo(
    () =>
      new Intl.DateTimeFormat(LOCALE_TAGS[locale], {
        month: "short",
        day: "numeric",
        ...(analytics.range === "all" ? { year: "2-digit" } : {}),
      }),
    [locale, analytics.range],
  );

  const change = percentChange(totals.clicks, totals.previousClicks);
  const inApp = analytics.apps
    .filter((a) => a.key !== null)
    .reduce((n, a) => n + a.clicks, 0);
  const inAppShare = totals.clicks ? Math.round((inApp / totals.clicks) * 100) : 0;
  const clicks = (n: number) => t.analytics.clicksCount(formatNumber(n), n);

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          label={t.analytics.kpi.clicks}
          value={totals.clicks}
          detail={
            totals.previousClicks === null
              ? undefined
              : change === null
                ? t.analytics.kpi.noPrevious
                : t.analytics.kpi.vsPrevious(`${change > 0 ? "+" : ""}${change}%`)
          }
          tone={change === null || change === 0 ? undefined : change > 0 ? "up" : "down"}
        />
        <Stat
          label={t.analytics.kpi.fromApps}
          value={inAppShare}
          suffix="%"
          detail={t.analytics.kpi.fromAppsHint}
        />
        <Stat label={t.analytics.kpi.qrScans} value={totals.qrScans} />
        {link ? (
          <Stat label={t.analytics.kpi.linksCreated} value={totals.linksCreated} />
        ) : (
          <Stat label={t.analytics.kpi.activeLinks} value={totals.activeLinks} />
        )}
      </div>

      {live && (
        <Section title={t.analytics.live.title}>
          <LivePanel link={link} />
        </Section>
      )}

      <Section title={t.analytics.overTime}>
        {totals.clicks === 0 ? (
          <div className="py-10 text-center">
            <p className="font-medium">{t.analytics.empty}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t.analytics.emptyHint}</p>
          </div>
        ) : (
          <AreaChart
            // Remount per range/filter so the line draws in again
            key={`${analytics.range}-${link ?? "all"}`}
            points={points}
            label={t.analytics.overTime}
            caption={t.analytics.tableCaption(t.analytics.overTime)}
            formatDate={(d) => dateFormat.format(d)}
            formatValue={formatNumber}
          />
        )}
      </Section>

      {totals.clicks > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {!link && (
            <Section title={t.analytics.topLinks}>
              <BarList
                items={analytics.topLinks.map((r) => ({
                  key: r.key,
                  label: `/${r.key}`,
                  value: r.clicks,
                  to: `/dashboard/analytics?link=${encodeURIComponent(r.key)}${
                    analytics.range === DEFAULT_RANGE ? "" : `&range=${analytics.range}`
                  }`,
                  noTranslate: true,
                }))}
                formatValue={clicks}
                emptyLabel={t.analytics.empty}
              />
            </Section>
          )}
          <Section title={t.analytics.apps}>
            <BarList
              items={analytics.apps.map((r) => ({
                key: r.key ?? "browser",
                label: appLabel(r.key, t),
                value: r.clicks,
              }))}
              formatValue={clicks}
              emptyLabel={t.analytics.empty}
            />
          </Section>
          <Section title={t.analytics.countries}>
            <BarList
              items={analytics.countries.map((r) => ({
                key: r.key ?? "unknown",
                label: countryLabel(r.key, locale, t),
                value: r.clicks,
              }))}
              formatValue={clicks}
              emptyLabel={t.analytics.empty}
            />
          </Section>
          <Section title={t.analytics.devices}>
            <BarList
              items={analytics.devices.map((r) => ({
                key: r.key ?? "unknown",
                label: deviceLabel(r.key, t),
                value: r.clicks,
              }))}
              formatValue={clicks}
              emptyLabel={t.analytics.empty}
            />
          </Section>
          <Section
            title={t.analytics.hours}
            hint={t.analytics.hoursHint}
            className={link ? undefined : "md:col-span-2"}
          >
            <HourChart
              values={hours}
              label={t.analytics.hours}
              caption={t.analytics.tableCaption(t.analytics.hours)}
              formatValue={clicks}
            />
          </Section>
        </div>
      )}
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="grid gap-4" aria-hidden>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
  );
}

export default function DashboardAnalytics({ loaderData }: Route.ComponentProps) {
  const { analytics, link, links } = loaderData;
  const [live, setLive] = useLiveToggle();
  // Charts speak the viewer's time zone, which the server can't know
  const hydrated = useHydrated();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-between antialiased">
      <Header
        analyticsToolbar={
          <Toolbar
            range={analytics.range}
            link={link}
            links={links}
            live={live}
            onLiveChange={setLive}
          />
        }
      />
      <main className="c-root grow mb-4 w-full">
        {hydrated ? (
          <AnalyticsContent analytics={analytics} link={link} live={live} />
        ) : (
          <AnalyticsSkeleton />
        )}
      </main>
      <Footer />
    </div>
  );
}
