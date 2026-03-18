"use client";

import { useEffect, useState } from "react";

type Props = {
  locationLabel: string;
};

export function LocationSheetTrigger({ locationLabel }: Props) {
  const [label, setLabel] = useState(locationLabel);

  useEffect(() => {
    setLabel(locationLabel);
  }, [locationLabel]);

  useEffect(() => {
    const onUpdated = (event: Event) => {
      const custom = event as CustomEvent<{ label?: string; cleared?: boolean }>;
      if (custom.detail?.cleared) {
        setLabel("Set location");
        return;
      }

      const next = custom.detail?.label?.trim();
      if (next) setLabel(next);
    };

    window.addEventListener("tapwash:location-updated", onUpdated as EventListener);
    return () => window.removeEventListener("tapwash:location-updated", onUpdated as EventListener);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("tapwash:open-location-sheet"))}
      className="text-center leading-tight"
      aria-label="Set location"
    >
      <p className="text-xs font-semibold tracking-wide text-white/80">Location</p>
      <p className="line-clamp-1 max-w-[10rem] text-sm font-semibold">{label}</p>
    </button>
  );
}
