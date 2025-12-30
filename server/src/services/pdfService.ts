import PDFDocument from 'pdfkit';

/**
 * Helper to render markdown-like content in PDFKit
 */
const renderMarkdown = (doc: PDFKit.PDFDocument, content: string) => {
    const lines = content.split('\n');
    let inList = false;

    lines.forEach(line => {
        const trimmed = line.trim();

        // Headers (#, ##)
        if (trimmed.startsWith('# ')) {
            doc.moveDown(0.5);
            doc.font('Helvetica-Bold').fontSize(18).text(trimmed.replace('# ', ''), { align: 'left' });
            doc.moveDown(0.5);
        } else if (trimmed.startsWith('## ')) {
            doc.moveDown(0.5);
            doc.font('Helvetica-Bold').fontSize(16).text(trimmed.replace('## ', ''), { align: 'left' });
            doc.moveDown(0.3);
        } else if (trimmed.startsWith('### ')) {
            doc.moveDown(0.5);
            doc.font('Helvetica-Bold').fontSize(14).text(trimmed.replace('### ', ''), { align: 'left' });
            doc.moveDown(0.2);
        }
        // Lists (- or *)
        else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            inList = true;
            doc.font('Helvetica').fontSize(11).text(`•  ${trimmed.substring(2)}`, { indent: 10, align: 'justify' });
        }
        // Normal Text
        else if (trimmed.length > 0) {
            inList = false;
            // Simple Bold parsing (**text**) - Split by **
            const parts = trimmed.split(/(\*\*.*?\*\*)/g);

            doc.fontSize(11).text('', { continued: true, align: 'justify' });

            parts.forEach(part => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    doc.font('Helvetica-Bold').text(part.replace(/\*\*/g, ''), { continued: true });
                } else {
                    doc.font('Helvetica').text(part, { continued: true });
                }
            });
            doc.text(''); // End line
            doc.moveDown(0.5);
        } else {
            // Empty line
            if (!inList) doc.moveDown(0.5);
        }
    });
};

/**
 * Generates a PDF document for a given deliverable.
 * @param title The title of the document (filename without ext)
 * @param content The main content text of the document
 * @returns A Promise that resolves to a Buffer containing the PDF data
 */
export const generateDeliverablePDF = (title: string, content?: string): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            resolve(pdfData);
        });

        doc.on('error', (err) => {
            reject(err);
        });

        // --- BRANDING HEADER ---
        // Green Accent Line
        doc.rect(0, 0, doc.page.width, 10).fill('#9EC8B3');

        doc.moveDown(2);

        // Title Box
        doc.fillColor('#0F1412')
            .font('Helvetica-Bold')
            .fontSize(26)
            .text(title.replace(/_/g, ' ').toUpperCase(), { align: 'center' });

        doc.moveDown(0.5);
        doc.lineWidth(1)
            .strokeColor('#9EC8B3')
            .moveTo(100, doc.y)
            .lineTo(doc.page.width - 100, doc.y)
            .stroke();

        doc.moveDown(2);

        // Metadata
        doc.fillColor('#444444')
            .fontSize(10)
            .font('Helvetica')
            .text(`ADÁN AI | Generado el: ${new Date().toLocaleDateString('es-ES')}`, { align: 'center' });

        doc.moveDown(3);

        // --- CONTENT ---
        doc.fillColor('#000000');

        console.log('[pdfService] 📄 Generating PDF with title:', title);
        console.log('[pdfService] 📄 Content received:', content ? `${content.length} chars - "${content.substring(0, 100)}..."` : 'UNDEFINED/EMPTY');

        if (content && content.trim().length > 0) {
            renderMarkdown(doc, content);
        } else {
            console.warn('[pdfService] ⚠️ No content provided, showing default message');
            doc.fontSize(12).text('Contenido no disponible.', { align: 'center' });
        }

        // --- FOOTER ---
        const bottom = doc.page.margins.bottom;
        doc.page.margins.bottom = 0;

        doc.fontSize(9)
            .fillColor('#AAAAAA')
            .text('Documento generado por Adán - Tu Co-founder AI',
                50,
                doc.page.height - 40,
                { align: 'center', width: doc.page.width - 100 }
            );

        doc.page.margins.bottom = bottom;

        doc.end();
    });
};
