import {
  Inter,
  Lora,
  Merriweather,
  Source_Serif_4,
  IBM_Plex_Sans,
  IBM_Plex_Serif,
} from "next/font/google";

export const editorFonts = {
  Inter: Inter({
    subsets: ["latin"],
    display: "swap",
  }),
  Lora: Lora({
    subsets: ["latin"],
    display: "swap",
  }),
  Merriweather: Merriweather({
    subsets: ["latin"],
    weight: ["400", "700"],
    display: "swap",
  }),
  "Source Serif 4": Source_Serif_4({
    subsets: ["latin"],
    display: "swap",
  }),
  "IBM Plex Sans": IBM_Plex_Sans({
    subsets: ["latin"],
    weight: ["400", "700"],
    display: "swap",
  }),
  "IBM Plex Serif": IBM_Plex_Serif({
    subsets: ["latin"],
    weight: ["400", "700"],
    display: "swap",
  }),
} as const;

export type EditorFontName = keyof typeof editorFonts;
export const editorFontNames = Object.keys(editorFonts) as EditorFontName[];