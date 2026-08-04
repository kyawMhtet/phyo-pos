import type { Metadata } from "next";
import { Special_Elite, IBM_Plex_Sans, Noto_Sans_Myanmar } from "next/font/google";
import "./globals.css";

const displayFont = Special_Elite({
  variable: "--font-display-raw",
  weight: "400",
  subsets: ["latin"],
});

const bodyFont = IBM_Plex_Sans({
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
  title: "Phyo POS",
  description: "Family delivery-bag POS",
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
