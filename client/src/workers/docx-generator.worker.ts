import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  AlignmentType,
  WidthType,
  BorderStyle,
  VerticalAlign,
  HeadingLevel,
  ExternalHyperlink,
  PageBreak,
  PageNumber,
  Header,
  Footer,
  TabStopType,
  TabStopPosition,
} from 'docx';

// Helper function to fetch image as ArrayBuffer (if URL) or convert base64 to ArrayBuffer
async function getImageBuffer(urlOrBase64: string): Promise<ArrayBuffer | string> {
  if (urlOrBase64.startsWith('data:image')) {
    // It's a base64 string
    try {
      const base64Data = urlOrBase64.split(',')[1];
      const byteString = atob(base64Data);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      return ab;
    } catch (error) {
      console.error("Error converting base64 to ArrayBuffer:", error);
      return "Error converting base64 image."; // Return error message for document
    }
  } else {
    // It's a URL, fetch it
    try {
      const response = await fetch(urlOrBase64);
      if (!response.ok) {
        console.error(`Failed to fetch image: ${response.statusText} from ${urlOrBase64}`);
        return `Failed to fetch image: ${response.statusText}`; // Return error message
      }
      return await response.arrayBuffer();
    } catch (error) {
      console.error("Error fetching image:", error, "URL:", urlOrBase64);
      return `Error fetching image: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
}

// Main function to generate the document
async function generateInspectionReport(data: any): Promise<Document> {
  const { inspection, client, user, tiles, nonConformities } = data;

  const sections = [];

  // --- Header Section ---
  const headerParagraphs = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "RELATÓRIO DE VISTORIA TÉCNICA",
          bold: true,
          size: 32, // 16pt
          font: "Calibri",
        }),
      ],
      spacing: { after: 300 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Protocolo: ${inspection?.protocol || 'N/A'}`,
          size: 24, // 12pt
          font: "Calibri",
        }),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Data da Vistoria: ${inspection?.date ? new Date(inspection.date).toLocaleDateString('pt-BR') : 'N/A'}`,
          size: 24, // 12pt
          font: "Calibri",
        }),
      ],
      spacing: { after: 600 }, // More space after header
    }),
  ];
  sections.push(...headerParagraphs);

  // --- Client Information ---
  sections.push(
    new Paragraph({
      children: [new TextRun({ text: "1. DADOS DO CLIENTE", bold: true, size: 28, font: "Calibri" })],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    })
  );
  const clientDetails = [
    `Nome/Razão Social: ${client?.name || 'N/A'}`,
    `CPF/CNPJ: ${client?.document || 'N/A'}`,
    `Contato: ${client?.contact || 'N/A'}`,
    `Email: ${client?.email || 'N/A'}`,
    `Endereço da Obra: ${inspection?.address || 'N/A'}, ${inspection?.city || 'N/A'} - ${inspection?.state || 'N/A'}, CEP: ${inspection?.cep || 'N/A'}`,
  ];
  clientDetails.forEach(detail => sections.push(new Paragraph({ children: [new TextRun({ text: detail, size: 22, font: "Calibri" })], spacing: { after: 50 } })));

  // --- Enterprise Information ---
  sections.push(
    new Paragraph({
      children: [new TextRun({ text: "2. DADOS DO EMPREENDIMENTO", bold: true, size: 28, font: "Calibri" })],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    })
  );
  sections.push(new Paragraph({ children: [new TextRun({ text: `Tipo: ${inspection?.enterprise || 'N/A'}`, size: 22, font: "Calibri" })], spacing: { after: 50 } }));

  // --- Inspection Details ---
  sections.push(
    new Paragraph({
      children: [new TextRun({ text: "3. DADOS DA VISTORIA", bold: true, size: 28, font: "Calibri" })],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    })
  );
  const inspectionDetails = [
    `Assunto/Objetivo: ${inspection?.subject || 'N/A'}`,
    `Técnico Responsável: ${user?.name || 'N/A'}`,
    `Departamento: ${user?.department || 'N/A'}`,
    `Unidade: ${user?.unit || 'N/A'}`,
  ];
  inspectionDetails.forEach(detail => sections.push(new Paragraph({ children: [new TextRun({ text: detail, size: 22, font: "Calibri" })], spacing: { after: 50 } })));

  sections.push(new PageBreak()); // Start new page for tiles

  // --- Tile Information ---
  sections.push(
    new Paragraph({
      children: [new TextRun({ text: "4. TELHAS UTILIZADAS", bold: true, size: 28, font: "Calibri" })],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    })
  );
  if (tiles && tiles.length > 0) {
    const tileTableRows = [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Espessura", bold: true, size: 20, font: "Calibri" })] })], verticalAlign: VerticalAlign.CENTER }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Dimensões (CxL)", bold: true, size: 20, font: "Calibri" })] })], verticalAlign: VerticalAlign.CENTER }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Quantidade", bold: true, size: 20, font: "Calibri" })] })], verticalAlign: VerticalAlign.CENTER }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Área Corrigida (m²)", bold: true, size: 20, font: "Calibri" })] })], verticalAlign: VerticalAlign.CENTER }),
        ],
      }),
    ];
    tiles.forEach((tile: any) => {
      tileTableRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: tile.thickness, size: 20, font: "Calibri" })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${tile.length}m x ${tile.width}m`, size: 20, font: "Calibri" })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: String(tile.quantity), size: 20, font: "Calibri" })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: tile.correctedArea?.toFixed(2) || '0.00', size: 20, font: "Calibri" })] })] }),
          ],
        })
      );
    });
    // Total Area Row
    const totalArea = tiles.reduce((sum: number, tile: any) => sum + (tile.correctedArea || 0), 0);
    tileTableRows.push(
      new TableRow({
        children: [
          new TableCell({ text: "" }), // colspan not directly supported, use empty cells or merge
          new TableCell({ text: "" }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Área Total:", bold: true, size: 20, font: "Calibri" })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: totalArea.toFixed(2) + " m²", bold: true, size: 20, font: "Calibri" })] })] }),
        ],
      })
    );
    sections.push(new Table({ rows: tileTableRows, width: { size: 100, type: WidthType.PERCENTAGE } }));
  } else {
    sections.push(new Paragraph({ children: [new TextRun({ text: "Nenhuma telha registrada.", size: 22, font: "Calibri" })] }));
  }

  sections.push(new PageBreak()); // Start new page for non-conformities

  // --- Non-Conformities ---
  sections.push(
    new Paragraph({
      children: [new TextRun({ text: "5. NÃO CONFORMIDADES IDENTIFICADAS", bold: true, size: 28, font: "Calibri" })],
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    })
  );
  if (nonConformities && nonConformities.length > 0) {
    for (const [index, nc] of nonConformities.entries()) {
      sections.push(
        new Paragraph({
          children: [new TextRun({ text: `5.${index + 1} ${nc.title}`, bold: true, size: 24, font: "Calibri" })],
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 150 },
        })
      );
      sections.push(new Paragraph({ children: [new TextRun({ text: `Descrição: ${nc.description || 'N/A'}`, size: 22, font: "Calibri" })], spacing: { after: 50 } }));
      sections.push(new Paragraph({ children: [new TextRun({ text: `Observações: ${nc.notes || 'N/A'}`, size: 22, font: "Calibri" })], spacing: { after: 100 } }));

      if (nc.photos && nc.photos.length > 0) {
        sections.push(new Paragraph({ children: [new TextRun({ text: "Fotografias:", bold: true, size: 22, font: "Calibri" })], spacing: { after: 50 }}));
        for (const photoUrl of nc.photos) {
          try {
            const imageBuffer = await getImageBuffer(photoUrl);
            if (typeof imageBuffer === 'string') { // Error message returned
                sections.push(new Paragraph({ children: [new TextRun({ text: `Falha ao carregar imagem: ${imageBuffer}`, size: 20, font: "Calibri", color: "FF0000" })]}));
            } else {
                 sections.push(new Paragraph({
                    children: [
                        new ImageRun({
                        data: imageBuffer,
                        transformation: { width: 400, height: 300 }, // Adjust size as needed
                        }),
                    ],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 100 },
                }));
            }
          } catch (e) {
            console.error("Error processing image for DOCX:", e);
            sections.push(new Paragraph({ children: [new TextRun({ text: `Erro ao processar imagem: ${e instanceof Error ? e.message : String(e)}`, size: 20, font: "Calibri", color: "FF0000" })]}));
          }
        }
      }
      sections.push(new Paragraph({ text: "", spacing: {after: 200}})); // Space between NCs
    }
  } else {
    sections.push(new Paragraph({ children: [new TextRun({ text: "Nenhuma não conformidade registrada.", size: 22, font: "Calibri" })] }));
  }

  // --- Document Footer ---
  // Note: Actual page numbers are best handled by Word itself or more complex footer logic.
  // This adds a simple text footer.
  const footer = new Footer({
    children: [
        new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
                new TextRun({
                    children: ["Página ", PageNumber.CURRENT],
                    font: "Calibri",
                    size: 18,
                }),
                new TextRun({
                    children: [" de ", PageNumber.TOTAL_PAGES],
                    font: "Calibri",
                    size: 18,
                }),
            ],
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "VIGITEL - Relatório Confidencial Brasilit", size: 18, font: "Calibri"})]
        })
    ],
  });


  const doc = new Document({
    creator: "VIGITEL System",
    title: `Relatório de Vistoria - ${inspection?.protocol || 'N/A'}`,
    description: "Relatório de Vistoria Técnica",
    styles: {
        default: {
            document: { run: { font: "Calibri", size: 22 } }, // 11pt default
        },
        paragraphStyles: [
            { id: "normalPara", name: "Normal Para", basedOn: "Normal", next: "Normal", run: { font: "Calibri", size: 22 } },
        ],
    },
    sections: [{
      properties: {
        page: {
          margin: { top: 720, right: 720, bottom: 720, left: 720 }, // Approx 1 inch margins
        },
      },
      headers: {
        default: new Header({
            children: [new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: "Brasilit VIGITEL", size: 18, font: "Calibri", color: "888888"})],
                spacing: {after: 100}
            })],
        }),
      },
      footers: { default: footer },
      children: sections,
    }],
  });

  return doc;
}

self.onmessage = async function(e) {
  const { inspectionData, type } = e.data;

  if (type === 'generate_docx') {
    try {
      console.log("Worker: Received data for DOCX generation", inspectionData);
      const doc = await generateInspectionReport(inspectionData);
      const buffer = await Packer.toBuffer(doc);

      self.postMessage({
        success: true,
        data: buffer,
        filename: `Vistoria_${inspectionData?.inspection?.protocol || 'Report'}.docx`
      }, [buffer]); // Transfer buffer
    } catch (error) {
      console.error("Worker: Error generating DOCX:", error);
      self.postMessage({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
};

// Log to confirm worker is loaded
console.log("DOCX Generator Worker loaded.");
self.postMessage({ workerLoaded: true }); // Optional: notify main thread worker is ready
