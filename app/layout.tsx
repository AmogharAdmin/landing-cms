import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { getSiteData } from "@/lib/server/site-data";
import { ThemeStyles } from "@/components/ui/ThemeStyles";
import { AnalyticsMount } from "@/components/analytics/AnalyticsMount";
import { AttributionCapture } from "@/components/analytics/AttributionCapture";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import "./globals.css";

/** Same Inter family as a variable font with swap (avoids FOIT; one compact file). */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  adjustFontFallback: true,
  preload: true,
});

export async function generateMetadata(): Promise<Metadata> {
  const siteData = await getSiteData();
  return {
    metadataBase: new URL(siteData.seo.canonical),
    title: siteData.seo.title,
    description: siteData.seo.description,
    keywords: siteData.seo.keywords,
    robots: siteData.seo.robots,
    icons: { icon: siteData.site.favicon },
    openGraph: {
      title: siteData.seo.title,
      description: siteData.seo.description,
      url: siteData.seo.canonical,
      siteName: siteData.site.name,
      locale: "en_IN",
      type: "website",
      images: [{
        url: siteData.seo.ogImage,
        width: 1200,
        height: 630,
        alt: siteData.site.name,
      }],
    },
    twitter: {
      card: "summary_large_image",
      title: siteData.seo.title,
      description: siteData.seo.description,
      images: [siteData.seo.ogImage],
    },
    alternates: { canonical: siteData.seo.canonical },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const siteData = await getSiteData();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Residence",
    name: siteData.site.name,
    description: siteData.seo.description,
    url: siteData.seo.canonical,
    image: siteData.seo.ogImage,
    address: {
      "@type": "PostalAddress",
      addressLocality: siteData.site.location,
      addressRegion: "Karnataka",
      addressCountry: "IN",
    },
    telephone: siteData.site.phone,
    brand: siteData.site.developer,
  };

  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full [background:var(--fill-background)] font-sans font-normal text-[var(--color-text)]" suppressHydrationWarning>
        <ThemeStyles theme={siteData.theme} customGradients={siteData.customButtonGradients} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <AnalyticsMount />
        <AttributionCapture />
        <GoogleAnalytics config={siteData.googleAnalytics} />
        {children}
      </body>
    </html>
  );
}
