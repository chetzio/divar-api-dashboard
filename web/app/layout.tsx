import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import NavBar from "@/components/NavBar";
import "./globals.css";

// Lalezar (a second display face) was tried here for headings but couldn't be
// verified - this sandbox has no outbound access to fonts.gstatic.com for a
// font that hasn't been fetched before (same restriction noted in
// PROJECT_NOTES.md for the Telegram API), which 500'd every page. Falling
// back to Vazirmatn's own heavy weight for headings instead: zero extra
// network dependency, and genuinely a better call for a PWA dad will load
// over a phone connection anyway. Re-attempt a second display face later on
// a machine with normal internet access if it's still wanted.
const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-vazirmatn",
});

export const metadata: Metadata = {
  title: "رادیوکار",
  description: "دفترچه خرید و فروش رادیوهای قدیمی",
  manifest: "/manifest.json",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#00788c",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>
      <body className="font-sans bg-canvas pb-20 text-ink">
        <main className="mx-auto max-w-lg px-4 pt-6">{children}</main>
        <NavBar />
      </body>
    </html>
  );
}
