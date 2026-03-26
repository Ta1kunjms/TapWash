"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

const ROTATION_INTERVAL_MS = 2000;

const PINGU_IMAGES = [
  "/pingu/Artboard 5.png",
  "/pingu/Artboard 5 copy.png",
  "/pingu/Artboard 5 copy 2.png",
] as const;

export function HomeGreetingMascotRotator(): React.ReactElement {
  const [index, setIndex] = useState(0);
  const imageCount = useMemo(() => PINGU_IMAGES.length, []);

  useEffect(() => {
    if (imageCount <= 1) return;

    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % imageCount);
    }, ROTATION_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [imageCount]);

  return (
    <div className="relative h-20 w-20 shrink-0 sm:h-24 sm:w-24">
      <Image
        src={PINGU_IMAGES[index]}
        alt="TapWash mascot"
        fill
        sizes="(max-width: 640px) 80px, 96px"
        className="object-contain"
        priority
      />
    </div>
  );
}
