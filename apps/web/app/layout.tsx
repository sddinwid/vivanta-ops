import "./globals.css";
import type { Metadata } from "next";
import { AppShell } from "../components/layout/AppShell";

export const metadata: Metadata = {
  title: "Vivanta Operations OS",
  description: "Internal AI-assisted property operations platform"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
