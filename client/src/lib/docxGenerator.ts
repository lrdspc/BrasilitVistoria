import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';

interface ReportData {
  client?: string;
  protocol: string;
  date: string;
  city: string;
  state: string;
  address: string;
  subject: string;
  technician: string;
  coordinator: string;
  manager: string;
  region: string;
  tiles: Array<{
    thickness: string;
    length: string;
    width: string;
    quantity: number;
    correctedArea: string;
  }>;
  totalArea: string;
  nonConformities: Array<{
    title: string;
    description: string;
    notes?: string;
  }>;
}

export function generateDocxReport(data: ReportData): Promise<Blob> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Title
          new Paragraph({
            children: [
              new TextRun({
                text: "RELATÓRIO DE VISTORIA TÉCNICA",
                bold: true,
                size: 32,
                font: "Times New Roman",
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),

          // Basic Information
          new Paragraph({
            children: [
              new TextRun({
                text: "INFORMAÇÕES BÁSICAS",
                bold: true,
                size: 24,
                font: "Times New Roman",
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          ...(data.client ? [
            new Paragraph({
              children: [
                new TextRun({ text: "Cliente: ", bold: true, font: "Times New Roman" }),
                new TextRun({ text: data.client, font: "Times New Roman" }),
              ],
              spacing: { after: 120 },
            }),
          ] : []),

          new Paragraph({
            children: [
              new TextRun({ text: "Protocolo: ", bold: true, font: "Times New Roman" }),
              new TextRun({ text: data.protocol, font: "Times New Roman" }),
            ],
            spacing: { after: 120 },
          }),

          new Paragraph({
            children: [
              new TextRun({ text: "Data da Vistoria: ", bold: true, font: "Times New Roman" }),
              new TextRun({ text: data.date, font: "Times New Roman" }),
            ],
            spacing: { after: 120 },
          }),

          new Paragraph({
            children: [
              new TextRun({ text: "Endereço: ", bold: true, font: "Times New Roman" }),
              new TextRun({ text: `${data.address}, ${data.city}/${data.state}`, font: "Times New Roman" }),
            ],
            spacing: { after: 120 },
          }),

          new Paragraph({
            children: [
              new TextRun({ text: "Assunto: ", bold: true, font: "Times New Roman" }),
              new TextRun({ text: data.subject, font: "Times New Roman" }),
            ],
            spacing: { after: 120 },
          }),

          // Team
          new Paragraph({
            children: [
              new TextRun({
                text: "EQUIPE RESPONSÁVEL",
                bold: true,
                size: 24,
                font: "Times New Roman",
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({ text: "Técnico Responsável: ", bold: true, font: "Times New Roman" }),
              new TextRun({ text: data.technician, font: "Times New Roman" }),
            ],
            spacing: { after: 120 },
          }),

          new Paragraph({
            children: [
              new TextRun({ text: "Coordenador: ", bold: true, font: "Times New Roman" }),
              new TextRun({ text: data.coordinator, font: "Times New Roman" }),
            ],
            spacing: { after: 120 },
          }),

          new Paragraph({
            children: [
              new TextRun({ text: "Gerente: ", bold: true, font: "Times New Roman" }),
              new TextRun({ text: data.manager, font: "Times New Roman" }),
            ],
            spacing: { after: 120 },
          }),

          new Paragraph({
            children: [
              new TextRun({ text: "Regional: ", bold: true, font: "Times New Roman" }),
              new TextRun({ text: data.region, font: "Times New Roman" }),
            ],
            spacing: { after: 120 },
          }),

          // Introduction
          new Paragraph({
            children: [
              new TextRun({
                text: "INTRODUÇÃO",
                bold: true,
                size: 24,
                font: "Times New Roman",
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Em atenção à reclamação protocolo ${data.protocol}, foi realizada vistoria técnica no local da obra para avaliação das condições das telhas de fibrocimento instaladas.`,
                font: "Times New Roman",
              }),
            ],
            spacing: { after: 200 },
            alignment: AlignmentType.JUSTIFIED,
          }),

          // Tiles
          new Paragraph({
            children: [
              new TextRun({
                text: "QUANTIDADE E MODELO",
                bold: true,
                size: 24,
                font: "Times New Roman",
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          ...data.tiles.map(tile => 
            new Paragraph({
              children: [
                new TextRun({ text: "• ", font: "Times New Roman" }),
                new TextRun({ 
                  text: `${tile.quantity}: Telha Ondulada ${tile.thickness} CRFS, dimensão ${tile.length} x ${tile.width}.`,
                  font: "Times New Roman",
                }),
              ],
              spacing: { after: 120 },
            })
          ),

          new Paragraph({
            children: [
              new TextRun({ text: "• ", font: "Times New Roman" }),
              new TextRun({ 
                text: `Área coberta: ${data.totalArea} aproximadamente.`,
                font: "Times New Roman",
              }),
            ],
            spacing: { after: 200 },
          }),

          // Technical Analysis
          new Paragraph({
            children: [
              new TextRun({
                text: "ANÁLISE TÉCNICA",
                bold: true,
                size: 24,
                font: "Times New Roman",
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Durante a vistoria técnica foram identificadas as seguintes não conformidades:",
                font: "Times New Roman",
              }),
            ],
            spacing: { after: 200 },
            alignment: AlignmentType.JUSTIFIED,
          }),

          ...data.nonConformities.map(nc => [
            new Paragraph({
              children: [
                new TextRun({
                  text: nc.title,
                  bold: true,
                  font: "Times New Roman",
                }),
              ],
              spacing: { before: 200, after: 120 },
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: nc.description,
                  font: "Times New Roman",
                }),
              ],
              spacing: { after: 120 },
              alignment: AlignmentType.JUSTIFIED,
            }),
            ...(nc.notes ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Observação: ${nc.notes}`,
                    font: "Times New Roman",
                    italics: true,
                  }),
                ],
                spacing: { after: 200 },
                alignment: AlignmentType.JUSTIFIED,
              }),
            ] : []),
          ]).flat(),

          // Conclusion
          new Paragraph({
            children: [
              new TextRun({
                text: "CONCLUSÃO",
                bold: true,
                size: 24,
                font: "Times New Roman",
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Com base na vistoria técnica realizada, foram identificadas as seguintes não conformidades:",
                font: "Times New Roman",
              }),
            ],
            spacing: { after: 200 },
            alignment: AlignmentType.JUSTIFIED,
          }),

          ...data.nonConformities.map((nc, index) =>
            new Paragraph({
              children: [
                new TextRun({ text: `${index + 1}. `, font: "Times New Roman" }),
                new TextRun({ text: nc.title, font: "Times New Roman" }),
              ],
              spacing: { after: 120 },
            })
          ),

          new Paragraph({
            children: [
              new TextRun({
                text: "Diante do exposto, a reclamação é considerada IMPROCEDENTE, uma vez que os problemas identificados decorrem de não conformidades relacionadas ao manuseio, armazenagem e/ou instalação inadequados das telhas.",
                font: "Times New Roman",
              }),
            ],
            spacing: { before: 200, after: 400 },
            alignment: AlignmentType.JUSTIFIED,
          }),

          // Signature
          new Paragraph({
            children: [
              new TextRun({
                text: "Atenciosamente,",
                font: "Times New Roman",
              }),
            ],
            spacing: { after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Saint-Gobain do Brasil Produtos Industriais e para Construção Ltda.",
                bold: true,
                font: "Times New Roman",
              }),
            ],
            spacing: { after: 120 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Assistência Técnica",
                font: "Times New Roman",
              }),
            ],
          }),
        ],
      },
    ],
  });

  return Packer.toBlob(doc);
}
