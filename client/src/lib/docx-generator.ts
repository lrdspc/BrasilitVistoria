import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import { type OfflineInspection, type OfflineTile, type OfflineNonConformity } from './storage';
import { NON_CONFORMITY_TYPES } from '@shared/schema';

export interface ReportData {
  inspection: OfflineInspection;
  client?: {
    name: string;
    cnpjCpf?: string;
  };
  tiles: OfflineTile[];
  nonConformities: OfflineNonConformity[];
}

export class DocxGenerator {
  async generateReport(data: ReportData): Promise<Blob> {
    const { inspection, client, tiles, nonConformities } = data;

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1440, // 1 inch = 1440 twips
                right: 1440,
                bottom: 1440,
                left: 1440,
              },
            },
          },
          children: [
            // Header
            this.createTitle(),
            this.createSpacer(),

            // Basic Information
            this.createSectionHeader('INFORMAÇÕES BÁSICAS'),
            ...this.createBasicInfoTable(inspection, client),
            this.createSpacer(),

            // Team Information
            this.createSectionHeader('EQUIPE RESPONSÁVEL'),
            ...this.createTeamInfoTable(inspection),
            this.createSpacer(),

            // Introduction
            this.createSectionHeader('INTRODUÇÃO'),
            this.createIntroduction(inspection.protocol),
            this.createSpacer(),

            // Quantity and Model
            this.createSectionHeader('QUANTIDADE E MODELO'),
            ...this.createTilesSection(tiles),
            this.createSpacer(),

            // Technical Analysis
            this.createSectionHeader('ANÁLISE TÉCNICA'),
            this.createTechnicalAnalysisIntro(),
            ...this.createNonConformitiesSection(nonConformities),
            this.createSpacer(),

            // Conclusion
            this.createSectionHeader('CONCLUSÃO'),
            ...this.createConclusionSection(nonConformities),
            this.createSpacer(),

            // Signature
            this.createSignature(),
          ],
        },
      ],
    });

    return await Packer.toBlob(doc);
  }

  private createTitle(): Paragraph {
    return new Paragraph({
      text: 'RELATÓRIO DE VISTORIA TÉCNICA',
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'RELATÓRIO DE VISTORIA TÉCNICA',
          bold: true,
          size: 32, // 16pt
          font: 'Times New Roman',
        }),
      ],
    });
  }

  private createSectionHeader(text: string): Paragraph {
    return new Paragraph({
      children: [
        new TextRun({
          text,
          bold: true,
          size: 24, // 12pt
          font: 'Times New Roman',
        }),
      ],
      spacing: {
        before: 240, // 12pt
        after: 120, // 6pt
      },
    });
  }

  private createSpacer(): Paragraph {
    return new Paragraph({
      text: '',
      spacing: { after: 240 }, // 12pt
    });
  }

  private createBasicInfoTable(inspection: OfflineInspection, client?: { name: string; cnpjCpf?: string }): Paragraph[] {
    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
    };

    return [
      this.createInfoRow('Data da Vistoria:', formatDate(inspection.date)),
      this.createInfoRow('Cliente:', client?.name || 'Não informado'),
      client?.cnpjCpf ? this.createInfoRow('CNPJ/CPF:', client.cnpjCpf) : null,
      this.createInfoRow('Empreendimento:', inspection.development),
      this.createInfoRow('Endereço:', `${inspection.address}, ${inspection.city}/${inspection.state}`),
      this.createInfoRow('CEP:', inspection.cep),
      this.createInfoRow('Protocolo FAR:', inspection.protocol),
      this.createInfoRow('Assunto:', inspection.subject),
    ].filter(Boolean) as Paragraph[];
  }

  private createTeamInfoTable(inspection: OfflineInspection): Paragraph[] {
    return [
      this.createInfoRow('Técnico Responsável:', inspection.technician),
      this.createInfoRow('Departamento:', inspection.department),
      this.createInfoRow('Unidade:', inspection.unit),
      this.createInfoRow('Coordenador:', inspection.coordinator),
      this.createInfoRow('Gerente:', inspection.manager),
      this.createInfoRow('Regional:', inspection.regional),
    ];
  }

  private createInfoRow(label: string, value: string): Paragraph {
    return new Paragraph({
      children: [
        new TextRun({
          text: label,
          bold: true,
          font: 'Times New Roman',
          size: 24, // 12pt
        }),
        new TextRun({
          text: ` ${value}`,
          font: 'Times New Roman',
          size: 24, // 12pt
        }),
      ],
      spacing: {
        after: 120, // 6pt
      },
    });
  }

  private createIntroduction(protocol: string): Paragraph {
    return new Paragraph({
      children: [
        new TextRun({
          text: `Em atenção à reclamação protocolo ${protocol}, foi realizada vistoria técnica no local para verificação das condições das telhas fornecidas pela Saint-Gobain do Brasil Produtos Industriais e para Construção Ltda.`,
          font: 'Times New Roman',
          size: 24, // 12pt
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: {
        line: 360, // 1.5 line spacing
      },
    });
  }

  private createTilesSection(tiles: OfflineTile[]): Paragraph[] {
    const paragraphs: Paragraph[] = [];
    let totalArea = 0;

    tiles.forEach((tile, index) => {
      const description = `${tile.quantity}x Telha Ondulada ${tile.thickness} CRFS, dimensão ${tile.length}m x ${tile.width}m`;
      
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({
            text: `• ${description}`,
            font: 'Times New Roman',
            size: 24, // 12pt
          }),
        ],
        spacing: {
          after: 120, // 6pt
        },
      }));

      totalArea += tile.correctedArea;
    });

    // Add total area
    paragraphs.push(new Paragraph({
      children: [
        new TextRun({
          text: `• Área coberta: ${totalArea.toFixed(2)}m² aproximadamente.`,
          font: 'Times New Roman',
          size: 24, // 12pt
          bold: true,
        }),
      ],
      spacing: {
        before: 120, // 6pt
      },
    }));

    return paragraphs;
  }

  private createTechnicalAnalysisIntro(): Paragraph {
    return new Paragraph({
      children: [
        new TextRun({
          text: 'Durante a vistoria técnica realizada no local, foram identificadas as seguintes não conformidades que podem ter contribuído para os problemas relatados:',
          font: 'Times New Roman',
          size: 24, // 12pt
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: {
        line: 360, // 1.5 line spacing
        after: 240, // 12pt
      },
    });
  }

  private createNonConformitiesSection(nonConformities: OfflineNonConformity[]): Paragraph[] {
    const paragraphs: Paragraph[] = [];

    nonConformities.forEach((nc, index) => {
      const ncType = NON_CONFORMITY_TYPES.find(type => type.id === nc.type);
      
      // Title
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({
            text: `${index + 1}. ${nc.title}`,
            font: 'Times New Roman',
            size: 24, // 12pt
            bold: true,
          }),
        ],
        spacing: {
          before: 240, // 12pt
          after: 120, // 6pt
        },
      }));

      // Description
      if (ncType?.description) {
        paragraphs.push(new Paragraph({
          children: [
            new TextRun({
              text: ncType.description,
              font: 'Times New Roman',
              size: 24, // 12pt
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: {
            line: 360, // 1.5 line spacing
            after: 120, // 6pt
          },
        }));
      }

      // Notes
      if (nc.notes) {
        paragraphs.push(new Paragraph({
          children: [
            new TextRun({
              text: `Observações: ${nc.notes}`,
              font: 'Times New Roman',
              size: 24, // 12pt
              italics: true,
            }),
          ],
          alignment: AlignmentType.JUSTIFIED,
          spacing: {
            line: 360, // 1.5 line spacing
            after: 240, // 12pt
          },
        }));
      }
    });

    return paragraphs;
  }

  private createConclusionSection(nonConformities: OfflineNonConformity[]): Paragraph[] {
    const paragraphs: Paragraph[] = [];

    // List of non-conformities
    paragraphs.push(new Paragraph({
      children: [
        new TextRun({
          text: 'Com base na vistoria técnica realizada, foram identificadas as seguintes não conformidades:',
          font: 'Times New Roman',
          size: 24, // 12pt
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: {
        line: 360, // 1.5 line spacing
        after: 240, // 12pt
      },
    }));

    nonConformities.forEach((nc, index) => {
      paragraphs.push(new Paragraph({
        children: [
          new TextRun({
            text: `${index + 1}. ${nc.title}`,
            font: 'Times New Roman',
            size: 24, // 12pt
          }),
        ],
        spacing: {
          after: 120, // 6pt
        },
      }));
    });

    // Final conclusion
    paragraphs.push(new Paragraph({
      children: [
        new TextRun({
          text: 'Considerando as não conformidades identificadas durante a vistoria técnica, a reclamação é considerada IMPROCEDENTE, uma vez que os problemas observados decorrem de fatores externos ao produto fornecido pela Saint-Gobain do Brasil.',
          font: 'Times New Roman',
          size: 24, // 12pt
          bold: true,
        }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      spacing: {
        line: 360, // 1.5 line spacing
        before: 240, // 12pt
      },
    }));

    return paragraphs;
  }

  private createSignature(): Paragraph {
    return new Paragraph({
      children: [
        new TextRun({
          text: 'Atenciosamente,\n\nSaint-Gobain do Brasil Produtos Industriais e para Construção Ltda.\nAssistência Técnica',
          font: 'Times New Roman',
          size: 24, // 12pt
        }),
      ],
      spacing: {
        before: 480, // 24pt
      },
    });
  }

  async generateAndDownload(data: ReportData, filename?: string): Promise<void> {
    const blob = await this.generateReport(data);
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `Relatório de Vistoria - ${data.client?.name || 'Cliente'}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  }
}

export const docxGenerator = new DocxGenerator();
