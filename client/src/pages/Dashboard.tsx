import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderKanban, Plus, Clock } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { apiClient } from '../services/api';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Spinner } from '../components/common/Spinner';
import type { Project } from '../types';

export function Dashboard() {
    const navigate = useNavigate();
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newProject, setNewProject] = useState({ name: '', description: '' });
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            const data = await apiClient.getProjects();
            setProjects(data.filter((p) => p.status === 'active'));
        } catch (error) {
            console.error('Error loading projects:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateProject = async () => {
        if (!newProject.name.trim() || isCreating) return;

        setIsCreating(true);
        try {
            const project = await apiClient.createProject(newProject.name, newProject.description);
            setProjects([project, ...projects]);
            setShowCreateModal(false);
            setNewProject({ name: '', description: '' });
            navigate(`/projects/${project.id}`);
        } catch (error) {
            console.error('Error creating project:', error);
        } finally {
            setIsCreating(false);
        }
    };

    const getProjectProgress = (project: Project) => {
        if (!project.deliverables) return 0;
        const completed = project.deliverables.filter((d) => d.status === 'completed').length;
        return Math.round((completed / project.deliverables.length) * 100);
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-primary-main)' }}>
            <Header />

            <div style={{ padding: 'var(--spacing-xl)' }}>
                {isLoading ? (
                    <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
                        <Spinner large />
                    </div>
                ) : (
                    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                        {/* Header */}
                        <div className="flex items-center justify-between" style={{ marginBottom: 'var(--spacing-2xl)' }}>
                            <div>
                                <h1>Mis Proyectos</h1>
                                <p className="text-secondary" style={{ marginTop: 'var(--spacing-sm)' }}>
                                    {projects.length === 0
                                        ? 'Crea tu primer proyecto para organizar tus ideas con el Framework EDEN'
                                        : `${projects.length} ${projects.length === 1 ? 'proyecto activo' : 'proyectos activos'}`
                                    }
                                </p>
                            </div>
                            <Button onClick={() => setShowCreateModal(true)}>
                                <Plus size={20} style={{ marginRight: 'var(--spacing-xs)' }} />
                                Nuevo Proyecto
                            </Button>
                        </div>

                        {/* Projects Grid or Empty State */}
                        {projects.length === 0 ? (
                            <div className="text-center" style={{ marginTop: 'var(--spacing-2xl)', paddingTop: 'var(--spacing-2xl)' }}>
                                <div style={{
                                    display: 'inline-flex',
                                    padding: 'var(--spacing-xl)',
                                    backgroundColor: 'var(--color-primary-elevated)',
                                    borderRadius: '50%',
                                    marginBottom: 'var(--spacing-xl)',
                                }}>
                                    <FolderKanban size={64} color="var(--color-accent-green-main)" />
                                </div>
                                <h2 className="text-secondary">No tienes proyectos aún</h2>
                                <p className="text-muted" style={{ marginTop: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)', maxWidth: '500px', margin: '0 auto' }}>
                                    Cada proyecto incluye 7 niveles del Framework EDEN para guiarte desde la idea hasta el lanzamiento
                                </p>
                            </div>
                        ) : (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                                gap: 'var(--spacing-lg)',
                            }}>
                                {projects.map((project) => (
                                    <div
                                        key={project.id}
                                        className="card card-clickable"
                                        onClick={() => navigate(`/projects/${project.id}`)}
                                    >
                                        <div className="flex items-center gap-sm" style={{ marginBottom: 'var(--spacing-md)' }}>
                                            <FolderKanban size={24} color="var(--color-accent-green-main)" />
                                            <h3 className="text-ellipsis" style={{ flex: 1 }}>{project.name}</h3>
                                        </div>

                                        {project.description && (
                                            <p className="text-secondary caption" style={{
                                                marginBottom: 'var(--spacing-md)',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical'
                                            }}>
                                                {project.description}
                                            </p>
                                        )}

                                        {/* Progress */}
                                        <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                            <div className="flex items-center justify-between caption text-muted" style={{ marginBottom: 'var(--spacing-xs)' }}>
                                                <span>Progreso EDEN</span>
                                                <span>{getProjectProgress(project)}%</span>
                                            </div>
                                            <div style={{
                                                height: '6px',
                                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                                borderRadius: 'var(--radius-small)',
                                                overflow: 'hidden',
                                            }}>
                                                <div style={{
                                                    height: '100%',
                                                    width: `${getProjectProgress(project)}%`,
                                                    backgroundColor: 'var(--color-accent-green-main)',
                                                    borderRadius: 'var(--radius-small)',
                                                    transition: 'width var(--duration-normal) var(--easing)',
                                                }} />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-xs caption text-muted">
                                            <Clock size={14} />
                                            {new Date(project.updated_at).toLocaleDateString('es-ES', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Create Project Modal */}
            {showCreateModal && (
                <>
                    <div
                        style={{
                            position: 'fixed',
                            inset: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            zIndex: 999,
                        }}
                        onClick={() => !isCreating && setShowCreateModal(false)}
                    />
                    <div
                        style={{
                            position: 'fixed',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            zIndex: 1000,
                        }}
                    >
                        <div className="card" style={{ minWidth: '500px' }}>
                            <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Nuevo Proyecto</h2>

                            <Input
                                label="Nombre del Proyecto"
                                value={newProject.name}
                                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                                placeholder="Mi Startup SaaS"
                                required
                                style={{ marginBottom: 'var(--spacing-md)' }}
                            />

                            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                <label className="input-label">Descripción (opcional)</label>
                                <textarea
                                    value={newProject.description}
                                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                    placeholder="Una plataforma para..."
                                    className="input textarea"
                                    style={{ minHeight: '100px' }}
                                />
                            </div>

                            <div className="flex gap-sm justify-end">
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    disabled={isCreating}
                                    className="btn btn-ghost"
                                >
                                    Cancelar
                                </button>
                                <Button onClick={handleCreateProject} disabled={!newProject.name.trim() || isCreating}>
                                    {isCreating ? 'Creando...' : 'Crear Proyecto'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
