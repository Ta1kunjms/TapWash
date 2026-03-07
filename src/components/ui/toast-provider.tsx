"use client";

import { Toaster } from "sileo";
import "sileo/styles.css";

export function ToastProvider() {
  return <Toaster position="top-center" />;
}
