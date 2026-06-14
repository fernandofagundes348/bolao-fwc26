import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { ToastProvider } from "@/components/ui";

export const metadata: Metadata = {
  title: "Bolão FWC 2026",
  description: "Bolão Copa do Mundo 2026",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />

        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        <link
          href="https://fonts.googleapis.com/css2?family=Exo+2:wght@400;500;600;700;800&family=Nunito:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>

      <body
        className="min-h-screen bg-[#F4F7F2] antialiased"
        style={{ fontFamily: "'Nunito', sans-serif" }}
      >
        <div className="flex-1 min-w-0 min-h-screen pb-20 md:ml-64 md:pb-0">
          <Sidebar />

          <main className="flex-1 min-h-screen pb-20 md:ml-64 md:pb-0">
            <div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-8">
              {children}
            </div>
          </main>
        </div>

        <ToastProvider />
      </body>
    </html>
  );
}