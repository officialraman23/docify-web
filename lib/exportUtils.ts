import jsPDF from "jspdf";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";

type ExportEssayArgs = {
  title: string;
  content: string;
};

function cleanLines(content: string) {
  return content
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 0);
}

export async function exportEssayToPdf({
  title,
  content,
}: ExportEssayArgs) {
  const pdf = new jsPDF({
    unit: "pt",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const marginX = 56;
  const marginTop = 60;
  const lineHeight = 22;
  const maxWidth = pageWidth - marginX * 2;

  let y = marginTop;

  pdf.setFont("times", "normal");
  pdf.setFontSize(12);

  const finalTitle = title.trim() || "Untitled Essay";
  const wrappedTitle = pdf.splitTextToSize(finalTitle, maxWidth);

  wrappedTitle.forEach((line: string) => {
    if (y > pageHeight - 60) {
      pdf.addPage();
      y = marginTop;
    }
    pdf.text(line, pageWidth / 2, y, { align: "center" });
    y += lineHeight;
  });

  y += 10;

  const lines = cleanLines(content);

  for (const line of lines) {
    const wrapped = pdf.splitTextToSize(line, maxWidth);

    for (const wrappedLine of wrapped) {
      if (y > pageHeight - 60) {
        pdf.addPage();
        y = marginTop;
      }

      pdf.text(wrappedLine, marginX, y);
      y += lineHeight;
    }

    y += 8;
  }

  pdf.save(`${finalTitle}.pdf`);
}

export async function exportEssayToDocx({
  title,
  content,
}: ExportEssayArgs) {
  const finalTitle = title.trim() || "Untitled Essay";
  const lines = cleanLines(content);

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: finalTitle,
                bold: true,
                size: 28,
              }),
            ],
            spacing: {
              after: 240,
            },
          }),
          ...lines.map(
            (line) =>
              new Paragraph({
                children: [
                  new TextRun({
                    text: line,
                    size: 24,
                  }),
                ],
                spacing: {
                  after: 180,
                },
              })
          ),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${finalTitle}.docx`);
}