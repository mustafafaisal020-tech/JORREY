import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Playfair_Display, Cairo } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import UserListsProvider from "@/components/UserListsProvider";
import PWAInstallBanner from "@/components/PWAInstallBanner";
import PushSubscriptionSetup from "@/components/PushSubscriptionSetup";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Jorrey — Elegance Designed for You",
  description: "Curated luxury fashion pieces crafted for the discerning few.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Jorrey",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0C0C0C",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const isRTL = locale === "ar";

  return (
    <ClerkProvider>
      <html
        lang={locale}
        dir={isRTL ? "rtl" : "ltr"}
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} ${cairo.variable} h-full antialiased`}
      >
        <head>
          <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
          <script dangerouslySetInnerHTML={{ __html:
            `if('serviceWorker' in navigator){` +
            `window.addEventListener('load',()=>{` +
            `navigator.serviceWorker.register('/sw.js',{scope:'/'}).catch(()=>{});` +
            `});}`
          }} />
        </head>
        <body className="min-h-full flex flex-col">
          <NextIntlClientProvider locale={locale} messages={messages}>
            <UserListsProvider>
              {children}
            </UserListsProvider>
            <PWAInstallBanner />
            <PushSubscriptionSetup />
          </NextIntlClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
