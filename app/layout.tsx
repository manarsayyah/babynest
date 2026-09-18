import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import "./globals.css";
import { SiteChrome } from "@/components/layout/site-chrome";
import { Toaster } from "@/components/ui/sonner";

const fontSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "BabyNest — Everything Your Baby Needs",
  description:
    "AI-powered baby products e-commerce — curated essentials, smart search, and personalized recommendations for every stage of your baby's journey.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Fetched server-side so SessionProvider's initial client state (and the
  // very first server-rendered HTML) already reflects the real session,
  // instead of always rendering "logged out" until the client re-fetches it.
  const session = await auth();

  return (
    <html lang="en" className={`${fontSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <SessionProvider session={session}>
          <SiteChrome>{children}</SiteChrome>
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
