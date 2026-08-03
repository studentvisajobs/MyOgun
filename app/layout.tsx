import type { Metadata } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import PushNotificationProvider from "@/app/components/PushNotificationProvider";


export const metadata: Metadata = {
  title: "MyOgun",
  description: "Personal Safety, Community Intelligence and Response Centre Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body>
      <PushNotificationProvider />
      {children}
    </body>
    </html>
  );
}