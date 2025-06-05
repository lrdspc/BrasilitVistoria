import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { InspectionFormData, NON_CONFORMITY_OPTIONS } from '@/types/inspection';
import { calculateTileTotals, formatArea, generateTileDescription } from './calculations';

interface ReportData extends InspectionFormData {
  clientName: string;
  totalArea: string;
  tileDescriptions: string[];
  selectedNonConformities: string[];
  nonConformityTexts: { [key: string]: string };
}

const NON_CONFORMITY_FULL_TEXTS: { [key: string]: string } = {
  "Armazenagem Incorreta": "As telhas foram armazenadas de forma inadequada, em contato direto com o solo e expostas às intempéries, comprometendo sua integridade estrutural.",
  "Carga Permanente": "Verificou-se excesso de cargas permanentes sobre a cobertura, incluindo equipamentos pesados que excedem a capacidade de suporte especificada.",
  "Corte das Telhas": "O corte das telhas foi realizado com ferramentas inadequadas, causando micro-trincas e comprometimento da resistência do material.",
  "Esforços devido à vento": "A estrutura não está adequadamente preparada para resistir aos esforços de vento conforme NBR 6123, apresentando fixações insuficientes.",
  "Fixação Inadequada": "O sistema de fixação não atende às especificações técnicas, com parafusos inadequados ou mal posicionados.",
  "Inclinação Insuficiente": "A inclinação da cobertura está abaixo do mínimo recomendado, podendo causar acúmulo de água e infiltrações.",
  "Instalação em desacordo com manual": "A instalação não seguiu as diretrizes do manual técnico Brasilit, comprometendo o desempenho do sistema.",
  "Montagem da estrutura": "A estrutura de apoio apresenta deficiências dimensionais ou de montagem que afetam a distribuição adequada das cargas.",
  "Parafusos inadequados": "Foram utilizados parafusos não compatíveis com o sistema, comprometendo a fixação e durabilidade.",
  "Perfuração incorreta": "As perfurações foram executadas incorretamente, causando danos ao material e pontos de fragilidade.",
  "Sobrecarga acidental": "Verificou-se aplicação de cargas acidentais excessivas durante a execução ou uso da cobertura.",
  "Telhas danificadas": "Identificou-se danos nas telhas decorrentes de manuseio inadequado ou impactos durante a instalação.",
  "Ventilação inadequada": "O sistema de ventilação não atende aos requisitos técnicos, podendo causar condensação e deterioração.",
  "Vedação deficiente": "As vedações e sobreposições não foram executadas adequadamente, permitindo infiltrações."
};

export async function generateInspectionReport(data: InspectionFormData): Promise<Blob> {
  const reportData = prepareReportData(data);
  
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Header
        new Paragraph({
          children: [
            new TextRun({
              text: "RELATÓRIO DE VISTORIA TÉCNICA",
              bold: true,
              size: 32,
              font: "Times New Roman"
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        }),

        // Basic Information
        ...createBasicInfoSection(reportData),
        
        // Team Information  
        ...createTeamSection(reportData),
        
        // Introduction
        ...createIntroductionSection(reportData),
        
        // Tiles and Area
        ...createTilesSection(reportData),
        
        // Technical Analysis
        ...createTechnicalAnalysisSection(reportData),
        
        // Conclusion
        ...createConclusionSection(reportData),
        
        // Signature
        ...createSignatureSection()
      ]
    }]
  });

  return await Packer.toBlob(doc);
}

function prepareReportData(data: InspectionFormData): ReportData {
  const totals = calculateTileTotals(data.tiles);
  const selectedNCs = data.nonConformities.filter(nc => nc.selected);
  
  return {
    ...data,
    clientName: data.clientName || "Cliente não informado",
    totalArea: formatArea(totals.totalCorrectedArea * 10000), // Convert back to cm²
    tileDescriptions: data.tiles.map(generateTileDescription),
    selectedNonConformities: selectedNCs.map(nc => nc.title),
    nonConformityTexts: NON_CONFORMITY_FULL_TEXTS
  };
}

function createBasicInfoSection(data: ReportData): Paragraph[] {
  return [
    new Paragraph({
      children: [
        new TextRun({ text: "Cliente: ", bold: true, font: "Times New Roman", size: 24 }),
        new TextRun({ text: data.clientName, font: "Times New Roman", size: 24 })
      ],
      spacing: { after: 200 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Data: ", bold: true, font: "Times New Roman", size: 24 }),
        new TextRun({ text: new Date(data.date).toLocaleDateString('pt-BR'), font: "Times New Roman", size: 24 })
      ],
      spacing: { after: 200 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Endereço: ", bold: true, font: "Times New Roman", size: 24 }),
        new TextRun({ text: `${data.address}, ${data.city}/${data.state}`, font: "Times New Roman", size: 24 })
      ],
      spacing: { after: 200 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Empreendimento: ", bold: true, font: "Times New Roman", size: 24 }),
        new TextRun({ text: data.enterprise, font: "Times New Roman", size: 24 })
      ],
      spacing: { after: 400 }
    })
  ];
}

function createTeamSection(data: ReportData): Paragraph[] {
  return [
    new Paragraph({
      children: [
        new TextRun({ text: "Técnico Responsável: ", bold: true, font: "Times New Roman", size: 24 }),
        new TextRun({ text: data.technicianName, font: "Times New Roman", size: 24 })
      ],
      spacing: { after: 200 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Departamento: ", bold: true, font: "Times New Roman", size: 24 }),
        new TextRun({ text: "Assistência Técnica", font: "Times New Roman", size: 24 })
      ],
      spacing: { after: 200 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Coordenador: ", bold: true, font: "Times New Roman", size: 24 }),
        new TextRun({ text: "Marlon Weingartner", font: "Times New Roman", size: 24 })
      ],
      spacing: { after: 200 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: "Gerente: ", bold: true, font: "Times New Roman", size: 24 }),
        new TextRun({ text: "Elisabete Kudo", font: "Times New Roman", size: 24 })
      ],
      spacing: { after: 400 }
    })
  ];
}

function createIntroductionSection(data: ReportData): Paragraph[] {
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: `Em atenção à reclamação protocolo ${data.protocol}, referente ao assunto "${data.subject}", foi realizada vistoria técnica no local em ${new Date(data.date).toLocaleDateString('pt-BR')}.`,
          font: "Times New Roman",
          size: 24
        })
      ],
      spacing: { after: 400 },
      alignment: AlignmentType.JUSTIFIED
    })
  ];
}

function createTilesSection(data: ReportData): Paragraph[] {
  const paragraphs: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({
          text: "QUANTIDADE E MODELO",
          bold: true,
          font: "Times New Roman",
          size: 28
        })
      ],
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 300 }
    })
  ];

  // Add tile descriptions
  data.tileDescriptions.forEach(description => {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: "• ", font: "Times New Roman", size: 24 }),
          new TextRun({ text: description, font: "Times New Roman", size: 24 })
        ],
        spacing: { after: 200 }
      })
    );
  });

  // Add total area
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({ text: "• ", font: "Times New Roman", size: 24 }),
        new TextRun({ text: `Área coberta: ${data.totalArea} aproximadamente.`, font: "Times New Roman", size: 24 })
      ],
      spacing: { after: 400 }
    })
  );

  return paragraphs;
}

function createTechnicalAnalysisSection(data: ReportData): Paragraph[] {
  const paragraphs: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({
          text: "ANÁLISE TÉCNICA",
          bold: true,
          font: "Times New Roman",
          size: 28
        })
      ],
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 300 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "Durante a vistoria técnica, foram identificadas as seguintes não conformidades:",
          font: "Times New Roman",
          size: 24
        })
      ],
      spacing: { after: 300 },
      alignment: AlignmentType.JUSTIFIED
    })
  ];

  // Add non-conformities with full text
  data.selectedNonConformities.forEach((ncTitle, index) => {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${index + 1}. ${ncTitle}`,
            bold: true,
            font: "Times New Roman",
            size: 24
          })
        ],
        spacing: { before: 300, after: 200 }
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: data.nonConformityTexts[ncTitle] || "Descrição não disponível.",
            font: "Times New Roman",
            size: 24
          })
        ],
        spacing: { after: 300 },
        alignment: AlignmentType.JUSTIFIED
      })
    );
  });

  return paragraphs;
}

function createConclusionSection(data: ReportData): Paragraph[] {
  const paragraphs: Paragraph[] = [
    new Paragraph({
      children: [
        new TextRun({
          text: "CONCLUSÃO",
          bold: true,
          font: "Times New Roman",
          size: 28
        })
      ],
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 300 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "Com base na análise técnica realizada, foram identificadas as seguintes não conformidades:",
          font: "Times New Roman",
          size: 24
        })
      ],
      spacing: { after: 300 },
      alignment: AlignmentType.JUSTIFIED
    })
  ];

  // Add numbered list of non-conformities
  data.selectedNonConformities.forEach((ncTitle, index) => {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${index + 1}. ${ncTitle}`,
            font: "Times New Roman",
            size: 24
          })
        ],
        spacing: { after: 200 }
      })
    );
  });

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "Diante do exposto, a reclamação é considerada IMPROCEDENTE, uma vez que os problemas identificados decorrem de práticas inadequadas não relacionadas à qualidade do produto fornecido pela Saint-Gobain do Brasil.",
          bold: true,
          font: "Times New Roman",
          size: 24
        })
      ],
      spacing: { before: 400, after: 400 },
      alignment: AlignmentType.JUSTIFIED
    })
  );

  return paragraphs;
}

function createSignatureSection(): Paragraph[] {
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: "Atenciosamente,",
          font: "Times New Roman",
          size: 24
        })
      ],
      spacing: { before: 600, after: 400 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "Saint-Gobain do Brasil Produtos Industriais e para Construção Ltda.",
          bold: true,
          font: "Times New Roman",
          size: 24
        })
      ],
      spacing: { after: 200 }
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "Assistência Técnica - Regional Sul",
          font: "Times New Roman",
          size: 24
        })
      ]
    })
  ];
}
