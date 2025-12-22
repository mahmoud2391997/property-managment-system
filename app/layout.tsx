import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: {
    default: "TenancyPilot",
    template: "%s | TenancyPilot", // Child pages become "Dashboard | TenancyPilot"
  },
  description: "Streamline your property management with automated rent collection, tenant tracking, and financial reporting.",
  keywords: ["property management", "tenant management", "rent collection", "landlord software", "Malaysia"],
  authors: [{ name: "TenancyPilot" }],
  creator: "TenancyPilot",
  metadataBase: new URL("https://tenancypilot.com"), // Your domain
  openGraph: {
    type: "website",
    locale: "en_MY",
    siteName: "TenancyPilot",
    title: "TenancyPilot - Property Management System",
    description: "Streamline your property management with automated rent collection, tenant tracking, and financial reporting.",
    // images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "TenancyPilot",
    description: "Streamline your property management with automated rent collection, tenant tracking, and financial reporting.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="md:bg-(--background-secondary) h-screen overflow-hidden" suppressHydrationWarning>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}