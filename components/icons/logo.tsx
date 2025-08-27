import React from "react";
import { Link } from "react-router";
import { Nuto } from "@components/icons/nuto";

type Size = "sm" | "md" | "lg" | "xl";
type Tone = "brand" | "mono";

export type NutoLogoProps = {
  // Nuevo nombre claro
  withText?: boolean;
  /** @deprecated Usa `withText` */
  title?: boolean;
  // Link de react-router. Si es null, no se usa Link y se renderiza un <span>.
  to?: string | null;
  size?: Size;
  tone?: Tone;
  // Aplica fondo circular e invierte colores
  badge?: boolean;
  className?: string;
  iconClassName?: string;
  // Texto a mostrar junto al logo (por defecto "Nuto")
  text?: string;
} & React.HTMLAttributes<HTMLAnchorElement>;

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const sizeMap: Record<Size, string> = {
  sm: "h-6 w-6 sm:h-7 sm:w-7",
  md: "h-8 w-8 sm:h-10 sm:w-10",
  lg: "h-10 w-10 sm:h-12 sm:w-12",
  xl: "h-12 w-12 sm:h-14 sm:w-14",
};

export function NutoLogo({
  withText,
  title, // deprecated
  to = "/",
  size = "md",
  tone = "brand",
  badge = false,
  className,
  iconClassName,
  text = "Nuto",
  ...rest
}: NutoLogoProps) {
  const showText = withText ?? title ?? false;

  const iconClasses = cx(
    sizeMap[size],
    // Colors
    badge
      ? "rounded-full bg-primary fill-white dark:bg-foreground dark:fill-primary"
      : tone === "mono"
      ? "fill-foreground"
      : "fill-primary dark:fill-foreground",
    iconClassName
  );

  const rootClasses = cx("flex items-center gap-1", className);
  const label = showText ? undefined : "Nuto home";

  const Content = (
    <>
      <Nuto className={iconClasses} aria-hidden={showText ? undefined : true} />
      {showText && (
        <span className="text-xl font-bold tracking-tight">{text}</span>
      )}
    </>
  );

  // If to is null, render a span instead of a Link
  if (to === null) {
    return (
      <span className={rootClasses} {...rest}>
        {Content}
      </span>
    );
  }

  return (
    <Link to={to} className={rootClasses} aria-label={label} {...rest}>
      {Content}
    </Link>
  );
}
