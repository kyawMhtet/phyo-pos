import type { Metadata } from "next";
import { Sora, Manrope, Noto_Sans_Myanmar } from "next/font/google";
import "./globals.css";

const displayFont = Sora({
  variable: "--font-display-raw",
  weight: ["600", "700"],
  subsets: ["latin"],
});

const bodyFont = Manrope({
  variable: "--font-body-raw",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

const myanmarFont = Noto_Sans_Myanmar({
  variable: "--font-myanmar-raw",
  weight: ["400", "500", "600"],
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="mm"
      className={`${displayFont.variable} ${bodyFont.variable} ${myanmarFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
