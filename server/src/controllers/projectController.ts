import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getOne, getAll, runQuery, generateId, getCurrentTimestamp } from '../models/db';

interface Project {
    id: string;
    user_id: string;
    name: string;
    description?: string;
    status: 'active' | 'completed' | 'archived';
    created_at: string;
    updated_at: string;
}

interface ProjectDeliverable {
    id: string;
    project_id: string;
    step_number: number;
    title: string;
    description?: string;
    eden_level?: string;
    status: 'pending' | 'in_progress' | 'completed';
    chat_id?: string;
    completed_at?: string;
    created_at: string;
}

/**
 * Get all projects for user
 */
export function getProjects(req: AuthRequest, res: Response) {
    try {
        const projects = getAll<Project>(
            'SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC',
            [req.userId!]
        );

        const projectsWithDeliverables = projects.map(project => {
            const deliverables = getAll<ProjectDeliverable>(
                'SELECT * FROM project_deliverables WHERE project_id = ?',
                [project.id]
            );
            return { ...project, deliverables };
        });

        res.json({
            success: true,
            data: projectsWithDeliverables
        });
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ success: false, error: 'Failed to get projects' });
    }
}

/**
 * Create new project
 */
export function createProject(req: AuthRequest, res: Response) {
    try {
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, error: 'Project name is required' });
        }

        const projectId = generateId();
        const now = getCurrentTimestamp();

        runQuery(
            `INSERT INTO projects (id, user_id, name, description, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'active', ?, ?)`,
            [projectId, req.userId!, name, description || null, now, now]
        );

        // Create default EDEN deliverables
        const edenSteps = [
            { step: 1, title: 'El Dolor', description: 'Validación de la idea de negocio', level: 'Nivel 1 - El Dolor' },
            { step: 2, title: 'La Solución', description: 'Diseño de la solución', level: 'Nivel 2 - La Solución' },
            { step: 3, title: 'Plan de Negocio', description: 'Estructura del negocio', level: 'Nivel 3 - Plan de Negocio' },
            { step: 4, title: 'MVP Funcional', description: 'Desarrollo del producto mínimo viable', level: 'Nivel 4 - MVP Funcional' },
            { step: 5, title: 'Validación de Mercado', description: 'Prueba con usuarios reales', level: 'Nivel 5 - Validación de Mercado' },
            { step: 6, title: 'Proyección y Estrategia', description: 'Plan de crecimiento', level: 'Nivel 6 - Proyección y Estrategia' },
            { step: 7, title: 'Lanzamiento Real', description: 'Salida al mercado', level: 'Nivel 7 - Lanzamiento Real' },
        ];

        edenSteps.forEach((step) => {
            const deliverableId = generateId();
            runQuery(
                `INSERT INTO project_deliverables (id, project_id, step_number, title, description, eden_level, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
                [deliverableId, projectId, step.step, step.title, step.description, step.level, now]
            );
        });

        const project = getOne<Project>('SELECT * FROM projects WHERE id = ?', [projectId]);

        res.status(201).json({
            success: true,
            data: project
        });
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ success: false, error: 'Failed to create project' });
    }
}

/**
 * Get specific project with deliverables
 */
export function getProject(req: AuthRequest, res: Response) {
    try {
        const { id } = req.params;

        const project = getOne<Project>(
            'SELECT * FROM projects WHERE id = ? AND user_id = ?',
            [id, req.userId!]
        );

        if (!project) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }

        const deliverables = getAll<ProjectDeliverable>(
            'SELECT * FROM project_deliverables WHERE project_id = ? ORDER BY step_number ASC',
            [id]
        );

        const chats = getAll(
            'SELECT * FROM chat_sessions WHERE project_id = ? AND status = \'active\' ORDER BY created_at DESC',
            [id]
        );

        res.json({
            success: true,
            data: {
                ...project,
                deliverables,
                chats
            }
        });
    } catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({ success: false, error: 'Failed to get project' });
    }
}

/**
 * Update project
 */
export function updateProject(req: AuthRequest, res: Response) {
    try {
        const { id } = req.params;
        const { name, description, status } = req.body;

        const updates: string[] = [];
        const params: any[] = [];

        if (name !== undefined) {
            updates.push('name = ?');
            params.push(name);
        }

        if (description !== undefined) {
            updates.push('description = ?');
            params.push(description);
        }

        if (status !== undefined) {
            updates.push('status = ?');
            params.push(status);
        }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, error: 'No updates provided' });
        }

        updates.push('updated_at = ?');
        params.push(getCurrentTimestamp(), id, req.userId!);

        runQuery(
            `UPDATE projects SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
            params
        );

        const project = getOne<Project>('SELECT * FROM projects WHERE id = ?', [id]);

        res.json({
            success: true,
            data: project
        });
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ success: false, error: 'Failed to update project' });
    }
}

/**
 * Delete project
 */
export function deleteProject(req: AuthRequest, res: Response) {
    try {
        const { id } = req.params;

        runQuery(
            'DELETE FROM projects WHERE id = ? AND user_id = ?',
            [id, req.userId!]
        );

        res.json({
            success: true,
            message: 'Project deleted'
        });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ success: false, error: 'Failed to delete project' });
    }
}

/**
 * Update deliverable status
 */
export function updateDeliverable(req: AuthRequest, res: Response) {
    try {
        const { id } = req.params;
        const { status, chat_id } = req.body;

        const updates: string[] = [];
        const params: any[] = [];

        if (status !== undefined) {
            updates.push('status = ?');
            params.push(status);

            if (status === 'completed') {
                updates.push('completed_at = ?');
                params.push(getCurrentTimestamp());
            }
        }

        if (chat_id !== undefined) {
            updates.push('chat_id = ?');
            params.push(chat_id);
        }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, error: 'No updates provided' });
        }

        params.push(id);

        runQuery(
            `UPDATE project_deliverables SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        const deliverable = getOne<ProjectDeliverable>(
            'SELECT * FROM project_deliverables WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            data: deliverable
        });
    } catch (error) {
        console.error('Update deliverable error:', error);
        res.status(500).json({ success: false, error: 'Failed to update deliverable' });
    }
}
