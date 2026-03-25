"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  CUSTOMER_AVATAR_CATALOG,
  type CustomerAvatarKey,
} from "@/lib/avatar-catalog";
import { FlaticonIcon } from "@/components/ui/flaticon-icon";
import { cn } from "@/lib/utils";
import {
  getNextAvatarIndex,
  shouldCloseOnEscape,
} from "@/components/customer/avatar-picker-state";

type AvatarPickerModalProps = {
  currentAvatarKey: CustomerAvatarKey;
  selectedAvatarKey: CustomerAvatarKey;
  isSaving: boolean;
  onClose: () => void;
  onSave: () => void;
  onSelect: (avatarKey: CustomerAvatarKey) => void;
};

export function AvatarPickerModal({
  currentAvatarKey,
  selectedAvatarKey,
  isSaving,
  onClose,
  onSave,
  onSelect,
}: AvatarPickerModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const dialogNode = dialogRef.current;
    if (!dialogNode) return;

    const selectedButton = dialogNode.querySelector<HTMLButtonElement>(
      `button[data-avatar-key="${selectedAvatarKey}"]`,
    );

    selectedButton?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (shouldCloseOnEscape(isSaving, event.key)) {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = Array.from(
        dialogNode.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );

      if (focusableElements.length === 0) {
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSaving, onClose, selectedAvatarKey]);

  const saveDisabled = isSaving || selectedAvatarKey === currentAvatarKey;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 p-3 sm:items-center" role="presentation">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="avatar-picker-title"
        aria-describedby="avatar-picker-description"
        className="w-full max-w-md rounded-3xl border border-border-muted bg-white p-4 shadow-[0_28px_68px_rgba(15,23,42,0.36)]"
      >
        <h2 id="avatar-picker-title" className="text-lg font-extrabold text-text-secondary">
          Choose Mascot Profile Photo
        </h2>
        <p id="avatar-picker-description" className="mt-1 text-sm text-text-muted">
          Pick one mascot to represent your TapWash profile.
        </p>

        <div role="radiogroup" aria-label="Mascot avatar options" className="mt-4 grid grid-cols-3 gap-3">
          {CUSTOMER_AVATAR_CATALOG.map((avatar, index) => {
            const isSelected = avatar.key === selectedAvatarKey;

            return (
              <button
                key={avatar.key}
                type="button"
                role="radio"
                aria-checked={isSelected}
                data-avatar-key={avatar.key}
                tabIndex={isSelected ? 0 : -1}
                aria-label={avatar.label}
                onClick={() => onSelect(avatar.key)}
                onKeyDown={(event) => {
                  if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(event.key)) {
                    return;
                  }

                  event.preventDefault();
                  const nextIndex = getNextAvatarIndex(index, event.key, CUSTOMER_AVATAR_CATALOG.length);
                  const nextAvatar = CUSTOMER_AVATAR_CATALOG[nextIndex];
                  onSelect(nextAvatar.key);

                  const nextButton = dialogRef.current?.querySelector<HTMLButtonElement>(
                    `button[data-avatar-key="${nextAvatar.key}"]`,
                  );
                  nextButton?.focus();
                }}
                className={cn(
                  "relative overflow-hidden rounded-2xl border-2 p-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
                  isSelected
                    ? "border-primary-500 bg-primary-500/5 shadow-[0_8px_20px_rgba(30,136,229,0.2)]"
                    : "border-border-muted bg-white hover:border-primary-500/40",
                )}
              >
                <Image
                  src={avatar.src}
                  alt={avatar.label}
                  width={96}
                  height={96}
                  sizes="(max-width: 640px) 28vw, 96px"
                  className="h-20 w-full rounded-xl object-cover"
                  loading="lazy"
                />
                <span className="mt-1 block truncate text-[11px] font-semibold text-text-secondary">{avatar.label}</span>
                {isSelected ? (
                  <span className="absolute right-1.5 top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-white">
                    <FlaticonIcon name="check" className="text-xs" />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex gap-2">
          <Button type="button" variant="secondary" className="h-11 flex-1" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="button" className="h-11 flex-1" onClick={onSave} disabled={saveDisabled}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
