"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

/** 요청마다(서버)·탭마다(브라우저) QueryClient 하나 */
export function QueryProvider({ children }: { children: ReactNode }) {
    const [client] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: { retry: false, refetchOnWindowFocus: false },
                    mutations: { retry: false },
                },
            }),
    );
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}