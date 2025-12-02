import type { Metadata } from "next";
import { Geist, Geist_Mono, Archivo_Black } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const archivoBlack = Archivo_Black({
  weight: "400",
  variable: "--font-archivo-black",
  subsets: ["latin"],
});

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://theforge.squareweb.app';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: "The Forge - Crafting",
  description: "Optimize your builds with our advanced calculator. Discover ore traits, calculate odds, and forge the ultimate gear.",
  openGraph: {
    title: "The Forge - Crafting",
    description: "Optimize your builds with our advanced calculator. Discover ore traits, calculate odds, and forge the ultimate gear.",
    images: [
      {
        url: "/gamethumb.png",
        width: 1200,
        height: 630,
        alt: "The Forge - Crafting Calculator",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Forge - Crafting",
    description: "Optimize your builds with our advanced calculator. Discover ore traits, calculate odds, and forge the ultimate gear.",
    images: ["/gamethumb.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${archivoBlack.variable} antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
