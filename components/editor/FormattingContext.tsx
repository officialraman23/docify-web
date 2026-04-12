"use client";

import { createContext, useContext, useState } from "react";

export type FontFamily =
  | "Times New Roman"
  | "Arial"
  | "Calibri"
  | "Georgia"
  | "Helvetica"
  | "Garamond"
  | "Cambria"
  | "Verdana";

type FormattingContextType = {
  fontFamily: FontFamily;
  setFontFamily: (value: FontFamily) => void;
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
  const [fontFamily, setFontFamily] =
    useState<FontFamily>("Times New Roman");
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