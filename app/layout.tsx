import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { getLocale } from "@/lib/i18n";
import "./globals.css";

// Self-hosted: about 1 in 20 Google Fonts responses use URLs that Turbopack's
// next/font/google can't parse, which fails the build at random.
const displayFont = localFont({
  src: "./fonts/bricolage-grotesque-latin.woff2",
  variable: "--font-display-raw",
  weight: "600 700",
  display: "swap",
});

const bodyFont = localFont({
  src: "./fonts/figtree-latin.woff2",
  variable: "--font-body-raw",
  weight: "300 900",
  display: "swap",
});

const myanmarFont = localFont({
  src: "./fonts/noto-sans-myanmar.woff2",
  variable: "--font-myanmar-raw",
  weight: "400 700",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Diva Delivery Bag",
  description: "Diva Delivery Bag — family POS",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f1e7" },
    { media: "(prefers-color-scheme: dark)", color: "#15100c" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();

  return (
    <html
      lang={locale === "mm" ? "my" : "en"}
      className={`${displayFont.variable} ${bodyFont.variable} ${myanmarFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
