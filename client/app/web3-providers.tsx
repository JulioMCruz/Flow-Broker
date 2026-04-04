"use client";

import dynamic from "next/dynamic";
import { ReactNode } from "react";

const Providers = dynamic(
  () => import("./providers").then((m) => m.Providers),
  { ssr: false }
);

export function Web3Providers({ children }: { children: ReactNode }) {
  return <Providers>{children}</Providers>;
}
