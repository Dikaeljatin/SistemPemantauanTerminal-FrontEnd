import type { Metadata } from "next";
import "../index.css";

export const metadata: Metadata = {
  title: "Dashboard Manajemen Kendaraan",
  description: "Dashboard untuk manajemen kendaraan",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
