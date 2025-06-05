import { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Packer } from "docx";
import type { Inspection, Tile, NonConformity, Client, User } from "@shared/schema";

interface ReportData {
  inspection: Inspection;
  client?: Client;
  user: User;
  tiles: Tile[];
  nonConformities: NonConformity[];
}

export class DocxGenerator {
  static async generateReport(data: ReportData): Promise<Blob> {
    const { inspection, client, user, tiles, nonConformities } = data;

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: "Times New Roman",
              size: 24, // 12pt in half-points
            },
          },
        },
      },
      sections: [
        {
          children: [
            // Header
            new Paragraph({
              children: [
                new TextRun({
                  text: "RELATÓRIO DE VISTORIA TÉCNICA",
                  bold: true,
                  size: 28, // 14pt
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),

            // Basic Information
            new Paragraph({
              children: [new TextRun({ text: "INFORMAÇÕES BÁSICAS", bold: true })],
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "Data: ", bold: true }),
                new TextRun({ text: new Date(inspection.date).toLocaleDateString("pt-BR") }),
              ],
              spacing: { after: 100 },
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "Cliente: ", bold: true }),
                new TextRun({ text: client?.name || "Não informado" }),
              ],
              spacing: { after: 100 },
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "Protocolo: ", bold: true }),
                new TextRun({ text: inspection.protocol }),
              ],
              spacing: { after: 100 },
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "Endereço: ", bold: true }),
                new TextRun({ text: `${inspection.address}, ${inspection.city}/${inspection.state}` }),
              ],
              spacing: { after: 100 },
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "CEP: ", bold: true }),
                new TextRun({ text: inspection.cep }),
              ],
              spacing: { after: 100 },
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "Empreendimento: ", bold: true }),
                new TextRun({ text: inspection.enterprise }),
              ],
              spacing: { after: 100 },
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "Assunto: ", bold: true }),
                new TextRun({ text: inspection.subject }),
              ],
              spacing: { after: 300 },
            }),

            // Team Information
            new Paragraph({
              children: [new TextRun({ text: "EQUIPE RESPONSÁVEL", bold: true })],
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "Técnico Responsável: ", bold: true }),
                new TextRun({ text: user.name }),
              ],
              spacing: { after: 100 },
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "Departamento: ", bold: true }),
                new TextRun({ text: user.department }),
              ],
              spacing: { after: 100 },
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "Unidade: ", bold: true }),
                new TextRun({ text: user.unit }),
              ],
              spacing: { after: 100 },
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "Coordenador: ", bold: true }),
                new TextRun({ text: user.coordinator }),
              ],
              spacing: { after: 100 },
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "Gerente: ", bold: true }),
                new TextRun({ text: user.manager }),
              ],
              spacing: { after: 100 },
            }),

            new Paragraph({
              children: [
                new TextRun({ text: "Regional: ", bold: true }),
                new TextRun({ text: user.regional }),
              ],
              spacing: { after: 300 },
            }),

            // Introduction
            new Paragraph({
              children: [new TextRun({ text: "INTRODUÇÃO", bold: true })],
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: `Em atenção à reclamação protocolo ${inspection.protocol}, foi realizada vistoria técnica no empreendimento localizado em ${inspection.address}, ${inspection.city}/${inspection.state}, para análise das telhas fibrocimento instaladas.`,
                }),
              ],
              spacing: { after: 300 },
            }),

            // Tiles Section
            new Paragraph({
              children: [new TextRun({ text: "QUANTIDADE E MODELO", bold: true })],
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
            }),

            ...tiles.map(tile => 
              new Paragraph({
                children: [
                  new TextRun({
                    text: `• ${tile.quantity}: Telha Ondulada ${tile.thickness} CRFS, dimensão ${tile.length}m x ${tile.width}m.`,
                  }),
                ],
                spacing: { after: 100 },
              })
            ),

            new Paragraph({
              children: [
                new TextRun({
                  text: `• Área coberta: ${inspection.totalArea.toFixed(2)}m² aproximadamente.`,
                  bold: true,
                }),
              ],
              spacing: { after: 300 },
            }),

            // Technical Analysis
            new Paragraph({
              children: [new TextRun({ text: "ANÁLISE TÉCNICA", bold: true })],
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Durante a vistoria foram identificadas as seguintes não conformidades que podem ter contribuído para os problemas relatados:",
                }),
              ],
              spacing: { after: 200 },
            }),

            ...nonConformities.flatMap((nc, index) => [
              new Paragraph({
                children: [
                  new TextRun({ text: `${index + 1}. ${nc.title}`, bold: true }),
                ],
                spacing: { before: 200, after: 100 },
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: nc.description || "Não conformidade identificada durante a inspeção." }),
                ],
                spacing: { after: 100 },
              }),
              ...(nc.notes ? [
                new Paragraph({
                  children: [
                    new TextRun({ text: "Observações: ", bold: true }),
                    new TextRun({ text: nc.notes }),
                  ],
                  spacing: { after: 200 },
                }),
              ] : []),
            ]),

            // Conclusion
            new Paragraph({
              children: [new TextRun({ text: "CONCLUSÃO", bold: true })],
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Com base na vistoria realizada, foram identificadas as seguintes não conformidades:",
                }),
              ],
              spacing: { after: 200 },
            }),

            ...nonConformities.map((nc, index) => 
              new Paragraph({
                children: [
                  new TextRun({ text: `${index + 1}. ${nc.title}` }),
                ],
                spacing: { after: 100 },
              })
            ),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Reclamação considerada IMPROCEDENTE.",
                  bold: true,
                }),
              ],
              spacing: { before: 200, after: 300 },
            }),

            // Signature
            new Paragraph({
              children: [
                new TextRun({
                  text: "Atenciosamente,",
                }),
              ],
              spacing: { before: 400, after: 200 },
            }),

            new Paragraph({
              children: [
                new TextRun({
                  text: "Saint-Gobain do Brasil Produtos Industriais e para Construção Ltda.",
                  bold: true,
                }),
              ],
              spacing: { after: 100 },
            }),

            new Paragraph({
              children: [
                new TextRun({ text: user.name, bold: true }),
              ],
              spacing: { after: 50 },
            }),

            new Paragraph({
              children: [
                new TextRun({ text: user.department }),
              ],
              spacing: { after: 300 },
            }),
          ],
        },
      ],
    });

    return await Packer.toBlob(doc);
  }

  static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static async generateAndDownload(data: ReportData): Promise<void> {
    const blob = await this.generateReport(data);
    const filename = `Relatório de Vistoria - ${data.client?.name || data.inspection.protocol}.docx`;
    this.downloadBlob(blob, filename);
  }
}
