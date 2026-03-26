import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Atomized — Intelligence Reporting for Agencies",
  description:
    "Auto-generate strategic PowerPoint reports from multi-source marketing data.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
