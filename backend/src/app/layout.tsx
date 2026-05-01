import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProFruit Backend",
  description: "Backend API con Next.js para ProFruit",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <main className="container mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}

