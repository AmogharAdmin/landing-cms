import { execSync } from "node:child_process";
import { writeFileSync, unlinkSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function readGitJson(revision) {
  return JSON.parse(execSync(`git show ${revision}:data/site.json`, { encoding: "utf8", cwd: root }));
}

const base = readGitJson("b31984d");
const nambiar = readGitJson("8b2499e");

base.site = { ...nambiar.site, dashboardLogo: "" };
base.seo = {
  ...nambiar.seo,
  keywords: [
    "Nambiar District 25",
    "Nambiar District 25 Sarjapur",
    "luxury township Bangalore",
    "apartments Sarjapur Road",
    "Nambiar Group",
    "2 BHK 3 BHK East Bangalore",
  ],
};

base.hero = {
  ...nambiar.hero,
  factsEnabled: true,
  secondaryCTA: {
    label: "Explore Project",
    action: "scroll",
    target: "#about",
  },
};

base.about = {
  label: "ABOUT NAMBIAR DISTRICT 25",
  heading: "Township Designed for Better Living.",
  headingAccent: "Beautifully Crafted.",
  description:
    "Nambiar District 25 is a thoughtfully planned integrated township near Sarjapur Road, Bengaluru, offering spacious 2, 3, 4 and 4.5 BHK residences surrounded by expansive green spaces, lifestyle amenities and open areas designed for comfortable modern living.",
  cta: {
    label: "Know More About Us",
    action: "enquire",
    intent: "",
  },
  features: [
    {
      enabled: true,
      icon: "trees",
      title: "Nature Inspired Living",
      description: "Open greens, water features and landscaped walks woven into everyday life.",
      cta: { label: "Explore More", action: "enquire", intent: "" },
    },
    {
      enabled: true,
      icon: "sparkles",
      title: "World Class Amenities",
      description: "A resort-style clubhouse and lifestyle spaces designed for every age.",
      cta: { label: "Explore More", action: "enquire", intent: "" },
    },
    {
      enabled: true,
      icon: "shield",
      title: "Trusted Developer",
      description: "Crafted by Nambiar Group with a focus on quality, planning and lasting value.",
      cta: { label: "Explore More", action: "enquire", intent: "" },
    },
    {
      enabled: true,
      icon: "route",
      title: "Seamless Connectivity",
      description: "Effortless access to business hubs, schools, hospitals and essential city nodes.",
      cta: { label: "Explore More", action: "enquire", intent: "" },
    },
  ],
};

base.heroFacts = [
  { icon: "building", value: "210+", label: "Acres Township" },
  { icon: "home", value: "2, 3, 4 BHK", label: "& Penthouses" },
  { icon: "layers", value: "G + 21", label: "Floors" },
  { icon: "landmark", value: "East Bangalore", label: "By Nambiar Group" },
];

const enquiryHighlights = [
  { icon: "building", value: "210+", label: "Acres Township" },
  { icon: "layers", value: "2, 3, 4 BHK", label: "& Penthouses" },
  { icon: "building", value: "G + 21", label: "Floors" },
  { icon: "map-pin", value: "East Bangalore", label: "By Nambiar Group" },
];

base.enquiry = {
  ...base.enquiry,
  heading: "Enquire About Nambiar District 25",
  intents: base.enquiry.intents.map((intent) => ({
    ...intent,
    highlights: enquiryHighlights,
    backgroundImage: "/images/image-1.webp",
  })),
};

base.homes.tabs = base.homes.tabs.filter((tab) => !String(tab.id).includes("178765"));
base.homes.properties = base.homes.properties.filter((item) => !String(item.id).includes("178765"));
base.homes.floorPlans = base.homes.floorPlans.filter((item) => !String(item.id).includes("178765"));
base.homes.floorPlanLocked = false;
base.homes.floorPlanBlur = 0;

base.gallery.images = [
  { src: "/images/image-1.webp", alt: "Nambiar District 25 residential towers exterior", size: "large" },
  { src: "/images/image-2.webp", alt: "Clubhouse swimming pool and landscaped deck", size: "portrait" },
  { src: "/images/image-3.webp", alt: "Premium living and dining interior", size: "medium" },
  { src: "/images/image-4.webp", alt: "Evening view of the pool and residential amenities", size: "medium" },
  { src: "/images/image-5.webp", alt: "Modern residence facade and landscaping", size: "portrait" },
];

base.amenities.image = "/images/image-2.webp";
base.amenities.imageAlt = "World-class swimming pool and landscaped deck at Nambiar District 25";

base.virtualTourSection = {
  ...base.virtualTourSection,
  heading: "Virtual Site Visit - Nambiar District 25",
  videoUrl: "https://www.youtube.com/watch?v=GeyurGuBVK0",
  enquireIntent: "",
};

base.faqSection = {
  ...base.faqSection,
  enabled: true,
};

base.sectionOrder = [
  "hero",
  "about",
  "highlights",
  "amenities",
  "homes",
  "gallery",
  "location",
  "virtualTourSection",
  "plansSection",
  "faqSection",
  "contactSection",
];

const defaultLayout = {
  enabled: true,
  paddingTop: 0,
  paddingBottom: 0,
  marginTop: 0,
  marginBottom: 0,
  backgroundColor: "",
  textColor: "",
};

base.sectionSettings = {
  hero: { ...defaultLayout, anchor: "overview" },
  about: { ...defaultLayout, anchor: "about" },
  highlights: { ...defaultLayout, anchor: "highlights" },
  amenities: { ...defaultLayout, anchor: "amenities" },
  homes: { ...defaultLayout, anchor: "homes" },
  gallery: { ...defaultLayout, anchor: "gallery" },
  location: { ...defaultLayout, anchor: "location" },
  virtualTourSection: { ...defaultLayout, anchor: "virtual-tour" },
  plansSection: { ...defaultLayout, anchor: "plans" },
  faqSection: { ...defaultLayout, anchor: "faqs" },
  contactSection: { ...defaultLayout, anchor: "contact" },
};

base.floatingButton = {
  enabled: true,
  label: "Enquire Now",
  icon: "file-text",
  intent: "default",
  backgroundColor: "#b98945",
  textColor: "#ffffff",
};

base.contactSection = {
  enabled: true,
  label: "Contact Us",
  heading: "Get in Touch",
  headingAccent: "With Our Team",
  description: "Have questions about Nambiar District 25? Share your details and our team will reach out shortly.",
  image: "/images/image-3.webp",
  imageAlt: "Nambiar District 25 contact",
  layout: "imageLeft",
  submitLabel: "Send Message",
  successMessage: "Thank you. Our team will contact you shortly.",
  footerText: "We respect your privacy. Your details are safe with us.",
  backgroundColor: "#f7f3ed",
  formBackgroundColor: "#ffffff",
  formTextColor: "#0b1f35",
  inputBackgroundColor: "#ffffff",
  inputBorderColor: "#d8dde6",
  inputTextColor: "#0b1f35",
  buttonBackgroundColor: "#b98945",
  buttonTextColor: "#ffffff",
  fields: {
    name: { enabled: true, required: true, label: "Full Name", placeholder: "Enter your full name" },
    phone: { enabled: true, required: true, label: "Phone Number", placeholder: "Enter your phone number" },
    email: { enabled: true, required: false, label: "Email Address", placeholder: "Enter your email address" },
    message: { enabled: true, required: true, label: "Message", placeholder: "How can we help you?" },
    custom: [],
  },
};

base.stickyCTA = {
  enabled: true,
  message: "Your Dream Home Awaits!",
  enquireLabel: "Enquire Now",
  whatsappLabel: "Chat on WhatsApp",
  enquireIntent: "",
};

writeFileSync(join(root, "data/site.json"), `${JSON.stringify(base, null, 2)}\n`, "utf8");

const tempFile = join(root, "data/_restore_base.json");
if (existsSync(tempFile)) unlinkSync(tempFile);

console.log("Restored data/site.json to first-deploy defaults.");
