import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NUMPA — Data workspace",
  description: "Understand, prepare, and validate a dataset before machine learning.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
