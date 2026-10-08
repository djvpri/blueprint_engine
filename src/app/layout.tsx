import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Blueprint Engine",
  description: "Wiki aplikasi — human & AI readable",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full bg-zinc-50 text-zinc-900">{children}</body>
    </html>
  );
}
