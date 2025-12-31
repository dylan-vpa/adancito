import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FolderKanban, Plus, Clock } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { apiClient } from '../services/api';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Spinner } from '../components/common/Spinner';
import { OnboardingModal } from '../components/onboarding/OnboardingModal';
import type { Project } from '../types';

export function Dashboard() {
    const navigate = useNavigate();
    const location = useLocation();
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [newProject, setNewProject] = useState({ name: '', description: '' });
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        loadProjects();
        if (location.state && location.state.showOnboarding) {
            setShowOnboarding(true);
            // Clear state so it doesn't show on refresh (optional, but good practice)
            window.history.replaceState({}, document.title);
        }
    }, [location]);

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
        <Layout>
            <div className="container" style={{ paddingTop: 'var(--spacing-xl)', paddingBottom: 'var(--spacing-xl)' }}>
                {isLoading ? (
                    <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
                        <Spinner large />
                    </div>
                ) : (
                    <>
                        {/* Header Section */}
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
                            <div className="flex-col items-center justify-center text-center" style={{ padding: 'var(--spacing-2xl)', minHeight: '400px' }}>
                                <div style={{
                                    display: 'inline-flex',
                                    padding: 'var(--spacing-xl)',
                                    borderRadius: '50%',
                                    marginBottom: 'var(--spacing-xl)',
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(255, 255, 255, 0.05)'
                                }}>
                                    <FolderKanban size={64} color="var(--color-neutral-500)" style={{ opacity: 0.5 }} />
                                </div>
                                <h2 className="text-secondary" style={{ opacity: 0.7 }}>No tienes proyectos aún</h2>
                                <p className="text-muted" style={{ marginTop: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)', maxWidth: '500px' }}>
                                    Crea tu primer proyecto para comenzar a trabajar con el Framework EDEN.
                                </p>
                                <Button variant="secondary" onClick={() => setShowCreateModal(true)}>
                                    Crear mi primer proyecto
                                </Button>
                            </div>
                        ) : (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                                gap: 'var(--spacing-lg)',
                            }}>
                                {projects.map((project) => (
                                    <div
                                        key={project.id}
                                        className="flex-col transition-all duration-200 hover:translate-y-[-2px]"
                                        style={{
                                            height: '100%',
                                            background: 'transparent',
                                            border: '1px solid rgba(255,255,255,0.05)',
                                            borderRadius: '16px',
                                            padding: '24px',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => navigate(`/projects/${project.id}`)}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                                        }}
                                    >
                                        <div className="flex items-center gap-sm" style={{ marginBottom: 'var(--spacing-md)' }}>
                                            <div style={{
                                                padding: '10px',
                                                borderRadius: '50%', // Circle like Login/Register
                                                background: 'rgba(255, 255, 255, 0.08)', // Grayish
                                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}>
                                                <FolderKanban size={20} color="#FFFFFF" />
                                            </div>
                                            <h3 className="text-ellipsis" style={{ flex: 1, fontSize: '16px' }}>{project.name}</h3>
                                        </div>

                                        {project.description && (
                                            <p className="text-secondary caption" style={{
                                                marginBottom: 'var(--spacing-lg)',
                                                flex: 1,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 3,
                                                WebkitBoxOrient: 'vertical'
                                            }}>
                                                {project.description}
                                            </p>
                                        )}

                                        {/* Progress */}
                                        <div style={{ marginTop: 'auto' }}>
                                            <div className="flex items-center justify-between caption text-muted" style={{ marginBottom: 'var(--spacing-xs)' }}>
                                                <span>Progreso EDEN</span>
                                                <span className="text-accent">{getProjectProgress(project)}%</span>
                                            </div>
                                            <div style={{
                                                height: '4px',
                                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                                borderRadius: 'var(--radius-pill)',
                                                overflow: 'hidden',
                                            }}>
                                                <div style={{
                                                    height: '100%',
                                                    width: `${getProjectProgress(project)}%`,
                                                    background: 'var(--gradient-accent-soft)',
                                                    borderRadius: 'var(--radius-pill)',
                                                }} />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-xs caption text-muted" style={{ marginTop: 'var(--spacing-md)', paddingTop: 'var(--spacing-md)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                            <Clock size={12} />
                                            <span>Actualizado {new Date(project.updated_at).toLocaleDateString('es-ES', {
                                                month: 'short',
                                                day: 'numeric',
                                            })}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Create Project Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => !isCreating && setShowCreateModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()} style={{
                        maxWidth: '500px',
                        width: '100%',
                        padding: '32px',
                        background: 'var(--surface-glass-bg)',
                        border: 'var(--surface-glass-border)',
                        boxShadow: 'var(--shadow-soft)',
                        backdropFilter: 'blur(var(--surface-glass-blur))',
                        borderRadius: 'var(--radius-large)'
                    }}>
                        <h2 style={{ marginBottom: 'var(--spacing-lg)', textAlign: 'center' }}>Nuevo Proyecto</h2>

                        <div className="flex-col gap-md">
                            <Input
                                label="Nombre del Proyecto"
                                value={newProject.name}
                                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                                placeholder="Ej. Mi Nueva Startup"
                                autoFocus
                                required
                            />

                            <div>
                                <label className="input-label" style={{ marginBottom: 'var(--spacing-xs)', display: 'block' }}>Descripción (opcional)</label>
                                <textarea
                                    value={newProject.description}
                                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                    placeholder="¿De qué trata este proyecto?"
                                    className="input textarea"
                                    style={{ height: '120px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                                />
                            </div>
                        </div>

                        <div className="flex gap-sm justify-end" style={{ marginTop: 'var(--spacing-xl)' }}>
                            <Button
                                variant="ghost"
                                onClick={() => setShowCreateModal(false)}
                                disabled={isCreating}
                            >
                                Cancelar
                            </Button>
                            <Button onClick={handleCreateProject} disabled={!newProject.name.trim() || isCreating}>
                                {isCreating ? <div className="spinner" /> : 'Crear Proyecto'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Post-Registration Onboarding Modal */}
            {showOnboarding && (
                <OnboardingModal onClose={() => setShowOnboarding(false)} />
            )}
        </Layout>
    );
}
