import "./globals.css";
import { Toaster } from 'react-hot-toast';
import InstallPWA from "../components/installPWA";
import AuthGuard from "./authGuard";
import type { Metadata, Viewport } from "next";

// Viewport settings (Next.js 14+ standard)
export const viewport: Viewport = {
  themeColor: "#001E3C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// Metadata settings
export const metadata: Metadata = {
  title: "FlowPay",
  description: "Modern banking experience",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FlowPay",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* PWA Icons aur Manifest */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body style={{ backgroundColor: '#001E3C', margin: 0 }}>
        <AuthGuard>
        <Toaster 
          position="top-center" 
          containerStyle={{ zIndex: 10000 }}
          toastOptions={{
            style: {
              background: '#0A1622',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }
          }}
        />
        
        {children}

        <InstallPWA />
        </AuthGuard>
      </body>
    </html>
  );
}