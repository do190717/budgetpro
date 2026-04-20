import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ניהול תקציב פרויקטים",
  description: "אפליקציה לניהול תקציב פרויקטים, ניכויים ומעשרות",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" style={{ overflowX: 'hidden' }}>
      <body className="min-h-screen bg-gray-50 font-sans antialiased" style={{ overflowX: 'hidden', width: '100%' }}>
        {children}
      </body>
    </html>
  );
}
