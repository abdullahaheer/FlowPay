
import "./globals.css";
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: "FlowPay",
  description: "Modern banking experience",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <Toaster position="top-center" />
        {children}
      </body>
    </html>
  );
}
