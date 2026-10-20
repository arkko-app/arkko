"use client";

import { createContext, useContext } from "react";
import type { ResultImage, ResultsPayload, SectionId } from "@/lib/types";

export interface ShowcaseData {
  /** Present on a real request's page; absent in previews. */
  access?: { token: string; email?: string; emailSent: boolean };
  payload: ResultsPayload; // asset: refs already resolved to URLs
  briefImages: ResultImage[];
  version: number;
  updatedAt: string;
}

export interface ShowcaseCtx {
  data: ShowcaseData;
  sections: SectionId[];
  presenting: boolean;
  goTo: (id: SectionId, anchor?: string) => void;
  sourceNumber: (id: string) => number | undefined;
}

export const Ctx = createContext<ShowcaseCtx | null>(null);

export function useShowcase() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useShowcase outside Showcase");
  return c;
}
