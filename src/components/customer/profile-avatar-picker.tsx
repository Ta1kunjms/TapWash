"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useMemo, useState } from "react";
import { updateCustomerAvatarAction } from "@/app/actions/customer";
import {
  DEFAULT_CUSTOMER_AVATAR_KEY,
  getCustomerAvatarByKey,
  normalizeCustomerAvatarKey,
  type CustomerAvatarKey,
} from "@/lib/avatar-catalog";
import { notify } from "@/lib/notify";
import { trackEvent } from "@/lib/analytics";

const AvatarPickerModal = dynamic(
  () => import("@/components/customer/avatar-picker-modal").then((mod) => mod.AvatarPickerModal),
  { loading: () => null },
);

type ProfileAvatarPickerProps = {
  initialAvatarKey: string | null | undefined;
  name: string;
};

export function ProfileAvatarPicker({ initialAvatarKey, name }: ProfileAvatarPickerProps) {
  const initialKey = useMemo(
    () => normalizeCustomerAvatarKey(initialAvatarKey),
    [initialAvatarKey],
  );

  const [committedAvatarKey, setCommittedAvatarKey] = useState<CustomerAvatarKey>(initialKey);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draftAvatarKey, setDraftAvatarKey] = useState<CustomerAvatarKey>(initialKey);
  const [isSaving, setIsSaving] = useState(false);
  const [imageSrc, setImageSrc] = useState(getCustomerAvatarByKey(initialKey).src);

  const openModal = () => {
    setDraftAvatarKey(committedAvatarKey);
    setIsModalOpen(true);
    trackEvent("avatar_modal_opened");
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
  };

  async function handleSave() {
    if (draftAvatarKey === committedAvatarKey) {
      return;
    }

    setIsSaving(true);
    const response = await updateCustomerAvatarAction({ avatarKey: draftAvatarKey });

    if (!response.ok) {
      trackEvent("avatar_saved_failed", { avatarKey: draftAvatarKey });
      notify.error(response.message);
      setIsSaving(false);
      return;
    }

    const savedAvatarKey = normalizeCustomerAvatarKey(response.avatarKey ?? DEFAULT_CUSTOMER_AVATAR_KEY);
    setCommittedAvatarKey(savedAvatarKey);
    setImageSrc(getCustomerAvatarByKey(savedAvatarKey).src);
    trackEvent("avatar_saved_success", { avatarKey: savedAvatarKey });
    notify.success("Mascot avatar saved.");

    setIsSaving(false);
    setIsModalOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="mx-auto mb-2 block rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
        aria-label="Open mascot profile photo picker"
      >
        <Image
          src={imageSrc}
          alt={`${name} mascot profile photo`}
          width={80}
          height={80}
          sizes="80px"
          className="h-20 w-20 rounded-full border-2 border-primary-500 object-cover bg-white"
          priority
          onError={() => {
            const fallbackSrc = getCustomerAvatarByKey(DEFAULT_CUSTOMER_AVATAR_KEY).src;
            setImageSrc(fallbackSrc);
          }}
        />
      </button>

      {isModalOpen ? (
        <AvatarPickerModal
          currentAvatarKey={committedAvatarKey}
          selectedAvatarKey={draftAvatarKey}
          isSaving={isSaving}
          onClose={closeModal}
          onSave={() => {
            void handleSave();
          }}
          onSelect={(avatarKey) => {
            setDraftAvatarKey(avatarKey);
            trackEvent("avatar_selected", { avatarKey });
          }}
        />
      ) : null}
    </>
  );
}
