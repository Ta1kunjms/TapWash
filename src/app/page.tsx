"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import brandAsset from "../../Logo/Asset 16@300x.png";

export default function Home() {
  const router = useRouter();
  const [entered, setEntered] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const enterFrame = window.requestAnimationFrame(() => setEntered(true));
    const fadeTimer = window.setTimeout(() => setFadeOut(true), 3300);
    const redirectTimer = window.setTimeout(() => {
      router.replace("/login");
    }, 4000);

    return () => {
      window.cancelAnimationFrame(enterFrame);
      window.clearTimeout(fadeTimer);
      window.clearTimeout(redirectTimer);
    };
  }, [router]);

  const splashClass = fadeOut
    ? "opacity-0 scale-[0.94] -translate-y-0.5 blur-[1px]"
    : entered
      ? "opacity-100 scale-100 translate-y-0 blur-0"
      : "opacity-0 scale-[0.985] translate-y-1 blur-[1.5px]";

  return (
    <main className="flex min-h-screen items-center justify-center bg-background-app">
      <div
        className={`flex flex-col items-center transition-[opacity,transform,filter] duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${splashClass}`}
      >
        <Image
          src={brandAsset}
          alt="TapWash by TopPix"
          priority
          className={`h-auto w-[230px] drop-shadow-lg sm:w-[260px] ${fadeOut ? "" : "splash-breathe"}`}
        />
      </div>
    </main>
  );
}
