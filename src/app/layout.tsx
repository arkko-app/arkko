import type { Metadata } from "next";
import { Anton, Fraunces, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const display = Fraunces({ variable: "--font-fraunces", subsets: ["latin"] });
const headline = Anton({ variable: "--font-anton", subsets: ["latin"], weight: "400" });
const sans = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"] });
const mono = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Arkko — Which ideas deserve your next investment?",
  description:
    "Arkko helps food and beverage teams turn early ideas into clear propositions, research their potential, and evaluate the evidence.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${headline.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
