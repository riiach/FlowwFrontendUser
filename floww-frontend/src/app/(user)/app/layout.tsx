import type { Metadata } from "next";
import type { ReactNode } from "react";
import SideBar from "@/components/user/SideBar"
import Background from "@/components/user/Background"
import TopNav from "@/components/user/TopNav"

import "@/app/globals.css"
import "@/styles/surfaces.css";

export const metadata: Metadata = {
  title: "Floww",
  description: "Your personal shopping agent Floww.",
};

export default function UserAppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-0 w-full flex-1 overflow-y-auto bg-background text-foreground">
        <div className="absolute inset-x-0 z-10">
            <Background />
        </div>
        <div className="absolute inset-x-4 top-4 z-20 h-8 -mb-2">
            <TopNav />
        </div>
        <div className="glass-card absolute inset-4 top-20 z-20 -mt-4">
            <div className="absolute inset-0 z-30 flex overflow-hidden p-2 gap-6">
                <SideBar />
                <main className="min-w-0 flex-1">{children}</main>
            </div>
        </div>
    </div>
  );
}
