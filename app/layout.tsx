import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree, Noto_Sans_Myanmar } from "next/font/google";
import { getLocale } from "@/lib/i18n";
import "./globals.css";

const displayFont = Bricolage_Grotesque({
  variable: "--font-display-raw",
  weight: ["600", "700"],
  subsets: ["latin"],
});

const bodyFont = Figtree({
  variable: "--font-body-raw",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const myanmarFont = Noto_Sans_Myanmar({
  variable: "--font-myanmar-raw",
  weight: ["400", "500", "600", "700"],
  subsets: ["myanmar", "latin"],
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
