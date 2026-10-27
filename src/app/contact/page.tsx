import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/content/site";
import { ButtonLink, Logo } from "@/components/ui";
import { ContactForm } from "@/components/site/ContactForm";

export const metadata: Metadata = { title: "Talk to arkko" };

const h = site.home;

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-pistachio">
      <header className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-6">
        <Logo tagline={false} />
        <ButtonLink href="/start" variant="secondary">
          {h.demo}
        </ButtonLink>
      </header>
      <main className="mx-auto grid max-w-[1200px] grid-cols-1 gap-10 px-4 pt-6 pb-24 sm:px-6 md:grid-cols-[minmax(0,1fr)_minmax(0,560px)] md:pt-12">
        <div className="flex flex-col gap-5">
          <p className="eyebrow">{h.contact.eyebrow}</p>
          <h1 className="font-serif text-[clamp(40px,5vw,66px)] font-black leading-[0.98] tracking-[-0.03em] text-balance">{h.contact.title}</h1>
          <p className="max-w-[480px] text-[18px]">{h.contact.body}</p>
          <Link href="/start" className="text-[16px] font-bold underline underline-offset-4">
            {h.contact.demoLink} →
          </Link>
        </div>
        <ContactForm />
      </main>
    </div>
  );
}
