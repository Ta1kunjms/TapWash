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
  onValueChange: (value: string) => void;
  onCoordinateSelect: (coordinates: { lat: number; lng: number } | null) => void;
};

export function AddressAutocomplete({
  label,
  name,
  placeholder,
  value,
  onValueChange,
  onCoordinateSelect,
}: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (value.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/maps/suggest?q=${encodeURIComponent(value.trim())}`);
        if (!response.ok) return;
        const body = (await response.json()) as { suggestions: Suggestion[] };
        setSuggestions(body.suggestions ?? []);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [value]);

  const helperText = useMemo(() => {
    if (loading) return "Searching addresses...";
    if (open && suggestions.length === 0 && value.trim().length >= 3) return "No suggestions found.";
    return "";
  }, [loading, open, suggestions.length, value]);

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
