import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArchiveRestore, Trash2, Clock } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { apiClient } from '../services/api';
import { Spinner } from '../components/common/Spinner';
import type { ChatSession } from '../types';

export function Archived() {
    const navigate = useNavigate();
    const [archivedChats, setArchivedChats] = useState<ChatSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadArchivedChats();
    }, []);

    const loadArchivedChats = async () => {
        try {
            const sessions = await apiClient.getChatSessions();
            setArchivedChats(sessions.filter((s) => s.status === 'archived'));
        } catch (error) {
            console.error('Error loading archived chats:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRestore = async (chatId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await apiClient.updateChatSession(chatId, { status: 'active' });
            setArchivedChats(archivedChats.filter((chat) => chat.id !== chatId));
        } catch (error) {
            console.error('Error restoring chat:', error);
        }
    };

    const handleDelete = async (chatId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('¿Eliminar permanentemente este chat?')) return;
        try {
            await apiClient.deleteChatSession(chatId);
            setArchivedChats(archivedChats.filter((chat) => chat.id !== chatId));
        } catch (error) {
            console.error('Error deleting chat:', error);
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-primary-main)' }}>
            <Header />

            <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--spacing-xl)' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <h1 style={{ marginBottom: 'var(--spacing-md)' }}>Chats Archivados</h1>
                    <p className="text-secondary" style={{ marginBottom: 'var(--spacing-2xl)' }}>
                        {archivedChats.length} {archivedChats.length === 1 ? 'chat archivado' : 'chats archivados'}
                    </p>

                    {isLoading ? (
                        <div className="flex items-center justify-center" style={{ marginTop: 'var(--spacing-2xl)' }}>
                            <Spinner large />
                        </div>
                    ) : archivedChats.length === 0 ? (
                        <div className="text-center text-secondary" style={{ marginTop: 'var(--spacing-2xl)' }}>
                            <h3>No hay chats archivados</h3>
                            <p style={{ marginTop: 'var(--spacing-md)' }}>
                                Los chats que archives aparecerán aquí
                            </p>
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                            gap: 'var(--spacing-lg)',
                        }}>
                            {archivedChats.map((chat) => (
                                <div
                                    key={chat.id}
                                    className="card card-clickable"
                                    onClick={() => navigate(`/chat/${chat.id}`)}
                                >
                                    <div className="flex items-center justify-between" style={{ marginBottom: 'var(--spacing-md)' }}>
                                        <h3 className="text-ellipsis" style={{ flex: 1 }}>{chat.title}</h3>
                                    </div>
                                    <div className="flex items-center gap-xs caption text-muted" style={{ marginBottom: 'var(--spacing-md)' }}>
                                        <Clock size={14} />
                                        {new Date(chat.last_active).toLocaleDateString('es-ES', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </div>
                                    <div className="flex gap-sm">
                                        <button
                                            onClick={(e) => handleRestore(chat.id, e)}
                                            className="btn btn-secondary"
                                            style={{ flex: 1, fontSize: 'var(--font-size-caption)' }}
                                        >
                                            <ArchiveRestore size={16} style={{ marginRight: 'var(--spacing-xs)' }} />
                                            Restaurar
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(chat.id, e)}
                                            className="btn btn-ghost"
                                            style={{ padding: 'var(--spacing-xs)', color: 'var(--color-feedback-error)' }}
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
        </div>
    );
}
