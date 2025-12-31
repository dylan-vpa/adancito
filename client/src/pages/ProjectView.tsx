import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit2, Archive, Trash2, Plus, MessageSquare, Check, X, Lock, FileText, Download } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { StepsTimeline } from '../components/projects/StepsTimeline';
import { apiClient } from '../services/api';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Spinner } from '../components/common/Spinner';
import { Modal } from '../components/common/Modal'; // Import Modal
import type { Project, ProjectDeliverable } from '../types';

interface Attachment {
    title: string;
    content: string;
    date: string;
    chatId: string;
}

export function ProjectView() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [attachments, setAttachments] = useState<Attachment[]>([]);

    // Modal States
    const [showRenameModal, setShowRenameModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [isRenaming, setIsRenaming] = useState(false);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [showArchiveModal, setShowArchiveModal] = useState(false);
    const [isArchiving, setIsArchiving] = useState(false);

    useEffect(() => {
        if (id) loadProject();
    }, [id]);

    const loadProject = async () => {
        try {
            const data = await apiClient.getProject(id!);
            setProject(data);
            setNewName(data.name);
            loadAttachments(data);
        } catch (error) {
            console.error('Error loading project:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadAttachments = async (projectData: Project) => {
        if (!projectData.deliverables) return;

        const completedDeliverables = projectData.deliverables.filter(d => d.status === 'completed' && d.chat_id);
        const newAttachments: Attachment[] = [];

        for (const deliverable of completedDeliverables) {
            if (!deliverable.chat_id) continue;
            try {
                const messages = await apiClient.getChatMessages(deliverable.chat_id);
                const deliverableMsg = messages.reverse().find(m =>
                    m.deliverableReady ||
                    m.content.includes('"deliverable_ready": true') ||
                    m.content.includes('"deliverable_ready":true')
                );

                if (deliverableMsg) {
                    const jsonMatch = deliverableMsg.content.match(/```json\s*(\{[\s\S]*?"deliverable_ready":\s*true[\s\S]*?\})\s*```/);
                    let content = deliverableMsg.content;
                    let title = deliverable.title;

                    if (jsonMatch) {
                        try {
                            const parsed = JSON.parse(jsonMatch[1]);
                            if (parsed.deliverable_content) content = parsed.deliverable_content;
                            if (parsed.deliverable_title) title = parsed.deliverable_title;
                        } catch (e) {
                            console.warn('Failed to parse deliverable JSON', e);
                        }
                    }

                    // Clean content if needed (remove JSON block)
                    content = content.replace(/```json\s*\{[\s\S]*?"deliverable_ready":\s*true[\s\S]*?\}\s*```/g, '').trim();

                    newAttachments.push({
                        title,
                        content,
                        date: deliverableMsg.created_at,
                        chatId: deliverable.chat_id
                    });
                }
            } catch (err) {
                console.error(`Failed to load messages for chat ${deliverable.chat_id}`, err);
            }
        }
        setAttachments(newAttachments);
    };

    const handleDownloadInternal = async (title: string, content: string, chatId: string) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/deliverables/generate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title, content, chatId }),
            });

            if (!response.ok) throw new Error('Download failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${title}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Download error:', error);
            alert('Error al descargar el documento.');
        }
    };

    // --- Action Handlers ---

    const handleRenameSubmit = async () => {
        if (!newName.trim() || !id || isRenaming) return;
        setIsRenaming(true);

        try {
            await apiClient.updateProject(id, { name: newName });
            setProject(prev => prev ? { ...prev, name: newName } : null);
            setShowRenameModal(false);
        } catch (error) {
            console.error('Error updating project name:', error);
        } finally {
            setIsRenaming(false);
        }
    };

    const handleArchiveSubmit = async () => {
        if (!id || isArchiving) return;
        setIsArchiving(true);
        try {
            await apiClient.updateProject(id, { status: 'archived' });
            navigate('/dashboard');
        } catch (error) {
            console.error('Error archiving project:', error);
        } finally {
            setIsArchiving(false);
        }
    };

    const handleDeleteSubmit = async () => {
        if (!id || isDeleting) return;
        setIsDeleting(true);
        try {
            await apiClient.deleteProject(id);
            navigate('/dashboard');
        } catch (error) {
            console.error('Error deleting project:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleCreateChatForStep = async (deliverable: ProjectDeliverable) => {
        try {
            const chat = await apiClient.createChatSession(`${deliverable.eden_level || deliverable.title}`);
            await apiClient.updateDeliverable(deliverable.id, {
                status: deliverable.status === 'pending' ? 'in_progress' : deliverable.status,
                chat_id: chat.id
            });
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
        if (deliverable.step_number === 1) return true;
        const previousDeliverable = project.deliverables.find(
            d => d.step_number === deliverable.step_number - 1
        );
        return previousDeliverable?.status === 'completed';
    };

    const handleDeliverableClick = (deliverable: ProjectDeliverable) => {
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
                                <div className="flex items-center gap-md">
                                    <h1>{project.name}</h1>
                                    <button
                                        className="btn btn-ghost"
                                        onClick={() => setShowRenameModal(true)}
                                        style={{ padding: 'var(--spacing-xs)' }}
                                        title="Editar nombre"
                                    >
                                        <Edit2 size={20} />
                                    </button>
                                </div>
                                {project.description && (
                                    <p className="text-secondary" style={{ marginTop: 'var(--spacing-sm)' }}>
                                        {project.description}
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-sm">
                                <button
                                    className="btn btn-ghost"
                                    onClick={() => setShowArchiveModal(true)}
                                    title="Archivar"
                                    style={{ padding: 'var(--spacing-xs)' }}
                                >
                                    <Archive size={20} />
                                </button>
                                <button
                                    className="btn btn-ghost"
                                    onClick={() => setShowDeleteModal(true)}
                                    title="Eliminar"
                                    style={{ padding: 'var(--spacing-xs)', color: 'var(--color-feedback-error)' }}
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Steps Timeline */}
                    {project.deliverables && project.deliverables.length > 0 && (
                        <div className="card" style={{ marginBottom: 'var(--spacing-xl)' }}>
                            <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Framework EDEN</h2>
                            <StepsTimeline
                                deliverables={project.deliverables}
                                onDeliverableClick={handleDeliverableClick}
                                isDeliverableAccessible={isDeliverableAccessible}
                            />
                        </div>
                    )}

                    {/* Deliverables List */}
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
                                                    <span className="caption text-muted flex items-center gap-xs">
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
                                                    Iniciar chat
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Attachments */}
                    {attachments.length > 0 && (
                        <div className="card" style={{ marginTop: 'var(--spacing-xl)' }}>
                            <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Archivos del Proyecto</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                                {attachments.map((att, index) => (
                                    <div
                                        key={index}
                                        className="relative overflow-hidden cursor-pointer group transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg"
                                        style={{
                                            background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
                                            backdropFilter: 'blur(10px)',
                                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                                            borderRadius: '16px',
                                            padding: '16px',
                                            border: '1px solid rgba(255, 255, 255, 0.1)'
                                        }}
                                        onClick={() => handleDownloadInternal(att.title, att.content, att.chatId)}
                                    >
                                        <div className="flex items-center gap-4 relative z-10">
                                            <div className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center"
                                                style={{
                                                    background: 'linear-gradient(135deg, rgba(158, 200, 179, 0.2) 0%, rgba(158, 200, 179, 0.05) 100%)',
                                                    border: '1px solid rgba(158, 200, 179, 0.2)'
                                                }}
                                            >
                                                <FileText size={24} className="text-accent-green" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-semibold text-white truncate group-hover:text-accent-green transition-colors">
                                                    {att.title}
                                                </h4>
                                                <p className="text-xs text-secondary mt-0.5">
                                                    Generado el {new Date(att.date).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-white/5 group-hover:bg-accent-green group-hover:text-primary-main transition-all duration-300">
                                                <Download size={16} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Rename Modal */}
            <Modal
                isOpen={showRenameModal}
                onClose={() => !isRenaming && setShowRenameModal(false)}
                title="Renombrar Proyecto"
                type="default"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setShowRenameModal(false)} disabled={isRenaming}>
                            Cancelar
                        </Button>
                        <Button onClick={handleRenameSubmit} disabled={!newName.trim() || isRenaming}>
                            {isRenaming ? <div className="spinner" /> : 'Guardar Cambios'}
                        </Button>
                    </>
                }
            >
                <div>
                    <Input
                        label="Nuevo Nombre"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Ej. Mi Proyecto Innovador"
                        autoFocus
                    />
                </div>
            </Modal>

            {/* Archive Confirmation Modal */}
            <Modal
                isOpen={showArchiveModal}
                onClose={() => !isArchiving && setShowArchiveModal(false)}
                title="Archivar Proyecto"
                type="info"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setShowArchiveModal(false)} disabled={isArchiving}>
                            Cancelar
                        </Button>
                        <Button onClick={handleArchiveSubmit} disabled={isArchiving}>
                            {isArchiving ? <div className="spinner" /> : 'Sí, Archivar'}
                        </Button>
                    </>
                }
            >
                <p>
                    El proyecto <strong>{project.name}</strong> se moverá a la sección de "Archivados".
                    Podrás restaurarlo en cualquier momento.
                </p>
                <p className="text-secondary mt-2">¿Estás seguro de continuar?</p>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => !isDeleting && setShowDeleteModal(false)}
                title="Eliminar Proyecto"
                type="danger"
                footer={
                    <>
                        <Button variant="ghost" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>
                            Cancelar
                        </Button>
                        <Button
                            style={{ backgroundColor: 'var(--color-feedback-error)' }}
                            onClick={handleDeleteSubmit}
                            disabled={isDeleting}
                        >
                            {isDeleting ? <div className="spinner" /> : 'Eliminar Permanentemente'}
                        </Button>
                    </>
                }
            >
                <p>
                    Estás a punto de eliminar <strong>{project.name}</strong>.
                    <br /><br />
                    Esta acción es <strong>irreversible</strong> y eliminará todos los chats, entregables y archivos asociados.
                </p>
            </Modal>
        </div>
    );
}
