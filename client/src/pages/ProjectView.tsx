import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit2, Archive, Trash2, Plus, MessageSquare, Check, X, Lock } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { StepsTimeline } from '../components/projects/StepsTimeline';
import { apiClient } from '../services/api';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Spinner } from '../components/common/Spinner';
import type { Project, ProjectDeliverable } from '../types';

export function ProjectView() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState('');

    useEffect(() => {
        if (id) loadProject();
    }, [id]);

    const loadProject = async () => {
        try {
            const data = await apiClient.getProject(id!);
            setProject(data);
            setEditedName(data.name);
        } catch (error) {
            console.error('Error loading project:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveName = async () => {
        if (!editedName.trim() || !id) return;

        try {
            await apiClient.updateProject(id, { name: editedName });
            setProject({ ...project!, name: editedName });
            setIsEditingName(false);
        } catch (error) {
            console.error('Error updating project name:', error);
        }
    };

    const handleArchive = async () => {
        if (!id) return;
        try {
            await apiClient.updateProject(id, { status: 'archived' });
            navigate('/dashboard');
        } catch (error) {
            console.error('Error archiving project:', error);
        }
    };

    const handleDelete = async () => {
        if (!id || !confirm('¿Eliminar permanentemente este proyecto y todos sus chats?')) return;
        try {
            await apiClient.deleteProject(id);
            navigate('/dashboard');
        } catch (error) {
            console.error('Error deleting project:', error);
        }
    };

    const handleCreateChatForStep = async (deliverable: ProjectDeliverable) => {
        try {
            const chat = await apiClient.createChatSession(`${deliverable.eden_level || deliverable.title}`);
            // Associate chat with deliverable
            await apiClient.updateDeliverable(deliverable.id, {
                status: deliverable.status === 'pending' ? 'in_progress' : deliverable.status,
                chat_id: chat.id
            });
            // Link chat to project
            await apiClient.updateChatSession(chat.id, { title: `${project?.name} - ${deliverable.title}` });
            navigate(`/chat/${chat.id}`, {
                state: {
                    deliverable: {
                        eden_level: deliverable.eden_level,
                        description: deliverable.description,
                        title: deliverable.title,
                    }
                }
            });
        } catch (error) {
            console.error('Error creating chat:', error);
        }
    };

    const isDeliverableAccessible = (deliverable: ProjectDeliverable): boolean => {
        if (!project?.deliverables) return false;

        // First step is always accessible
        if (deliverable.step_number === 1) return true;

        // Find the previous deliverable
        const previousDeliverable = project.deliverables.find(
            d => d.step_number === deliverable.step_number - 1
        );

        // Previous step must be completed
        return previousDeliverable?.status === 'completed';
    };

    const handleDeliverableClick = (deliverable: ProjectDeliverable) => {
        // Check if deliverable is accessible
        if (!isDeliverableAccessible(deliverable)) {
            alert('Debes completar el paso anterior primero');
            return;
        }

        if (deliverable.chat_id) {
            navigate(`/chat/${deliverable.chat_id}`, {
                state: {
                    deliverable: {
                        eden_level: deliverable.eden_level,
                        description: deliverable.description,
                        title: deliverable.title,
                    }
                }
            });
        } else {
            handleCreateChatForStep(deliverable);
        }
    };

    if (isLoading) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-primary-main)' }}>
                <Header />
                <div className="flex items-center justify-center" style={{ height: '80vh' }}>
                    <Spinner large />
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-primary-main)' }}>
                <Header />
                <div style={{ padding: 'var(--spacing-xl)' }}>
                    <h2>Proyecto no encontrado</h2>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-primary-main)' }}>
            <Header />

            <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--spacing-xl)' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    {/* Header */}
                    <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
                        <div className="flex items-center justify-between">
                            <div style={{ flex: 1 }}>
                                {isEditingName ? (
                                    <div className="flex items-center gap-sm">
                                        <Input
                                            value={editedName}
                                            onChange={(e) => setEditedName(e.target.value)}
                                            style={{ maxWidth: '500px' }}
                                            autoFocus
                                        />
                                        <button className="btn btn-ghost" onClick={handleSaveName} style={{ padding: 'var(--spacing-xs)' }}>
                                            <Check size={20} />
                                        </button>
                                        <button className="btn btn-ghost" onClick={() => setIsEditingName(false)} style={{ padding: 'var(--spacing-xs)' }}>
                                            <X size={20} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-md">
                                        <h1>{project.name}</h1>
                                        <button
                                            className="btn btn-ghost"
                                            onClick={() => setIsEditingName(true)}
                                            style={{ padding: 'var(--spacing-xs)' }}
                                        >
                                            <Edit2 size={20} />
                                        </button>
                                    </div>
                                )}
                                {project.description && (
                                    <p className="text-secondary" style={{ marginTop: 'var(--spacing-sm)' }}>
                                        {project.description}
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-sm">
                                <button className="btn btn-ghost" onClick={handleArchive} title="Archivar" style={{ padding: 'var(--spacing-xs)' }}>
                                    <Archive size={20} />
                                </button>
                                <button className="btn btn-ghost" onClick={handleDelete} title="Eliminar" style={{ padding: 'var(--spacing-xs)' }}>
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Steps Timeline */}
                    {project.deliverables && project.deliverables.length > 0 && (
                        <div className="card" style={{ marginBottom: 'var(--spacing-xl)' }}>
                            <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Framework EDEN</h2>
                            <p className="text-secondary caption" style={{ marginBottom: 'var(--spacing-xl)' }}>
                                Haz clic en un paso para empezar a trabajar en él (debes completar los pasos en orden)
                            </p>
                            <StepsTimeline
                                deliverables={project.deliverables}
                                onDeliverableClick={handleDeliverableClick}
                                isDeliverableAccessible={isDeliverableAccessible}
                            />
                        </div>
                    )}

                    {/* Deliverables List with Chats */}
                    <div className="card">
                        <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Entregables</h2>

                        {project.deliverables?.map((deliverable) => {
                            const isAccessible = isDeliverableAccessible(deliverable);

                            return (
                                <div
                                    key={deliverable.id}
                                    style={{
                                        padding: 'var(--spacing-md)',
                                        marginBottom: 'var(--spacing-md)',
                                        backgroundColor: 'var(--color-primary-elevated)',
                                        borderRadius: 'var(--radius-medium)',
                                        border: `1px solid ${deliverable.status === 'completed' ? 'var(--color-accent-green-main)' : 'rgba(255, 255, 255, 0.04)'}`,
                                        opacity: isAccessible ? 1 : 0.5,
                                    }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div style={{ flex: 1 }}>
                                            <div className="flex items-center gap-md" style={{ marginBottom: 'var(--spacing-xs)' }}>
                                                <h3>{deliverable.title}</h3>
                                                {!isAccessible && deliverable.status === 'pending' && (
                                                    <span className="caption text-muted flex items-center gap-xs" style={{ fontSize: '12px' }}>
                                                        <Lock size={12} /> Bloqueado
                                                    </span>
                                                )}
                                                <span
                                                    className="badge"
                                                    style={{
                                                        backgroundColor: deliverable.status === 'completed' ? 'var(--color-accent-green-main)' :
                                                            deliverable.status === 'in_progress' ? 'var(--color-accent-green-strong)' :
                                                                'var(--color-neutral-gray-600)',
                                                        color: deliverable.status === 'pending' ? 'var(--color-neutral-gray-300)' : 'var(--color-primary-main)',
                                                    }}
                                                >
                                                    {deliverable.status === 'completed' ? 'Completado' :
                                                        deliverable.status === 'in_progress' ? 'En Progreso' : 'Pendiente'}
                                                </span>
                                            </div>
                                            {deliverable.description && (
                                                <p className="caption text-secondary">{deliverable.description}</p>
                                            )}
                                        </div>

                                        <Button
                                            onClick={() => handleDeliverableClick(deliverable)}
                                            disabled={!isAccessible}
                                            style={{ minWidth: '140px' }}
                                        >
                                            {deliverable.chat_id ? (
                                                <>
                                                    <MessageSquare size={18} style={{ marginRight: 'var(--spacing-xs)' }} />
                                                    Ver Chat
                                                </>
                                            ) : (
                                                <>
                                                    <Plus size={18} style={{ marginRight: 'var(--spacing-xs)' }} />
                                                    Nuevo Chat
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
