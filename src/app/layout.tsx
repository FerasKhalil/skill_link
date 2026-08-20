import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/layout/providers";

export const metadata: Metadata = {
  title: "SkillLink - Find Trusted Service Providers in Jordan",
  description: "SkillLink is a Jordanian marketplace connecting customers with trusted local service providers for tutoring, skilled labour, and instrument services.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
