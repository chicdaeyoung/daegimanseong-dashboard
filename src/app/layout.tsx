import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Daegimanseong Store Dashboard",
  description:
    "Sales, food cost, margin, and inventory analytics for Daegimanseong franchise and 직영 stores.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full bg-slate-950`}
      >
        <div className="min-h-screen bg-slate-950 text-slate-50">
          {children}
        </div>
      </body>
    </html>
  );
}
