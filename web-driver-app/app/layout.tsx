import type { Metadata } from "next";
import { headers } from "next/headers";
import { DEFAULT_MOUSE_MODEL } from "../lib/mouse-models/registry";
import "./globals.css";

const PUBLIC_SITE_URL = "https://z750sasr.github.io/mchose-a5-pro-max-web-driver/";
const PUBLIC_IMAGE_URL = `${PUBLIC_SITE_URL}og-epomaker.png`;

const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "MCHOSE A5 Pro Max Web Driver",
  alternateName: ["A5 Control", "MCHOSE A5 Driver"],
  url: PUBLIC_SITE_URL,
  description: "Free browser-based configuration driver for the first-generation MCHOSE A5 Pro Max gaming mouse.",
  applicationCategory: "DriverApplication",
  operatingSystem: "Windows, macOS, Linux, ChromeOS",
  softwareRequirements: "Google Chrome or Microsoft Edge with WebHID support",
  isAccessibleForFree: true,
  image: PUBLIC_IMAGE_URL,
  offers: { "@type": "Offer", price: 0, priceCurrency: "USD" },
  author: { "@type": "Person", name: "z750sasr", url: "https://github.com/z750sasr" },
};

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const base = new URL(`${protocol}://${host}`);
  const model = DEFAULT_MOUSE_MODEL;
  const appName = `${model.shortName} Control`;
  const title = `${model.name} Driver — Free WebHID Mouse Software`;
  const description = `Free browser driver for the ${model.generation} ${model.name}. Configure DPI, polling rate, buttons, profiles, battery and sensor settings with WebHID.`;

  return {
    metadataBase: base,
    title,
    description,
    applicationName: appName,
    authors: [{ name: "z750sasr", url: "https://github.com/z750sasr" }],
    creator: "z750sasr",
    category: "technology",
    keywords: ["MCHOSE A5 driver", "MCHOSE A5 Pro Max driver", "MCHOSE mouse software", "A5 Control", "WebHID mouse driver"],
    alternates: { canonical: PUBLIC_SITE_URL },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
    },
    icons: { icon: `/${model.artwork.src}`, shortcut: `/${model.artwork.src}` },
    openGraph: {
      type: "website",
      title,
      description,
      siteName: appName,
      url: PUBLIC_SITE_URL,
      images: [{ url: PUBLIC_IMAGE_URL, width: 1200, height: 630, alt: `${appName} WebHID driver for ${model.name}` }],
    },
    twitter: { card: "summary_large_image", title, description, images: [PUBLIC_IMAGE_URL] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }} /></head>
      <body>{children}</body>
    </html>
  );
}
