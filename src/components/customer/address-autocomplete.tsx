"use client";

import { Input } from "@/components/ui/input";
import { useEffect, useMemo, useState } from "react";

type Suggestion = {
  label: string;
  placeName: string;
  lat: number;
  lng: number;
};

type Props = {
  label: string;
  name: string;
  placeholder: string;
  value: string;
  proximity?: { lat: number; lng: number } | null;
  onValueChange: (value: string) => void;
  onCoordinateSelect: (coordinates: { lat: number; lng: number } | null) => void;
};

export function AddressAutocomplete({
  label,
  name,
  placeholder,
  value,
  proximity,
  onValueChange,
  onCoordinateSelect,
}: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [requestError, setRequestError] = useState<string>("");

  useEffect(() => {
    if (value.trim().length < 3) {
      setSuggestions([]);
      setRequestError("");
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      setLoading(true);
      setRequestError("");

      const params = new URLSearchParams({ q: value.trim() });
      if (proximity) {
        params.set("lat", String(proximity.lat));
        params.set("lng", String(proximity.lng));
      }

      try {
        const response = await fetch(`/api/maps/suggest?${params.toString()}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Unable to load suggestions");
        const body = (await response.json()) as { suggestions: Suggestion[] };
        setSuggestions(body.suggestions ?? []);
        setOpen(true);
      } catch (error) {
        if (controller.signal.aborted) return;
        setSuggestions([]);
        setRequestError(error instanceof Error ? error.message : "Location search is unavailable.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [value, proximity]);

  const helperText = useMemo(() => {
    if (loading) return "Searching addresses...";
    if (requestError) return requestError;
    if (open && suggestions.length === 0 && value.trim().length >= 3) return "No suggestions found.";
    return "";
  }, [loading, requestError, open, suggestions.length, value]);

  return (
    <div className="relative">
      <label className="mb-1 block text-xs font-semibold text-text-secondary">{label}</label>
      <Input
        required
        name={name}
        placeholder={placeholder}
        value={value}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          onValueChange(event.target.value);
          onCoordinateSelect(null);
        }}
      />

      {helperText && <p className="mt-1 text-[11px] text-text-muted">{helperText}</p>}

      {open && suggestions.length > 0 && (
        <div className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-2xl border border-border-muted bg-white shadow-soft">
          {suggestions.map((suggestion) => (
            <button
              key={`${suggestion.placeName}-${suggestion.lat}-${suggestion.lng}`}
              type="button"
              onClick={() => {
                onValueChange(suggestion.placeName);
                onCoordinateSelect({ lat: suggestion.lat, lng: suggestion.lng });
                setOpen(false);
              }}
              className="block w-full border-b border-border-muted px-3 py-2 text-left text-sm last:border-b-0 hover:bg-background-app"
            >
              <span className="block font-medium text-text-primary">{suggestion.label}</span>
              <span className="block text-xs text-text-muted">{suggestion.placeName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
