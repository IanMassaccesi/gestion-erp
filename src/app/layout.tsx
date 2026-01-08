import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Todo Kiosco | Tech Dashboard",
  description: "Sistema de gestión comercial",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className={`${outfit.variable} ${inter.variable} font-sans bg-brand-dark text-brand-text antialiased selection:bg-brand-primary selection:text-brand-dark`}>
        {children}
      </body>
    </html>
  );
}