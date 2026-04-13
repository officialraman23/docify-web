"use client";

import { createContext, useContext, useState } from "react";

export type EditorFont = "serif" | "sans" | "mono";

type FormattingContextType = {
  font: EditorFont;
  setFont: (value: EditorFont) => void;
  fontSize: number;
  increaseFont: () => void;
  decreaseFont: () => void;
};

const FormattingContext = createContext<FormattingContextType | null>(null);

export function FormattingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [font, setFont] = useState<EditorFont>("serif");
  const [fontSize, setFontSize] = useState(16);

  const increaseFont = () => {
    setFontSize((prev) => Math.min(prev + 1, 32));
  };

  const decreaseFont = () => {
    setFontSize((prev) => Math.max(prev - 1, 10));
  };

  return (
    <FormattingContext.Provider
      value={{
        font,
        setFont,
        fontSize,
        increaseFont,
        decreaseFont,
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