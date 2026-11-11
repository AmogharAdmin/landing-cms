export type ThemeFillKey =
  | "primary"
  | "secondary"
  | "accent"
  | "button"
  | "primaryButton"
  | "secondaryButton"
  | "background"
  | "lightBackground"
  | "darkSection"
  | "cardBackground"
  | "whatsapp";

export type Theme = {
  primary: string;
  secondary: string;
  accent: string;
  button: string;
  buttonText: string;
  background: string;
  lightBackground: string;
  text: string;
  mutedText: string;
  darkSection: string;
  whatsapp: string;
  titleColor: string;
  descriptionColor: string;
  primaryButton: string;
  primaryButtonText: string;
  secondaryButton: string;
  secondaryButtonText: string;
  cardBackground: string;
  borderColor: string;
  /** Optional gradient preset ids for fill tokens (plain color stays in the matching string field). */
  gradients?: Partial<Record<ThemeFillKey, string>>;
};

export type CtaAction =
  | "brochure"
  | "scroll"
  | "enquire"
  | "whatsapp"
  | "call"
  | "link"
  | "map"
  | "download";

export type Cta = {
  label: string;
  action: CtaAction;
  target?: string;
  href?: string;
  intent?: string;
  backgroundType?: "plain" | "gradient";
  backgroundColor?: string;
  backgroundGradient?: string;
  textColor?: string;
  labelFontSize?: number;
  labelFontWeight?: number;
  labelFontFamily?: string;
  labelLineHeight?: number;
};

export type HeaderButton = Cta & {
  enabled: boolean;
  backgroundColor: string;
  textColor?: string;
};

export type FloatingButton = {
  enabled: boolean;
  label: string;
  icon?: string;
  intent?: string;
  backgroundType?: "plain" | "gradient";
  backgroundColor?: string;
  backgroundGradient?: string;
  textColor?: string;
  fontSize?: number;
  fontWeight?: number;
  fontFamily?: string;
};

export type EnquirySuccessType = "message" | "download" | "whatsapp" | "link";

export type EnquiryFormField = {
  enabled: boolean;
  required: boolean;
  label: string;
  placeholder: string;
};

export type EnquiryCustomFieldType =
  | "text"
  | "select"
  | "radio"
  | "checkbox"
  | "textarea"
  | "email"
  | "tel"
  | "number"
  | "date";

/** Extra lead-form inputs beyond name / phone / email. */
export type EnquiryCustomField = EnquiryFormField & {
  id: string;
  type: EnquiryCustomFieldType;
  options?: string[];
};

export type EnquiryHighlight = {
  icon: string;
  iconColor?: string;
  value: string;
  label: string;
  textColor?: string;
  valueColor?: string;
  labelColor?: string;
};

export type EnquiryIntent = {
  id: string;
  name: string;
  /** Optional GTM / dataLayer override so each popup form stays uniquely trackable. */
  gtmId?: string;
  heading: string;
  headingAccent?: string;
  description?: string;
  submitLabel?: string;
  successType: EnquirySuccessType;
  successMessage: string;
  successButtonLabel?: string;
  successHref?: string;
  backgroundImage?: string;
  backgroundImageAlt?: string;
  /** Form panel background. Defaults to deep navy. */
  backgroundColor?: string;
  logo?: string;
  showLogo?: boolean;
  highlightsEnabled?: boolean;
  highlights?: EnquiryHighlight[];
  footerText?: string;
  fields?: {
    name?: Partial<EnquiryFormField>;
    phone?: Partial<EnquiryFormField>;
    email?: Partial<EnquiryFormField>;
    custom?: EnquiryCustomField[];
  };
};

export type NavItem = {
  label: string;
  target: string;
};

export type SiteInfo = {
  name: string;
  location: string;
  developer: string;
  logo: string;
  dashboardLogo?: string;
  /** Optional second header logo (right side). When set, nav floats between logos. */
  secondaryLogo?: string;
  /** Header logo height on mobile (px). Defaults to 40. */
  logoHeightMobile?: number;
  /** Header logo height from sm breakpoint up (px). Defaults to 48. */
  logoHeight?: number;
  /** Header logo width on mobile (px). Unset keeps the natural width. */
  logoWidthMobile?: number;
  /** Header logo width from sm breakpoint up (px). Unset keeps the natural width. */
  logoWidth?: number;
  /** Optional background color behind the primary header logo. */
  logoBackgroundColor?: string;
  /** Secondary header logo height on mobile (px). Defaults to primary / 40. */
  secondaryLogoHeightMobile?: number;
  /** Secondary header logo height from sm breakpoint up (px). Defaults to primary / 48. */
  secondaryLogoHeight?: number;
  /** Secondary header logo width on mobile (px). Unset keeps the natural width. */
  secondaryLogoWidthMobile?: number;
  /** Secondary header logo width from sm breakpoint up (px). Unset keeps the natural width. */
  secondaryLogoWidth?: number;
  /** Optional background color behind the secondary header logo. */
  secondaryLogoBackgroundColor?: string;
  favicon: string;
  phone: string;
  whatsapp: string;
  /** Prefill text for wa.me links (floating WhatsApp, sticky bar, CTA whatsapp actions). */
  whatsappMessage?: string;
  /** Floating call FAB fill (plain color or gradient). */
  callButtonBackgroundType?: "plain" | "gradient";
  callButtonColor?: string;
  callButtonGradient?: string;
  /** Floating WhatsApp FAB fill (plain color or gradient). */
  whatsappButtonBackgroundType?: "plain" | "gradient";
  whatsappButtonColor?: string;
  whatsappButtonGradient?: string;
  address: string;
  brochureUrl: string;
  masterPlanUrl: string;
  /**
   * When false, skip the “we received your enquiry” email to the visitor.
   * Admin MAIL_RECIPIENT notification still sends. Defaults to true.
   */
  sendLeadConfirmationEmail?: boolean;
};

export type HeroFact = {
  icon: string;
  iconColor?: string;
  value: string;
  label: string;
  textColor?: string;
  valueColor?: string;
  labelColor?: string;
};

export type Feature = {
  enabled?: boolean;
  icon: string;
  iconColor?: string;
  title: string;
  description: string;
  cta: Cta;
  textColor?: string;
  titleColor?: string;
  descriptionColor?: string;
};

export type Highlight = {
  icon: string;
  iconColor?: string;
  value: string;
  label: string;
  textColor?: string;
  valueColor?: string;
  labelColor?: string;
};

export type AmenityItem = {
  icon: string;
  iconColor?: string;
  /** Uploaded SVG/PNG shown instead of the library icon when set. */
  iconImage?: string;
  label: string;
  textColor?: string;
};

export type LifestyleCard = {
  icon: string;
  iconColor?: string;
  title: string;
  subtitle: string;
  textColor?: string;
  titleColor?: string;
  subtitleColor?: string;
};

export type PropertyTab = {
  id: string;
  label: string;
};

export type Property = {
  id: string;
  tab: string;
  title: string;
  subtitle: string;
  area: string;
  price: string;
  priceNote: string;
  cta: Cta;
  floorPlanId: string;
  titleColor?: string;
  subtitleColor?: string;
  areaColor?: string;
  priceColor?: string;
  priceNoteColor?: string;
  titleFontSize?: number;
  titleFontWeight?: number;
  titleFontFamily?: string;
  titleLineHeight?: number;
  subtitleFontSize?: number;
  subtitleFontWeight?: number;
  subtitleFontFamily?: string;
  subtitleLineHeight?: number;
  areaFontSize?: number;
  areaFontWeight?: number;
  areaFontFamily?: string;
  areaLineHeight?: number;
  priceFontSize?: number;
  priceFontWeight?: number;
  priceFontFamily?: string;
  priceLineHeight?: number;
  priceNoteFontSize?: number;
  priceNoteFontWeight?: number;
  priceNoteFontFamily?: string;
  priceNoteLineHeight?: number;
};

export type FloorPlan = {
  id: string;
  propertyId: string;
  label: string;
  area: string;
  image: string;
  alt: string;
  downloadUrl: string;
  labelColor?: string;
  areaColor?: string;
  labelFontSize?: number;
  labelFontWeight?: number;
  labelFontFamily?: string;
  labelLineHeight?: number;
  areaFontSize?: number;
  areaFontWeight?: number;
  areaFontFamily?: string;
  areaLineHeight?: number;
};

export type GalleryImage = {
  src: string;
  alt: string;
  size: "large" | "medium" | "portrait";
};

export type ConnectivityItem = {
  label: string;
  items: Array<{ label: string; time: string }>;
};

export type NearbyPlace = {
  icon: string;
  iconColor?: string;
  label: string;
  textColor?: string;
};

/** Per-landing-page Google Analytics settings (stored in site JSONB). */
export type GoogleAnalytics = {
  enabled: boolean;
  /** GA4 Measurement ID, e.g. G-XXXXXXXX */
  measurementId: string;
  /** @deprecated Legacy field retained so existing database content can be migrated. */
  gtmContainerId?: string;
};

/** Per-landing-page Google Tag Manager settings (stored in site JSONB). */
export type GoogleTagManager = {
  enabled: boolean;
  /** Web container ID, e.g. GTM-XXXXXXX */
  containerId: string;
};

/** Per-landing-page Buildesk CRM lead forwarding (stored in site JSONB; ApiKey is admin/server only). */
export type BuildeskCrm = {
  enabled: boolean;
  /** Buildesk API key — never render on the public site. */
  apiKey: string;
  /** Optional endpoint override; empty uses the default Buildesk create-lead URL. */
  endpoint?: string;
  projectName: string;
  projectUID?: string;
  source: string;
  /** Optional prefix; each lead SubSource is `prefix · form name` (or form name alone). */
  subSource: string;
  city?: string;
  /** Country dial code, e.g. 91 for India. */
  dialCode?: number;
  /** Fallback remark when the form has no message. */
  remark?: string;
};

export type SocialLink = {
  label: string;
  icon: string;
  url: string;
};

export type FooterLink = {
  label: string;
  target: string;
};

export type BlogPost = {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  slug: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type FaqSection = {
  enabled: boolean;
  label: string;
  heading: string;
  image: string;
  imageAlt: string;
  backgroundColor: string;
  /** Open the first item on load, or start with every item collapsed. */
  defaultOpen?: "first" | "collapsed";
  /**
   * Vertical space between FAQ cards in px. Use a negative value (e.g. -8)
   * to pull cards closer and reduce extra gap.
   */
  itemSpacing?: number;
  /** Minimum height of the question row in px (button background). */
  questionMinHeight?: number;
  /** Vertical padding inside the question row in px. */
  questionPaddingY?: number;
  /** Vertical padding inside the answer panel in px. */
  answerPaddingY?: number;
  items: FaqItem[];
};

export type ContactSectionLayout = "imageLeft" | "imageRight";

export type ContactSectionFields = {
  name?: EnquiryFormField;
  phone?: EnquiryFormField;
  email?: EnquiryFormField;
  message?: EnquiryFormField;
  custom?: EnquiryCustomField[];
};

export type ContactSection = {
  enabled: boolean;
  label: string;
  heading: string;
  headingAccent?: string;
  description?: string;
  image: string;
  imageAlt?: string;
  layout?: ContactSectionLayout;
  submitLabel?: string;
  successMessage?: string;
  footerText?: string;
  /** Optional GTM / dataLayer override so this page form stays uniquely trackable. */
  gtmId?: string;
  fields?: ContactSectionFields;
  backgroundColor?: string;
  formBackgroundColor?: string;
  formTextColor?: string;
  inputBackgroundColor?: string;
  inputBorderColor?: string;
  inputTextColor?: string;
  fieldLabelColor?: string;
  /** Minimum height of the contact form card in pixels. Omit for content-sized height. */
  formMinHeight?: number;
  buttonBackgroundType?: "plain" | "gradient";
  buttonBackgroundColor?: string;
  buttonBackgroundGradient?: string;
  buttonTextColor?: string;
  labelColor?: string;
  headingColor?: string;
  headingAccentColor?: string;
  descriptionColor?: string;
  labelFontSize?: number;
  labelFontWeight?: number;
  labelFontFamily?: string;
  headingFontSize?: number;
  headingFontWeight?: number;
  headingFontFamily?: string;
  headingAccentFontSize?: number;
  headingAccentFontWeight?: number;
  headingAccentFontFamily?: string;
  descriptionFontSize?: number;
  descriptionFontWeight?: number;
  descriptionFontFamily?: string;
};

export type PlanCard = {
  enabled: boolean;
  image: string;
  imageAlt: string;
  textEnabled: boolean;
  title: string;
  description?: string;
  buttonEnabled: boolean;
  button: Cta;
  overlayColor: string;
  buttonColor: string;
  buttonTextColor: string;
  isLocked?: boolean;
  blurAmount?: number;
};

export type PlansSection = {
  enabled: boolean;
  label: string;
  heading: string;
  description?: string;
  backgroundColor: string;
  textColor: string;
  isLocked?: boolean;
  blurAmount?: number;
  cards: PlanCard[];
};

export type VirtualTourSection = {
  enabled: boolean;
  label?: string;
  containerWidth?: number;
  playIconEnabled?: boolean;
  playButtonEnabled?: boolean;
  heading: string;
  backgroundImage?: string;
  backgroundImageAlt?: string;
  backgroundPosition?: string;
  videoUrl: string;
  overlayColor: string;
  overlayOpacity: number;
  blurAmount: number;
  sectionHeight?: number;
  minHeight?: number;
  textColor: string;
  playIconColor?: string;
  playButtonColor?: string;
  playButtonBorderColor?: string;
  /** Lead form variant id opened by the play button */
  enquireIntent?: string;
};

export type LandingSectionKey =
  | "hero"
  | "about"
  | "highlights"
  | "amenities"
  | "homes"
  | "gallery"
  | "location"
  | "virtualTourSection"
  | "plansSection"
  | "faqSection"
  | "contactSection";

export type SectionLayoutSetting = {
  enabled: boolean;
  anchor: string;
  paddingTop: number;
  paddingBottom: number;
  marginTop: number;
  marginBottom: number;
  backgroundColor?: string;
  textColor?: string;
};

export type CustomButtonGradient = {
  id: string;
  label: string;
  description?: string;
  css: string;
  angle?: number;
  color1?: string;
  color2?: string;
  color3?: string;
};

export type KeywordMatchType = "exact" | "contains";

/** Blank fields keep the default Hero copy. */
export type KeywordHeroOverride = {
  eyebrow?: string;
  heading?: string;
  headingAccent?: string;
  description?: string;
  primaryCtaLabel?: string;
  secondaryCtaLabel?: string;
};

/** Blank fields keep the default Hero card copy. An empty benefits list keeps the default list. */
export type KeywordBookingCardOverride = {
  offerTitle?: string;
  title?: string;
  description?: string;
  benefitsTitle?: string;
  benefits?: string[];
  propertyText?: string;
  pricePrefix?: string;
  price?: string;
  priceSuffix?: string;
  buttonLabel?: string;
};

/** Blank fields keep the default About copy. `description` is rich HTML. */
export type KeywordAboutOverride = {
  label?: string;
  heading?: string;
  headingAccent?: string;
  description?: string;
};

export type KeywordRule = {
  id: string;
  enabled: boolean;
  name: string;
  /** Google Ads keywords compared with the visitor's `utm_term`. */
  tags: string[];
  match: KeywordMatchType;
  hero?: KeywordHeroOverride;
  bookingCard?: KeywordBookingCardOverride;
  about?: KeywordAboutOverride;
};

export type KeywordContent = {
  enabled?: boolean;
  /** Order is priority: the first enabled matching rule wins. */
  rules: KeywordRule[];
};

export type SiteData = {
  sectionOrder?: LandingSectionKey[];
  sectionSettings?: Partial<Record<LandingSectionKey, SectionLayoutSetting>>;
  /** Saved custom button gradients (shared across all button editors). */
  customButtonGradients?: CustomButtonGradient[];
  site: SiteInfo;
  theme: Theme;
  offerBar: {
    enabled: boolean;
    text: string;
    backgroundColor: string;
    textColor: string;
    /** Close icon color. Defaults to white. */
    closeIconColor?: string;
    /** When false, the close control is icon-only with no fill. Defaults to on. */
    closeBackgroundEnabled?: boolean;
    /** Close button fill. Defaults to the bar background. */
    closeBackgroundColor?: string;
  };
  header: {
    backgroundColor: string;
    /**
     * Desktop bar: transparent until scroll, then backgroundColor.
     * "solid" keeps backgroundColor at the top and after scroll.
     */
    backgroundStyle?: "scroll" | "solid";
    /** Desktop nav link color (defaults to white). */
    navTextColor?: string;
    /** Mobile menu / header bar background (defaults to backgroundColor). */
    mobileBackgroundColor?: string;
    /**
     * Mobile bar: "solid" keeps the color at the top and after scroll.
     * "scroll" is transparent until scroll or the menu opens.
     */
    mobileBackgroundStyle?: "scroll" | "solid";
    /** Mobile menu link color (defaults to white). */
    mobileNavTextColor?: string;
    /** Mobile hamburger / close icon color (defaults to white). */
    mobileIconColor?: string;
    /** Optional mobile overrides for Button 1 (brochure). Falls back to brochureButton colors. */
    mobileBrochureBackgroundType?: "plain" | "gradient";
    mobileBrochureBackgroundColor?: string;
    mobileBrochureBackgroundGradient?: string;
    mobileBrochureTextColor?: string;
    /** Optional mobile overrides for Button 2 (phone). Falls back to phoneButton colors. */
    mobilePhoneBackgroundType?: "plain" | "gradient";
    mobilePhoneBackgroundColor?: string;
    mobilePhoneBackgroundGradient?: string;
    mobilePhoneTextColor?: string;
    brochureButton: HeaderButton;
    phoneButton?: HeaderButton;
    phoneButtonColor: string;
    /** Extra desktop header height in px. Negative values shrink the bar. */
    heightOffset?: number;
    /** Extra mobile header height in px. Negative values shrink the bar. */
    mobileHeightOffset?: number;
  };
  navigation: {
    items: NavItem[];
  };
  hero: {
    factsEnabled?: boolean;
    eyebrow: string;
    heading: string;
    headingAccent: string;
    description: string;
    /** Hero media type. Defaults to plain image when unset. */
    backgroundMode?: "image" | "video" | "carousel";
    backgroundImage: string;
    backgroundAlt: string;
    /** YouTube URL or direct .mp4 / .webm path for video mode. */
    backgroundVideoUrl?: string;
    backgroundVideoPoster?: string;
    backgroundVideoAutoplay?: boolean;
    backgroundVideoMuted?: boolean;
    backgroundVideoLoop?: boolean;
    /** Extra dark overlay on top of video (0–1). Ignored once Media overlay is customized. */
    backgroundVideoOverlayOpacity?: number;
    /** When false, hide the hero media overlay. Defaults to on. */
    overlayEnabled?: boolean;
    /** How the hero overlay is painted. Applies to image, video, and carousel. */
    overlayStyle?: "solid" | "left" | "vertical" | "both";
    /** Overlay tint. Defaults to deep navy. */
    overlayColor?: string;
    /** Overlay strength from 0 to 1. Defaults to 1. */
    overlayOpacity?: number;
    backgroundCarouselImages?: Array<{ src: string; alt?: string }>;
    /** Slide interval in milliseconds (carousel). */
    backgroundCarouselIntervalMs?: number;
    backgroundCarouselTransition?: "fade" | "slide";
    backgroundCarouselShowDots?: boolean;
    backgroundCarouselPauseOnHover?: boolean;
    primaryCTA: Cta;
    secondaryCTA: Cta;
    primaryCTAEnabled: boolean;
    secondaryCTAEnabled: boolean;
    eyebrowColor: string;
    headingColor: string;
    headingAccentColor: string;
    descriptionColor: string;
    /**
     * Mobile-only hero layout: landscape image band on top, offer card slid down.
     * Desktop layout is unchanged.
     */
    mobileLayout?: {
      /** When true (default), show a landscape image strip above the offer card on mobile. */
      imageFirstEnabled?: boolean;
      /** Mobile band media: image, video, or carousel (independent of desktop hero). */
      backgroundMode?: "image" | "video" | "carousel";
      /** Dedicated landscape image for mobile (falls back to backgroundImage). */
      image?: string;
      imageAlt?: string;
      backgroundVideoUrl?: string;
      backgroundVideoPoster?: string;
      backgroundVideoAutoplay?: boolean;
      backgroundVideoMuted?: boolean;
      backgroundVideoLoop?: boolean;
      backgroundVideoOverlayOpacity?: number;
      backgroundCarouselImages?: Array<{ src: string; alt?: string }>;
      backgroundCarouselIntervalMs?: number;
      backgroundCarouselTransition?: "fade" | "slide";
      backgroundCarouselShowDots?: boolean;
      backgroundCarouselPauseOnHover?: boolean;
      /** Visible height of the landscape band in px (120–480). Defaults to 240. */
      imageHeight?: number;
      /** Extra px below the sticky header before the media band (added to header offset). */
      headerGap?: number;
      /** Extra space below the media before the offer card (px). Defaults to 12. */
      cardOffset?: number;
      /** Gap between offer card and mobile lead form (px). */
      formGap?: number;
      /** CSS object-position for the landscape crop, e.g. "center 40%". */
      imageObjectPosition?: string;
      /** Dark overlay on the landscape band (0–1). Defaults to 0.18. */
      overlayOpacity?: number;
      /** Background behind the offer card + mobile form (below the image). */
      contentBackgroundColor?: string;
    };
    /** Background color for the 4 fact cards strip on mobile only. */
    factsBackgroundColorMobile?: string;
    /** Full-bleed section background behind the fact cards on mobile only. */
    factsSectionBackgroundColorMobile?: string;
    /** Extra top margin for fact cards on mobile (px). */
    factsMarginTopMobile?: number;
    /** Fact strip border color on mobile. */
    factsBorderColorMobile?: string;
    /** Fact strip border width on mobile (px). */
    factsBorderWidthMobile?: number;
    /** Horizontal margin for fact strip on mobile (px). */
    factsMarginXMobile?: number;
    /** Compact Name + Phone lead form shown only on mobile, below the offer card. */
    mobileLeadForm?: {
      enabled?: boolean;
      /** Optional GTM key override (unique across forms). */
      gtmId?: string;
      title?: string;
      submitLabel?: string;
      successMessage?: string;
      footerText?: string;
      formMinHeight?: number;
      formBackgroundColor?: string;
      formTextColor?: string;
      fieldLabelColor?: string;
      inputBackgroundColor?: string;
      inputBorderColor?: string;
      inputTextColor?: string;
      buttonBackgroundType?: "plain" | "gradient";
      buttonBackgroundColor?: string;
      buttonBackgroundGradient?: string;
      buttonTextColor?: string;
      /** Card border color on mobile. */
      borderColor?: string;
      /** Card border width on mobile (px). */
      borderWidth?: number;
      /** Horizontal margin on mobile (px). */
      marginX?: number;
      fields?: {
        name?: Partial<EnquiryFormField>;
        phone?: Partial<EnquiryFormField>;
      };
    };
  };
  bookingCard: {
    enabled: boolean;
    offerTitle: string;
    title: string;
    description: string;
    ratingSource: string;
    ratingStars: number;
    ratingLabel: string;
    landLabel: string;
    landValue: string;
    floorsLabel: string;
    floorsValue: string;
    totalUnitsLabel?: string;
    totalUnitsValue?: string;
    configurationsLabel?: string;
    configurationsValue?: string;
    possessionLabel?: string;
    possessionValue?: string;
    specs?: Array<{ label: string; value: string }>;
    benefitsTitle?: string;
    benefits: string[];
    propertyText: string;
    pricePrefix: string;
    price: string;
    priceSuffix: string;
    button: Cta;
    headerColor: string;
    backgroundColor: string;
    textColor: string;
    benefitsStartColor: string;
    benefitsEndColor: string;
    /** Offer title badge fill (defaults to classic gold when unset). */
    offerTitleBackgroundType?: "plain" | "gradient";
    offerTitleBackgroundColor?: string;
    offerTitleBackgroundGradient?: string;
    headerBackgroundType?: "plain" | "gradient";
    headerBackgroundGradient?: string;
    backgroundType?: "plain" | "gradient";
    backgroundGradient?: string;
    benefitsBackgroundType?: "plain" | "gradient";
    benefitsBackgroundColor?: string;
    benefitsBackgroundGradient?: string;
    specsBackgroundColor?: string;
    /** Offer card border color on mobile. */
    borderColorMobile?: string;
    /** Offer card border width on mobile (px). */
    borderWidthMobile?: number;
    /** Horizontal margin for offer card on mobile (px). */
    marginXMobile?: number;
  };
  heroFacts: HeroFact[];
  about: {
    label: string;
    heading: string;
    headingAccent: string;
    description: string;
    descriptionWordLimit?: number;
    cta: Cta;
    features: Feature[];
  };
  highlights: {
    items: Highlight[];
    cta: Cta;
  };
  amenities: {
    label: string;
    heading: string;
    headingAccent: string;
    items: AmenityItem[];
    image: string;
    imageAlt: string;
    lifestyleCards: LifestyleCard[];
    lifestyleCardsEnabled?: boolean;
    visitCtaEnabled?: boolean;
    cta: Cta;
    visitCta: Cta;
  };
  homes: {
    label: string;
    heading: string;
    tabs: PropertyTab[];
    /** When true, hide the category tabs on the landing page. */
    hideCategoryTabs?: boolean;
    properties: Property[];
    floorPlans: FloorPlan[];
    floorPlanLocked?: boolean;
    floorPlanBlur?: number;
    expandSingleFloorPlan?: boolean;
    floorPlanImageSize?: "compact" | "standard" | "large";
    /** When false, hide the floor-plan panel and center pricing cards. Defaults to true. */
    floorPlanPanelEnabled?: boolean;
    /** Card grid, or a pricing table with a side image. Defaults to grid. */
    layout?: "grid" | "list";
    /** Column heading for the home name in list view. */
    listTypeLabel?: string;
    /** Column heading for the area in list view. */
    listAreaLabel?: string;
    /** Column heading for the price in list view. */
    listPriceLabel?: string;
    /** Image shown beside the pricing table. */
    listImage?: string;
    listImageAlt?: string;
    /** Button under the list image, such as Download Costing Details. */
    listCta?: Cta;
    /** Category tab outline color. */
    tabBorderColor?: string;
    /** Category tab outline width in px. */
    tabBorderWidth?: number;
    /** Selected category tab background. */
    tabActiveColor?: string;
    /** Selected category tab label color. */
    tabActiveTextColor?: string;
    /** Pricing card background. */
    cardBackgroundColor?: string;
    /** When false, pricing cards have no border. Defaults to true. */
    cardBorderEnabled?: boolean;
    /** Pricing card border color. */
    cardBorderColor?: string;
    /** Pricing card border width in px. */
    cardBorderWidth?: number;
    downloadCta: Cta;
    visitCta: Cta;
  };
  gallery: {
    label: string;
    heading: string;
    images: GalleryImage[];
    columnsPerRow?: number;
    carouselEnabled?: boolean;
    scrollTiming?: number;
    cta: {
      line1: string;
      line2: string;
      line3: string;
      label: string;
      action: CtaAction;
      target?: string;
      intent?: string;
      href?: string;
      backgroundType?: "plain" | "gradient";
      backgroundColor?: string;
      backgroundGradient?: string;
      textColor?: string;
    };
  };
  location: {
    label?: string;
    titleAlign?: "left" | "center" | "right";
    heading: string;
    headingAccent: string;
    mapEmbedUrl: string;
    mapTitle: string;
    masterPlanImage: string;
    masterPlanAlt: string;
    masterPlanLocked?: boolean;
    masterPlanBlur?: number;
    columnOrder?: Array<"connectivity" | "map" | "masterPlan">;
    /** Hide a location column when set to false. Missing keys stay visible. */
    columnsEnabled?: {
      connectivity?: boolean;
      map?: boolean;
      masterPlan?: boolean;
    };
    connectivity: ConnectivityItem[];
    nearbyHeading: string;
    nearbyPlaces: NearbyPlace[];
    mapCta: Cta;
    nearbyCta: Cta;
    connectivityBackgroundColor?: string;
    connectivityIconColor?: string;
  };
  enquiry: {
    heading: string;
    description: string;
    nameLabel: string;
    phoneLabel: string;
    submitLabel: string;
    successMessage: string;
    intents?: EnquiryIntent[];
  };
  stickyCTA: {
    enabled: boolean;
    message: string;
    enquireLabel: string;
    whatsappLabel: string;
    /** Lead form variant id opened by the sticky Enquire button */
    enquireIntent?: string;
    enquireButtonBackgroundType?: "plain" | "gradient";
    enquireButtonColor?: string;
    enquireButtonGradient?: string;
    enquireButtonTextColor?: string;
    whatsappButtonBackgroundType?: "plain" | "gradient";
    whatsappButtonColor?: string;
    whatsappButtonGradient?: string;
    whatsappButtonTextColor?: string;
  };
  floatingButton?: FloatingButton;
  footer: {
    logo: string;
    managedBy: string;
    reraTitle: string;
    reraPhases: string[];
    disclaimerTitle: string;
    disclaimerParagraphs: string[];
    copyrightText: string;
    /** Rich free-text block (same editor as About description) */
    description?: string;
    descriptionWordLimit?: number;
  };
  blogs: BlogPost[];
  virtualTourSection?: VirtualTourSection;
  plansSection?: PlansSection;
  faqSection?: FaqSection;
  contactSection?: ContactSection;
  faqs: FaqItem[];
  googleAnalytics?: GoogleAnalytics;
  googleTagManager?: GoogleTagManager;
  buildeskCrm?: BuildeskCrm;
  /** Swap Hero / Hero card / About copy based on the Google Ads `utm_term`. */
  keywordContent?: KeywordContent;
  seo: {
    title: string;
    description: string;
    keywords: string[];
    canonical: string;
    ogImage: string;
    robots: string;
  };
};
