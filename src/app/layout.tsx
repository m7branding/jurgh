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
  title: "JURGH — Detailing Portal",
  description:
    "Het digitale dossier voor jouw auto. Volg behandelingen, foto's en documenten — premium detailing, glascoating en PPF.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl" className={poppins.variable}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
