import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const base = new URL(`${protocol}://${host}`);
  const title = "A5 Control — MCHOSE A5 Pro Max WebHID Driver";
  const description = "Configure the first-generation MCHOSE A5 Pro Max directly in Chrome or Edge: DPI, polling, sensor settings, profiles, buttons, battery, and firmware.";
  const image = new URL("/og-epomaker.png", base).toString();

  return {
    metadataBase: base,
    title,
    description,
    applicationName: "A5 Control",
    icons: { icon: "/a5-mouse.png", shortcut: "/a5-mouse.png" },
    openGraph: {
      type: "website",
      title,
      description,
      siteName: "A5 Control",
      images: [{ url: image, width: 1200, height: 630, alt: "A5 Control WebHID driver for the first-generation MCHOSE A5 Pro Max" }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
