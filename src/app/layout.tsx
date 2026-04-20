import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ניהול תקציב פרויקטים",
  description: "אפליקציה לניהול תקציב פרויקטים, ניכויים ומעשרות",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
