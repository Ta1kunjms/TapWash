"use client";

import { FlaticonIcon } from "@/components/ui/flaticon-icon";
import { notify } from "@/lib/notify";

type Props = {
  shopName: string;
  label: string;
  copiedMessage: string;
  failedMessage: string;
  className?: string;
};

export function ShopShareButton({
  shopName,
  label,
  copiedMessage,
  failedMessage,
  className,
}: Props) {
  const onShare = async () => {
    try {
      const shareUrl = window.location.href;

      if (typeof navigator.share === "function") {
        await navigator.share({
          title: shopName,
          text: `Check out ${shopName} on TapWash`,
          url: shareUrl,
        });
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      notify.success(copiedMessage);
    } catch {
      notify.error(failedMessage);
    }
  };

  return (
    <button
      type="button"
      onClick={onShare}
      className={
        className ??
        "inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/85 text-primary-500 shadow-sm backdrop-blur-sm"
      }
      aria-label={label}
    >
      <FlaticonIcon name="share" className="text-base" />
    </button>
  );
}
