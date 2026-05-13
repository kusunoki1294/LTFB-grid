import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "LTFB Grid",
  description: "A 3x3 Immaculate Grid-style game powered by Google Sheets data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
