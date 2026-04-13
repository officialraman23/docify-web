import {
  Inter,
  Lora,
  Merriweather,
  Source_Serif_4,
  IBM_Plex_Sans,
  IBM_Plex_Serif,
} from "next/font/google";

const interFont = Inter({
  subsets: ["latin"],
  display: "swap",
});

const loraFont = Lora({
  subsets: ["latin"],
  display: "swap",
});

const merriweatherFont = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const sourceSerif4Font = Source_Serif_4({
  subsets: ["latin"],
  display: "swap",
});

const ibmPlexSansFont = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const ibmPlexSerifFont = IBM_Plex_Serif({
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const editorFonts = {
  Inter: interFont,
  Lora: loraFont,
  Merriweather: merriweatherFont,
  "Source Serif 4": sourceSerif4Font,
  "IBM Plex Sans": ibmPlexSansFont,
  "IBM Plex Serif": ibmPlexSerifFont,
} as const;

export type EditorFontName = keyof typeof editorFonts;
export const editorFontNames = Object.keys(editorFonts) as EditorFontName[];