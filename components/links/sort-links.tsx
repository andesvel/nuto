import * as React from "react";
import {
  Activity,
  ArrowDown,
  ArrowDownAZ,
  ArrowUp,
  ArrowUpDown,
  CalendarClock,
  CalendarPlus,
  MousePointerClick,
  RotateCcw,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@ui/button";
import {
  DEFAULT_SORT,
  SORT_OPTIONS,
  type SortKey,
  type SortOrder,
  type SortValue,
} from "@/utils/link-list";

export type { SortKey, SortValue } from "@/utils/link-list";

const KEY_ICONS: Record<SortKey, typeof Activity> = {
  lastClicked: Activity,
  createdAt: CalendarPlus,
  clicks: MousePointerClick,
  expiresAt: CalendarClock,
  shortCode: ArrowDownAZ,
};

const ORDER_ICONS: Record<SortOrder, typeof ArrowUp> = {
  asc: ArrowUp,
  desc: ArrowDown,
};

const flip = (order: SortOrder): SortOrder => (order === "asc" ? "desc" : "asc");

export default function SortLinks({
  value,
  onChange,
}: {
  value: SortValue;
  onChange: (next: SortValue) => void;
}) {
  const current = SORT_OPTIONS[value.key];
  const CurrentIcon = KEY_ICONS[value.key];
  const OrderIcon = ORDER_ICONS[value.order];
  const isDefault =
    value.key === DEFAULT_SORT.key && value.order === DEFAULT_SORT.order;

  // Picking another field uses that field's natural direction; picking the
  // active one again flips it.
  const chooseKey = (key: SortKey) =>
    onChange(
      key === value.key
        ? { key, order: flip(value.order) }
        : { key, order: SORT_OPTIONS[key].defaultOrder },
    );

  // The field's default direction is listed first
  const orders: SortOrder[] = [
    current.defaultOrder,
    flip(current.defaultOrder),
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          aria-label={`Sort links: ${current.label}, ${current.orderLabels[value.order]}`}
          title={`${current.label} · ${current.orderLabels[value.order]}`}
        >
          <CurrentIcon size={16} className="hidden sm:inline" />
          <ArrowUpDown size={16} className="sm:hidden" />
          <span className="hidden sm:inline">{current.label}</span>
          <OrderIcon size={14} className="hidden sm:inline text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={value.key}>
          {(Object.keys(SORT_OPTIONS) as SortKey[]).map((key) => {
            const option = SORT_OPTIONS[key];
            const Icon = KEY_ICONS[key];
            const active = key === value.key;
            return (
              <DropdownMenuRadioItem
                key={key}
                value={key}
                // Keep the menu open so the result and direction stay visible
                onSelect={(e) => {
                  e.preventDefault();
                  chooseKey(key);
                }}
              >
                <Icon size={16} />
                <span>{option.label}</span>
                {active && (
                  <OrderIcon
                    size={14}
                    className="ml-auto text-muted-foreground"
                    aria-hidden
                  />
                )}
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Order
        </DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={value.order}
          onValueChange={(order) =>
            onChange({ key: value.key, order: order as SortOrder })
          }
        >
          {orders.map((order) => {
            const Icon = ORDER_ICONS[order];
            return (
              <DropdownMenuRadioItem
                key={order}
                value={order}
                onSelect={(e) => e.preventDefault()}
              >
                <Icon size={16} />
                {current.orderLabels[order]}
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>

        {!isDefault && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onChange(DEFAULT_SORT)}>
              <RotateCcw size={16} />
              Reset to {SORT_OPTIONS[DEFAULT_SORT.key].label.toLowerCase()}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
