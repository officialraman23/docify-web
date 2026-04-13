"use client";

import { createContext, useContext, useState } from "react";

export type EditorFontName = "serif" | "sans" | "monospace";

type FormattingContextType = {
  fontFamily: EditorFontName;
  setFontFamily: (value: EditorFontName) => void;
  fontSize: number;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
};

const FormattingContext = createContext<FormattingContextType | null>(null);

export function FormattingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [fontFamily, setFontFamily] = useState<EditorFontName>("serif");
  const [fontSize, setFontSize] = useState(16);

  const increaseFontSize = () => {
    setFontSize((prev) => Math.min(prev + 1, 32));
  };

  const decreaseFontSize = () => {
    setFontSize((prev) => Math.max(prev - 1, 10));
  };

  return (
    <FormattingContext.Provider
      value={{
        fontFamily,
        setFontFamily,
        fontSize,
        increaseFontSize,
        decreaseFontSize,
      }}
    >
      {children}
    </FormattingContext.Provider>
  );
}

export function useFormatting() {
  const context = useContext(FormattingContext);

  if (!context) {
    throw new Error("useFormatting must be used inside FormattingProvider");
  }

  return context;
}