import type { Metadata } from "next";
import { headers } from "next/headers";
import { DEFAULT_MOUSE_MODEL } from "../lib/mouse-models/registry";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const base = new URL(`${protocol}://${host}`);
  const model = DEFAULT_MOUSE_MODEL;
  const appName = `${model.shortName} Control`;
  const title = `${appName} — ${model.name} WebHID Driver`;
  const description = `Configure the ${model.generation} ${model.name} directly in Chrome or Edge: DPI, polling, sensor settings, profiles, buttons, battery, and firmware.`;
  const image = new URL("/og-epomaker.png", base).toString();

  return {
    metadataBase: base,
    title,
    description,
    applicationName: appName,
    icons: { icon: `/${model.artwork.src}`, shortcut: `/${model.artwork.src}` },
    openGraph: {
      type: "website",
      title,
      description,
      siteName: appName,
      images: [{ url: image, width: 1200, height: 630, alt: `${appName} WebHID driver for ${model.name}` }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
