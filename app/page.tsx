import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { EnquiryModal } from "@/components/layout/EnquiryModal";
import { FloatingContacts } from "@/components/layout/FloatingContacts";
import { Hero } from "@/components/hero/Hero";
import { About } from "@/components/about/About";
import { Highlights } from "@/components/highlights/Highlights";
import { Amenities } from "@/components/amenities/Amenities";
import { Homes } from "@/components/homes/Homes";
import { Gallery } from "@/components/gallery/Gallery";
import { Location } from "@/components/location/Location";
import { VirtualTour } from "@/components/virtual-tour/VirtualTour";
import { Plans } from "@/components/plans/Plans";
import { FAQ } from "@/components/faq/FAQ";
import { FaqJsonLd } from "@/components/faq/FaqJsonLd";
import { ContactSection } from "@/components/contact/ContactSection";
import { SiteDataProvider } from "@/components/providers/SiteDataProvider";
import { GoogleTagManager } from "@/components/analytics/GoogleTagManager";
import { cookies } from "next/headers";
import { toPublicSiteData } from "@/lib/buildesk-crm";
import { getSiteData } from "@/lib/server/site-data";
import { normalizeSectionOrder, normalizeSectionSettings } from "@/lib/section-order";
import { UTM_TERM_COOKIE, sanitizeUtmTerm } from "@/lib/attribution";
import { applyKeywordContent, matchKeywordRule, stripKeywordContent } from "@/lib/keyword-content";
import type { LandingSectionKey } from "@/types/site";

export const dynamic = "force-dynamic";

function LandingSection({ section }: { section: LandingSectionKey }) {
  switch (section) {
    case "hero": return <Hero />;
    case "about": return <About />;
    case "highlights": return <Highlights />;
    case "amenities": return <Amenities />;
    case "homes": return <Homes />;
    case "gallery": return <Gallery />;
    case "location": return <Location />;
    case "virtualTourSection": return <VirtualTour />;
    case "plansSection": return <Plans />;
    case "faqSection": return <FAQ />;
    case "contactSection": return <ContactSection />;
  }
}

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** URL `utm_term` wins; otherwise the term saved from an earlier ad click. */
async function resolveUtmTerm(searchParams: HomePageProps["searchParams"]) {
  const raw = (await searchParams).utm_term;
  const fromUrl = sanitizeUtmTerm(Array.isArray(raw) ? raw[0] : raw);
  if (fromUrl) return fromUrl;
  const cookieStore = await cookies();
  return sanitizeUtmTerm(cookieStore.get(UTM_TERM_COOKIE)?.value);
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const rawSiteData = await getSiteData();
  const rule = matchKeywordRule(rawSiteData.keywordContent, await resolveUtmTerm(searchParams));
  const siteData = toPublicSiteData(stripKeywordContent(applyKeywordContent(rawSiteData, rule)));
  const sectionOrder = normalizeSectionOrder(siteData.sectionOrder);
  const sectionSettings = normalizeSectionSettings(siteData.sectionSettings);
  const faqJsonLdItems = siteData.faqSection?.items?.length ? siteData.faqSection.items : siteData.faqs;
  return (
    <SiteDataProvider data={siteData}>
      <GoogleTagManager
        config={siteData.googleTagManager}
        legacyGoogleAnalytics={siteData.googleAnalytics}
        projectName={siteData.site.name}
      />
      <Header />
      <main>
        {sectionOrder.map((section) => {
          const settings = sectionSettings[section];
          if (!settings.enabled) return null;

          return (
            <div
              key={section}
              id={settings.anchor}
              data-managed-section={section}
              data-has-custom-bg={Boolean(settings.backgroundColor)}
              data-has-custom-color={Boolean(settings.textColor)}
              className="scroll-mt-[var(--mobile-header-offset,100px)]"
              style={{
                paddingTop: settings.paddingTop,
                paddingBottom: settings.paddingBottom,
                marginTop: settings.marginTop,
                marginBottom: settings.marginBottom,
                backgroundColor: settings.backgroundColor || undefined,
                color: settings.textColor || undefined,
              }}
            >
              {section === "faqSection" ? <FaqJsonLd items={faqJsonLdItems} /> : null}
              <LandingSection section={section} />
            </div>
          );
        })}
      </main>
      <Footer />
      <FloatingContacts />
      <EnquiryModal />
    </SiteDataProvider>
  );
}
