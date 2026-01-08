import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "MUSITIX – Discover Live Music & Concerts",
  description: "Discover trending live music events, concerts, and festivals with MUSITIX.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased bg-black text-slate-100`}
      >
        {children}
      </body>
    </html>
  );
}
