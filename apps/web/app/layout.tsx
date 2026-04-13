import "./globals.css";
import type { Metadata } from "next";

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
        <main>{children}</main>
      </body>
    </html>
  );
}

