/**
 * Usecase Document Generator
 * 
 * Generate DOCX files for usecases using docx library
 */

import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableCell, TableRow, WidthType, BorderStyle, AlignmentType, UnderlineType } from 'docx';
import { Usecase } from '../data/usecases';

/**
 * Generate DOCX file for all usecases
 */
export async function generateAllUsecasesDocx(usecases: Usecase[]): Promise<void> {
  // Create document sections
  const sections: any[] = [];

  // Title page
  sections.push(
    new Paragraph({
      text: 'TÀI LIỆU USECASE',
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: `Tổng số: ${usecases.length} usecases`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      text: `Ngày tạo: ${new Date().toLocaleDateString('vi-VN', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    })
  );

  // Table of Contents
  sections.push(
    new Paragraph({
      text: 'MỤC LỤC',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 300 },
    })
  );

  usecases.forEach((uc, idx) => {
    sections.push(
      new Paragraph({
        text: `${idx + 1}. ${uc.id} - ${uc.title}`,
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: `${idx + 1}. `,
            bold: true,
          }),
          new TextRun({
            text: `${uc.id}`,
            bold: true,
            color: '2563eb',
          }),
          new TextRun({
            text: ` - ${uc.title}  `,
          }),
          new TextRun({
            text: `[${uc.priority.toUpperCase()}]`,
            color: uc.priority === 'high' ? 'ef4444' : uc.priority === 'medium' ? 'f59e0b' : '3b82f6',
            bold: true,
          }),
          new TextRun({
            text: ` [${uc.status.toUpperCase()}]`,
            color: uc.status === 'completed' ? '10b981' : uc.status === 'in-progress' ? 'f59e0b' : '6b7280',
            bold: true,
          }),
        ],
      })
    );
  });

  // Usecases content
  usecases.forEach((uc, idx) => {
    // Page break before each usecase (except first)
    sections.push(
      new Paragraph({
        text: '',
        pageBreakBefore: idx > 0,
        spacing: { before: idx === 0 ? 600 : 0 },
      })
    );

    // Usecase title
    sections.push(
      new Paragraph({
        text: `${idx + 1}. ${uc.id}: ${uc.title}`,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 300 },
      })
    );

    // Metadata table
    const metadataRows = [
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ text: 'Mô tả:', bold: true })],
            width: { size: 25, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph(uc.description)],
            width: { size: 75, type: WidthType.PERCENTAGE },
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ text: 'Danh mục:', bold: true })],
          }),
          new TableCell({
            children: [new Paragraph(uc.category)],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ text: 'Tác nhân:', bold: true })],
          }),
          new TableCell({
            children: [new Paragraph(uc.actor)],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ text: 'Độ ưu tiên:', bold: true })],
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: uc.priority.toUpperCase(),
                    bold: true,
                    color: uc.priority === 'high' ? 'ef4444' : uc.priority === 'medium' ? 'f59e0b' : '3b82f6',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({ text: 'Trạng thái:', bold: true })],
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: uc.status.toUpperCase(),
                    bold: true,
                    color: uc.status === 'completed' ? '10b981' : uc.status === 'in-progress' ? 'f59e0b' : '6b7280',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ];

    sections.push(
      new Table({
        rows: metadataRows,
        width: { size: 100, type: WidthType.PERCENTAGE },
        margins: {
          top: 100,
          bottom: 100,
          left: 100,
          right: 100,
        },
      }),
      new Paragraph({ text: '', spacing: { after: 300 } })
    );

    // Preconditions
    if (uc.preconditions && uc.preconditions.length > 0) {
      sections.push(
        new Paragraph({
          text: 'Điều kiện tiên quyết',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 200 },
        })
      );
      uc.preconditions.forEach(condition => {
        sections.push(
          new Paragraph({
            text: `• ${condition}`,
            spacing: { after: 100 },
          })
        );
      });
    }

    // Main Flow
    if (uc.steps && uc.steps.length > 0) {
      sections.push(
        new Paragraph({
          text: 'Luồng chính',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 200 },
        })
      );
      uc.steps.forEach((step, stepIdx) => {
        sections.push(
          new Paragraph({
            text: `${stepIdx + 1}. ${step}`,
            spacing: { after: 100 },
          })
        );
      });
    }

    // Postconditions
    if (uc.postconditions && uc.postconditions.length > 0) {
      sections.push(
        new Paragraph({
          text: 'Điều kiện sau',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 200 },
        })
      );
      uc.postconditions.forEach(condition => {
        sections.push(
          new Paragraph({
            text: `• ${condition}`,
            spacing: { after: 100 },
          })
        );
      });
    }

    // Alternative Flows
    if (uc.alternativeFlows && uc.alternativeFlows.length > 0) {
      sections.push(
        new Paragraph({
          text: 'Luồng thay thế',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 200 },
        })
      );
      uc.alternativeFlows.forEach(flow => {
        sections.push(
          new Paragraph({
            text: `• ${flow}`,
            spacing: { after: 100 },
          })
        );
      });
    }

    // Exception Flows
    if (uc.exceptionFlows && uc.exceptionFlows.length > 0) {
      sections.push(
        new Paragraph({
          text: 'Luồng ngoại lệ',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 200 },
        })
      );
      uc.exceptionFlows.forEach(flow => {
        sections.push(
          new Paragraph({
            text: `• ${flow}`,
            spacing: { after: 100 },
          })
        );
      });
    }

    // Related APIs
    if (uc.relatedAPIs && uc.relatedAPIs.length > 0) {
      sections.push(
        new Paragraph({
          text: 'API liên quan',
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 200 },
        })
      );
      uc.relatedAPIs.forEach(api => {
        sections.push(
          new Paragraph({
            text: `• ${api}`,
            spacing: { after: 100 },
            style: 'code',
          })
        );
      });
    }
  });

  // Create document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: sections,
      },
    ],
  });

  // Generate and download
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Usecases_Document_${new Date().getTime()}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}
