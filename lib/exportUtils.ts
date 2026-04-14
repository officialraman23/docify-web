import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";

type ExportArgs = {
  fileName: string;
  content: string;
};

function cleanLines(content: string) {
  return content
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\u00A0/g, ""))
    .map((line) => line.replace(/\s+$/g, ""))
    .filter((line, index, arr) => {
      if (line.trim().length > 0) return true;
      return index !== 0 && index !== arr.length - 1;
    });
}

export async function exportTextToPdf({
  fileName,
  content,
}: ExportArgs) {
  const pdf = new jsPDF({
    unit: "pt",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const marginX = 56;
  const marginTop = 60;
  const marginBottom = 60;
  const lineHeight = 24;
  const maxWidth = pageWidth - marginX * 2;

  let y = marginTop;

  pdf.setFont("times", "normal");
  pdf.setFontSize(12);

  const lines = cleanLines(content);

  for (const line of lines) {
    const printableLine = line.length === 0 ? " " : line;
    const wrappedLines =
      line.length === 0 ? [""] : pdf.splitTextToSize(printableLine, maxWidth);

    for (const wrappedLine of wrappedLines) {
      if (y > pageHeight - marginBottom) {
        pdf.addPage();
        y = marginTop;
        pdf.setFont("times", "normal");
        pdf.setFontSize(12);
      }

      if (wrappedLine !== "") {
        pdf.text(wrappedLine, marginX, y);
      }

      y += lineHeight;
    }
  }

  pdf.save(`${fileName}.pdf`);
}

export async function exportTextToDocx({
  fileName,
  content,
}: ExportArgs) {
  const lines = cleanLines(content);

  const children = lines.map(
    (line) =>
      new Paragraph({
        children: [
          new TextRun({
            text: line,
            size: 24, // 12pt
          }),
        ],
        spacing: {
          after: 0,
          line: 480, // double spacing
        },
      })
  );

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${fileName}.docx`);
}