/**
 * MVP Controller
 * API endpoints for MVP Kit operations
 */

import { Request, Response } from 'express';
import * as mvpService from '../services/mvpService';

/**
 * Generate MVP from chat message content
 * POST /api/mvp/generate
 */
export async function generateMVP(req: Request, res: Response) {
    try {
        const { content, projectName, chatId } = req.body;
        const userId = (req as any).userId; // authMiddleware sets req.userId

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        // Check if content has MVP code
        if (!mvpService.containsMVPCode(content)) {
            return res.status(400).json({ error: 'No MVP code detected in content' });
        }

        // Set up SSE for progress updates
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const sendProgress = (status: string) => {
            res.write(`event: progress\ndata: ${JSON.stringify({ status })}\n\n`);
        };

        try {
            const project = await mvpService.generateAndDeployMVP(
                userId,
                projectName || `MVP-${chatId?.slice(-6) || 'new'}`,
                content,
                sendProgress,
                chatId  // Pass chatId for caching
            );

            res.write(`event: complete\ndata: ${JSON.stringify({
                projectId: project.id,
                port: project.port,
                url: `http://localhost:${project.port}`,
                status: project.status
            })}\n\n`);

            res.end();
        } catch (error: any) {
            res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
            res.end();
        }
    } catch (error: any) {
        console.error('[MVP] Generate error:', error);
        res.status(500).json({ error: error.message });
    }
}

/**
 * Parse code blocks from content (preview before build)
 * POST /api/mvp/parse
 */
export async function parseContent(req: Request, res: Response) {
    try {
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        const files = mvpService.parseCodeBlocks(content);
        const hasMVPCode = mvpService.containsMVPCode(content);

        res.json({
            hasMVPCode,
            fileCount: files.length,
            files: files.map(f => ({ path: f.path, language: f.language }))
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

/**
 * Get project status
 * GET /api/mvp/:id/status
 */
export async function getProjectStatus(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const project = mvpService.getProject(id);

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.json({
            id: project.id,
            name: project.name,
            status: project.status,
            port: project.port,
            url: project.port ? `http://localhost:${project.port}` : null,
            logs: project.logs.slice(-20) // Last 20 logs
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

/**
 * Stop running MVP
 * POST /api/mvp/:id/stop
 */
export async function stopMVP(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const project = await mvpService.stopProject(id);

        res.json({
            id: project.id,
            status: project.status,
            message: 'MVP stopped successfully'
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}

/**
 * Get all MVPs for current user
 * GET /api/mvp/list
 */
export async function listMVPs(req: Request, res: Response) {
    try {
        const userId = (req as any).userId; // authMiddleware sets req.userId

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const projects = mvpService.getUserProjects(userId);

        res.json(projects.map(p => ({
            id: p.id,
            name: p.name,
            status: p.status,
            port: p.port,
            url: p.port ? `http://localhost:${p.port}` : null,
            createdAt: p.createdAt
        })));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
}
