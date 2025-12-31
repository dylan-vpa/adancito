import React, { useState, useEffect } from 'react';

import { ArchiveRestore, Trash2, Clock, FolderKanban } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { apiClient } from '../services/api';
import { Spinner } from '../components/common/Spinner';
import type { Project } from '../types';

import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';

export function Archived() {
    const [archivedProjects, setArchivedProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        loadArchivedProjects();
    }, []);

    const loadArchivedProjects = async () => {
        try {
            const projects = await apiClient.getProjects();
            setArchivedProjects(projects.filter((p) => p.status === 'archived'));
        } catch (error) {
            console.error('Error loading archived projects:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRestore = async (projectId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await apiClient.updateProject(projectId, { status: 'active' });
            setArchivedProjects(archivedProjects.filter((p) => p.id !== projectId));
        } catch (error) {
            console.error('Error restoring project:', error);
        }
    };

    const handleDeleteClick = (projectId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setProjectToDelete(projectId);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!projectToDelete || isDeleting) return;
        setIsDeleting(true);
        try {
            await apiClient.deleteProject(projectToDelete);
            setArchivedProjects(archivedProjects.filter((p) => p.id !== projectToDelete));
            setShowDeleteModal(false);
            setProjectToDelete(null);
        } catch (error) {
            console.error('Error deleting project:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-primary-main)' }}>
            <Header />

            <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--spacing-xl)' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div className="flex items-center gap-md" style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <div style={{
                            padding: '10px',
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <FolderKanban size={24} color="var(--color-neutral-400)" />
                        </div>
                        <div>
                            <h1>Proyectos Archivados</h1>
                            <p className="text-secondary">
                                {archivedProjects.length} {archivedProjects.length === 1 ? 'proyecto archivado' : 'proyectos archivados'}
                            </p>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center" style={{ marginTop: 'var(--spacing-2xl)' }}>
                            <Spinner large />
                        </div>
                    ) : archivedProjects.length === 0 ? (
                        <div className="text-center text-secondary" style={{ marginTop: 'var(--spacing-2xl)', padding: 'var(--spacing-2xl)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '16px' }}>
                            <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>No tienes proyectos archivados</h3>
                            <p>
                                Cuando archives un proyecto, aparecerá aquí para que puedas recuperarlo después.
                            </p>
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                            gap: 'var(--spacing-lg)',
                        }}>
                            {archivedProjects.map((project) => (
                                <div
                                    key={project.id}
                                    className="card"
                                    style={{
                                        opacity: 0.8,
                                        border: '1px solid rgba(255,255,255,0.05)'
                                    }}
                                >
                                    <div className="flex items-center justify-between" style={{ marginBottom: 'var(--spacing-md)' }}>
                                        <h3 className="text-ellipsis" style={{ flex: 1, color: 'var(--color-neutral-300)' }}>{project.name}</h3>
                                    </div>

                                    {project.description && (
                                        <p className="text-secondary caption text-ellipsis" style={{
                                            marginBottom: 'var(--spacing-lg)',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden'
                                        }}>
                                            {project.description}
                                        </p>
                                    )}

                                    <div className="flex items-center gap-xs caption text-muted" style={{ marginBottom: 'var(--spacing-md)' }}>
                                        <Clock size={14} />
                                        <span>Archivado el {new Date(project.updated_at).toLocaleDateString('es-ES', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}</span>
                                    </div>

                                    <div className="flex gap-sm" style={{ marginTop: 'auto' }}>
                                        <button
                                            onClick={(e) => handleRestore(project.id, e)}
                                            className="btn btn-secondary w-full"
                                            style={{ fontSize: 'var(--font-size-caption)' }}
                                            title="Restaurar proyecto"
                                        >
                                            <ArchiveRestore size={16} style={{ marginRight: 'var(--spacing-xs)' }} />
                                            Restaurar
                                        </button>
                                        <button
                                            onClick={(e) => handleDeleteClick(project.id, e)}
                                            className="btn btn-ghost"
                                            style={{ padding: 'var(--spacing-md)', color: 'var(--color-feedback-error)' }}
                                            title="Eliminar permanentemente"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => !isDeleting && setShowDeleteModal(false)}
                title="Eliminar Proyecto Archivado"
                type="danger"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>
                            Cancelar
                        </Button>
                        <Button
                            style={{ backgroundColor: 'var(--color-feedback-error)' }}
                            onClick={handleDeleteConfirm}
                            disabled={isDeleting}
                        >
                            {isDeleting ? <div className="spinner" /> : 'Eliminar Permanentemente'}
                        </Button>
                    </>
                }
            >
                <p>
                    Estás a punto de eliminar este proyecto permanentemente.
                    <br /><br />
                    Esta acción es <strong>irreversible</strong> y eliminará todos los datos asociados.
                </p>
            </Modal>
        </div>
    );
}
