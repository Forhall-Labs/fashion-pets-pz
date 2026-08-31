import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";

import { QueryProvider } from "@/modules/shared/components/QueryProvider";

import "./globals.css";
import "@/styles/prototype.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Agenda — Peluquería Canina",
  description: "Sistema de agenda para peluquería canina",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${poppins.variable} ${inter.variable}`}>
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
