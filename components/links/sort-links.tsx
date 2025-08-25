import * as React from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@ui/button";
import { ArrowDown, ArrowUp, X } from "lucide-react";

export type SortKey = "shortCode" | "expiresAt" | "clicks" | "lastClicked";
export type SortValue = { key: SortKey; order: "asc" | "desc" };

export default function SortLinks({
  value,
  onChange,
  children,
}: {
  value: SortValue;
  onChange: (next: SortValue) => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center justify-between">
          Sort by
          <Button variant="icon" onClick={() => setOpen(!open)} size="sm">
            <X size={16} />
            {/* Close */}
          </Button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={value.key}
          onValueChange={(key) => onChange({ ...value, key: key as SortKey })}
        >
          <DropdownMenuRadioItem
            value="shortCode"
            onSelect={(e) => e.preventDefault()}
          >
            Short code
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            value="createdAt"
            onSelect={(e) => e.preventDefault()}
          >
            Due date
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            value="clicks"
            onSelect={(e) => e.preventDefault()}
          >
            Click count
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem
            value="lastClicked"
            onSelect={(e) => e.preventDefault()}
          >
            Last clicked
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuRadioGroup
            value={value.order}
            onValueChange={(order) =>
              onChange({ ...value, order: order as "asc" | "desc" })
            }
          >
            <DropdownMenuRadioItem
              value="asc"
              onSelect={(e) => e.preventDefault()}
            >
              <ArrowUp size={16} className="mr-2" />
              Ascending
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem
              value="desc"
              onSelect={(e) => e.preventDefault()}
            >
              <ArrowDown size={16} className="mr-2" />
              Descending
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
