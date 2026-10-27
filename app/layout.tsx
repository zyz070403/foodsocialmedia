import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VALE — Eat well, together",
  description: "A social food and fitness community with AI-powered nutrition insights.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
