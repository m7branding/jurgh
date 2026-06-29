import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JURGH Car Detailing — Klantenportaal",
  description:
    "Het digitale dossier voor jouw auto. Volg behandelingen, foto's en documenten — premium detailing, glascoating en PPF.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
