import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "M7 — Stel je online experience samen",
  description:
    "Blader door de M7-catalogus en stel real-time je dienstverlening samen: Branding, Websites, Webshops, Apps, Marketing, SEO/AEO, Funnels, Tracking, Hosting en Support — met heldere indicatieve prijzen.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={poppins.variable}>
      <body>{children}</body>
    </html>
  );
}
