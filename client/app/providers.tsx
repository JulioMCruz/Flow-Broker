"use client";

import { useState, useEffect, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

// Lazy load wagmi/rainbowkit only on client side
export function Providers({ children }: { children: ReactNode }) {
  const [Component, setComponent] = useState<any>(null);

  useEffect(() => {
    // Dynamic imports to avoid SSR issues
    Promise.all([
      import("wagmi"),
      import("@rainbow-me/rainbowkit"),
      import("@/lib/web3"),
    ]).then(([{ WagmiProvider }, { RainbowKitProvider }, { wagmiConfig }]) => {
      import("@rainbow-me/rainbowkit/styles.css").catch(() => {});
      
      function Inner({ children }: { children: ReactNode }) {
        return (
          <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
              <RainbowKitProvider>
                {children}
              </RainbowKitProvider>
            </QueryClientProvider>
          </WagmiProvider>
        );
      }
      setComponent(() => Inner);
    });
  }, []);

  if (!Component) return <>{children}</>;
  return <Component>{children}</Component>;
}
