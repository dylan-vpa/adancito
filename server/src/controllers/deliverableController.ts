import { Request, Response } from 'express';
import { generateDeliverablePDF } from '../services/pdfService';
import { runQuery, getOne, getCurrentTimestamp } from '../models/db';
import fs from 'fs';
import path from 'path';

/**
 * Generate PDF on-demand from content sent by frontend
 * Also marks the associated deliverable as completed, unlocking the next level
 */
export const generateDeliverable = async (req: Request, res: Response) => {
    try {
        const { title, content, chatId } = req.body;

        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        console.log('[Deliverable] Generating PDF on-demand');
        console.log('[Deliverable] Title:', title);
        console.log('[Deliverable] Content length:', content?.length || 0);
        console.log('[Deliverable] ChatId:', chatId || 'none');

        const pdfBuffer = await generateDeliverablePDF(title, content || '');

        // If chatId is provided, mark the associated deliverable as completed
        if (chatId) {
            const deliverable = getOne<{ id: string; project_id: string; step_number: number }>(
                'SELECT id, project_id, step_number FROM project_deliverables WHERE chat_id = ?',
                [chatId]
            );

            if (deliverable) {
                runQuery(
                    'UPDATE project_deliverables SET status = ?, completed_at = ? WHERE id = ?',
                    ['completed', getCurrentTimestamp(), deliverable.id]
                );
                console.log(`[Deliverable] ✅ Marked deliverable ${deliverable.id} (step ${deliverable.step_number}) as COMPLETED`);
            }
        }

        // Sanitize filename
        const safeFilename = title
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9_\-\.]/g, "_");

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error generating deliverable:', error);
        res.status(500).json({ error: 'Failed to generate deliverable document' });
    }
};

/**
 * LEGACY: Download pre-generated file (kept for backwards compatibility)
 */
export const downloadDeliverable = async (req: Request, res: Response) => {
    try {
        const { filename } = req.params;

        if (!filename) {
            return res.status(400).json({ error: 'Filename is required' });
        }

        const tempDir = path.join(process.cwd(), 'temp');
        const filePath = path.join(tempDir, filename);

        // Check if pre-generated file exists
        if (fs.existsSync(filePath)) {
            res.download(filePath, (err) => {
                if (err) {
                    console.error('Error serving file:', err);
                    if (!res.headersSent) {
                        res.status(500).json({ error: 'Failed to download file' });
                    }
                }
            });
            return;
        }

        console.log(`[Deliverable] File not found in temp (${filePath}), generating fallback...`);

        const title = filename.replace('.pdf', '').replace('.zip', '');
        const pdfBuffer = await generateDeliverablePDF(title);

        const safeFilename = title
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-zA-Z0-9_\-\.]/g, "_");

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error generating deliverable:', error);
        res.status(500).json({ error: 'Failed to generate deliverable document' });
    }
};

/**
 * Mark a deliverable as completed by its associated chatId
 * Used for MVP level when HTML code card appears (not PDF download)
 */
export const completeByChatId = async (req: Request, res: Response) => {
    try {
        const { chatId } = req.params;

        if (!chatId) {
            return res.status(400).json({ success: false, error: 'ChatId is required' });
        }

        console.log(`[Deliverable] Marking complete by chatId: ${chatId}`);

        const deliverable = getOne<{ id: string; project_id: string; step_number: number; status: string }>(
            'SELECT id, project_id, step_number, status FROM project_deliverables WHERE chat_id = ?',
            [chatId]
        );

        if (!deliverable) {
            console.log(`[Deliverable] No deliverable found for chatId: ${chatId}`);
            return res.json({ success: true, message: 'No deliverable linked to this chat' });
        }

        if (deliverable.status === 'completed') {
            console.log(`[Deliverable] Already completed: ${deliverable.id}`);
            return res.json({ success: true, message: 'Already completed', deliverableId: deliverable.id });
        }

        runQuery(
            'UPDATE project_deliverables SET status = ?, completed_at = ? WHERE id = ?',
            ['completed', getCurrentTimestamp(), deliverable.id]
        );

        console.log(`[Deliverable] ✅ Marked deliverable ${deliverable.id} (step ${deliverable.step_number}) as COMPLETED via code card`);

        res.json({
            success: true,
            message: 'Level completed!',
            deliverableId: deliverable.id,
            stepNumber: deliverable.step_number
        });

    } catch (error) {
        console.error('Error completing deliverable by chatId:', error);
        res.status(500).json({ success: false, error: 'Failed to mark deliverable as completed' });
    }
};
