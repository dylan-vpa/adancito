import PDFDocument from 'pdfkit';
import path from 'path';

/**
 * PDF Service Configuration
 */
const CONFIG = {
    colors: {
        background: '#0B0E11', // Dark background
        text: '#FFFFFF',       // White text
        accent: '#9EC8B3',     // Adan Green
        secondary: '#A8B5AF',  // Soft Gray
        border: '#1C2F28',     // Dark Border
        tableHeader: '#161A1E',// Darker Header
        tableRowEven: '#0F1215', // Slightly different row
        tableRowOdd: '#0B0E11',  // Base background
    },
    fonts: {
        regular: 'Helvetica',
        bold: 'Helvetica-Bold',
        italic: 'Helvetica-Oblique',
    },
    layout: {
        margin: 50,
        pageWidth: 612, // Letter
        pageHeight: 792,
    }
};

/**
 * Interface for Table Data
 */
interface TableData {
    headers: string[];
    rows: string[][];
}

/**
 * Helper to parse markdown tables
 */
const parseMarkdownTable = (tableBlock: string): TableData | null => {
    try {
        const lines = tableBlock.trim().split('\n');
        if (lines.length < 2) return null;

        // Parse headers
        const headers = lines[0].split('|').map(h => h.trim()).filter(h => h !== '');

        // Skip separator line (---|---)
        const contentRows = lines.slice(2);

        const rows = contentRows.map(line => {
            return line.split('|').map(cell => cell.trim()).filter((cell, i) => {
                // Keep logic simple: if line starts/ends with pipe, split might create empty first/last elements
                // We'll rely on index matching header count mostly, but robust parsing is tricky with varied formats.
                // Basic markdown table assumption: | col1 | col2 |
                // Split gives ['', ' col1 ', ' col2 ', '']
                // We filter out empty strings if they are at start/end
                return true;
            }).filter(cell => cell !== '');
        });

        // Normalize row lengths
        const normalizedRows = rows.map(row => {
            while (row.length < headers.length) row.push('');
            return row.slice(0, headers.length);
        });

        return { headers, rows: normalizedRows };
    } catch (e) {
        console.error('Error parsing table:', e);
        return null;
    }
};

/**
 * Render a table in the PDF
 */
const renderTable = (doc: PDFKit.PDFDocument, table: TableData) => {
    const startX = CONFIG.layout.margin;
    const tableWidth = CONFIG.layout.pageWidth - (CONFIG.layout.margin * 2);
    const colWidth = tableWidth / table.headers.length;
    const padding = 5;
    const rowHeight = 20; // Base height, might need dynamic calculation for wrapping text

    // Render Headers
    doc.font(CONFIG.fonts.bold).fontSize(10).fillColor(CONFIG.colors.accent);

    // Header Background
    doc.fillColor(CONFIG.colors.tableHeader)
        .rect(startX, doc.y, tableWidth, rowHeight + 10)
        .fill();

    doc.fillColor(CONFIG.colors.accent); // Reset text color

    let currentX = startX;
    const headerY = doc.y + 5;

    table.headers.forEach(header => {
        doc.text(header, currentX + padding, headerY, {
            width: colWidth - (padding * 2),
            align: 'left'
        });
        currentX += colWidth;
    });

    doc.moveDown(1.5);

    // Render Rows
    doc.font(CONFIG.fonts.regular).fontSize(9).fillColor(CONFIG.colors.text);

    table.rows.forEach((row, i) => {
        // Calculate dynamic row height based on content
        let maxCellHeight = 0;

        row.forEach(cell => {
            const height = doc.heightOfString(cell, { width: colWidth - (padding * 2) });
            if (height > maxCellHeight) maxCellHeight = height;
        });

        // Ensure row accommodates the content height + padding
        const actualRowHeight = Math.max(rowHeight, maxCellHeight + 12);

        // Background striping
        const rowStartY = doc.y; // Capture start Y for this row

        // Check page break
        if (rowStartY + actualRowHeight > CONFIG.layout.pageHeight - CONFIG.layout.margin) {
            doc.addPage();
            // Re-draw background for page
            doc.rect(0, 0, doc.page.width, doc.page.height).fill(CONFIG.colors.background);
        }

        // Re-capture Y in case page break changed it
        const currentY = doc.y;

        const bg = i % 2 === 0 ? CONFIG.colors.tableRowEven : CONFIG.colors.tableRowOdd;
        doc.fillColor(bg).rect(startX, currentY, tableWidth, actualRowHeight).fill();

        doc.fillColor(CONFIG.colors.secondary); // Text color

        currentX = startX;
        row.forEach(cell => {
            // CRITICAL FIX: Use currentY (fixed for the row), not doc.y (which changes after each text)
            doc.text(cell, currentX + padding, currentY + 6, {
                width: colWidth - (padding * 2),
                align: 'left'
            });
            currentX += colWidth;
        });

        // Move Y down by the calculated row height for the NEXT row
        doc.y = currentY + actualRowHeight;
    });

    // Reset X to margin and ensure spacing after table
    doc.x = CONFIG.layout.margin;
    doc.moveDown(1.5);
};


/**
 * Pre-process content to normalize weird formatting issues
 * e.g. "||" acts as a newline in some AI outputs for tables
 */
const preprocessContent = (content: string): string => {
    let processed = content;
    // Fix: Replace "||" with "|\n|" to force newlines in compressed tables
    // But be careful not to break logical ORs in code blocks (though unlikely in this context)
    // We target "||" that looks like table row separators
    processed = processed.replace(/\|\|/g, '|\n|');
    return processed;
};

/**
 * Helper to render markdown-like content in PDFKit
 */
const renderMarkdown = (doc: PDFKit.PDFDocument, rawContent: string) => {
    const content = preprocessContent(rawContent);

    // 1. Detect Tables (improved block detection)
    // We look for blocks that have a separator line like "|---|---"
    // We split by standardizing newlines first
    const lines = content.split('\n');

    let inTable = false;
    let tableBuffer: string[] = [];

    // We will process line by line to build blocks, then render
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // rudimentary table detection
        // Table start: line contains pipes | and next line (or previous) is separator?
        // Actually, just checking if line starts and ends with | is a good hint, or contains multiple |
        const isTableLine = line.startsWith('|') || (line.includes('|') && line.includes('---'));

        if (isTableLine) {
            inTable = true;
            tableBuffer.push(line);
        } else {
            // If we were in a table and now hit a non-table line, render the table
            if (inTable) {
                const tableStr = tableBuffer.join('\n');
                // Only render as table if it looks valid
                if (tableStr.includes('---')) {
                    const tableData = parseMarkdownTable(tableStr);
                    if (tableData) {
                        renderTable(doc, tableData);
                    } else {
                        // Fallback: render table lines as text if parse failed
                        tableBuffer.forEach(l => renderLine(doc, l));
                    }
                } else {
                    tableBuffer.forEach(l => renderLine(doc, l));
                }
                tableBuffer = [];
                inTable = false;
            }
            // Render current non-table line
            if (line !== '') renderLine(doc, line);
            else doc.moveDown(0.5);
        }
    }

    // Clean up remaining table buffer
    if (inTable && tableBuffer.length > 0) {
        const tableStr = tableBuffer.join('\n');
        const tableData = parseMarkdownTable(tableStr);
        if (tableData) renderTable(doc, tableData);
        else tableBuffer.forEach(l => renderLine(doc, l));
    }
};

/**
 * Helper to render a single line of text formatting
 */
const renderLine = (doc: PDFKit.PDFDocument, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Headers
    if (trimmed.startsWith('# ')) {
        doc.moveDown(0.5);
        doc.font(CONFIG.fonts.bold).fontSize(20).fillColor(CONFIG.colors.accent)
            .text(trimmed.replace('# ', ''), { align: 'left' });
        doc.moveDown(0.5);
    } else if (trimmed.startsWith('## ')) {
        doc.moveDown(0.5);
        doc.font(CONFIG.fonts.bold).fontSize(16).fillColor(CONFIG.colors.text)
            .text(trimmed.replace('## ', ''), { align: 'left' });
        doc.moveDown(0.3);
    } else if (trimmed.startsWith('### ')) {
        doc.moveDown(0.5);
        doc.font(CONFIG.fonts.bold).fontSize(14).fillColor(CONFIG.colors.text)
            .text(trimmed.replace('### ', ''), { align: 'left' });
        doc.moveDown(0.2);
    }
    // Lists
    else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        renderStyledText(doc, `•  ${trimmed.substring(2)}`, { indent: 10, align: 'justify' });
    }
    // Normal Text
    else {
        renderStyledText(doc, trimmed, { align: 'justify' });
        doc.moveDown(0.2);
    }
};

/**
 * Helper to render text with bold styles
 */
const renderStyledText = (doc: PDFKit.PDFDocument, text: string, options: any = {}) => {
    // Parse bold (**text**)
    const parts = text.split(/(\*\*.*?\*\*)/g);

    // Set initial cursor X if needed? PDFKit handles flow for continued text.
    // But we need to ensure we don't drop the 'options' (like indent) for the first chunk

    // Note: "continued: true" concatenates. The last piece must be continued: false (or default)
    // BUT: PDFKit `text` logic is tricky with continued.
    // Better strategy: Use the 'continued' flag for all but the last part.

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!part) continue; // Skip empty splits

        const isBold = part.startsWith('**') && part.endsWith('**');
        const cleanText = isBold ? part.slice(2, -2) : part;
        const isLast = i === parts.length - 1;

        // Setup font
        if (isBold) {
            doc.font(CONFIG.fonts.bold).fillColor(CONFIG.colors.text);
        } else {
            doc.font(CONFIG.fonts.regular).fillColor(CONFIG.colors.secondary);
        }

        // Render
        // Inherit options like indent only for the first piece if splitting lines?
        // Actually PDFKit applies options to the current text block.
        doc.text(cleanText, {
            ...options,
            continued: !isLast
        });
    }
};

/**
 * Generates a PDF document for a given deliverable.
 */
export const generateDeliverablePDF = (title: string, content?: string): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            margin: CONFIG.layout.margin,
            size: 'LETTER',
            // We'll draw the background manually
        });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            resolve(pdfData);
        });

        doc.on('error', (err) => {
            reject(err);
        });

        // --- BACKGROUND FOR ALL PAGES ---
        // We need to listen to pageAdded to draw background on new pages
        // The first page is already added
        const drawBackground = () => {
            doc.rect(0, 0, doc.page.width, doc.page.height).fill(CONFIG.colors.background);
        };

        // Draw background for first page
        drawBackground();

        // Hook for subsequent pages
        doc.on('pageAdded', () => {
            drawBackground();
        });


        // --- LOGO & HEADER ---
        // Path to logo
        const logoPath = path.join(process.cwd(), '../client/public/logo.png'); // Adjusted path based on server cwd

        try {
            // Draw Logo (Top Left)
            doc.image(logoPath, 50, 40, { width: 40 });

            // Draw Signature Text
            doc.font(CONFIG.fonts.bold).fontSize(14).fillColor(CONFIG.colors.text)
                .text('Adán', 100, 45);
            doc.font(CONFIG.fonts.regular).fontSize(10).fillColor(CONFIG.colors.accent)
                .text('Tu Co-founder Digital', 100, 60);

        } catch (e) {
            console.warn('Logo not found or could not be loaded:', e);
            // Fallback: Text Logo
            doc.font(CONFIG.fonts.bold).fontSize(14).fillColor(CONFIG.colors.accent).text('ADÁN - Tu Co-founder Digital', 50, 50);
        }

        // Header Title (Right aligned or next to logo?)
        // Let's center title, put Date on right.

        // Move down past logo
        doc.moveDown(3);

        // --- TITLE SECTION ---
        // Green Accent Line
        doc.rect(0, 0, doc.page.width, 6).fill(CONFIG.colors.accent); // Top bar (actually at 0, overwrites background)

        // Re-draw logo on top of accent line? No, accent line is at y=0. Logo is at y=40.

        doc.y = 100;

        // Title Box
        doc.fillColor(CONFIG.colors.text)
            .font(CONFIG.fonts.bold)
            .fontSize(24)
            .text(title.replace(/_/g, ' ').toUpperCase(), { align: 'center' });

        doc.moveDown(0.5);

        // Decorative Line
        doc.lineWidth(1)
            .strokeColor(CONFIG.colors.accent)
            .moveTo(CONFIG.layout.margin * 2, doc.y)
            .lineTo(doc.page.width - (CONFIG.layout.margin * 2), doc.y)
            .stroke();

        doc.moveDown(2);

        // Metadata
        doc.fillColor(CONFIG.colors.secondary)
            .fontSize(10)
            .font(CONFIG.fonts.regular)
            .text(`Generado el: ${new Date().toLocaleDateString('es-ES')}`, { align: 'center' });

        doc.moveDown(3);

        // --- CONTENT ---
        console.log('[pdfService] 📄 Generating PDF with title:', title);

        if (content && content.trim().length > 0) {
            renderMarkdown(doc, content);
        } else {
            doc.fillColor(CONFIG.colors.secondary).fontSize(12).text('Contenido no disponible.', { align: 'center' });
        }

        // --- FOOTER (On all pages? Complex with PDFKit without buffering, but we can do last page footer easily) ---
        // For simple footer on generated pages requires 'pageAdded' event logic or manually checking y
        // We'll just add it to the flow for now, effectively "End of Document" footer.
        // True footer requires `doc.text(..., bottomY)` on every page event.

        // Let's just put an end marker
        doc.moveDown(4);
        doc.fontSize(9)
            .fillColor(CONFIG.colors.border)
            .text('— Fin del documento —', { align: 'center' });

        // Add Branding to Bottom of CURRENT page (and maybe setup listener for others if we wanted correct pagination)
        const bottomY = doc.page.height - 40;
        doc.fontSize(9)
            .fillColor(CONFIG.colors.secondary)
            .text('ADÁN AI - Tu Co-founder Inteligente',
                CONFIG.layout.margin,
                bottomY,
                { align: 'center', width: doc.page.width - (CONFIG.layout.margin * 2) }
            );

        doc.end();
    });
};
