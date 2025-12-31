import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, Compass, Target, Building2, Rocket, TrendingUp, RefreshCw, Crown, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../services/api';
import { MessageBubble } from '../components/chat/MessageBubble';
import { ChatInput } from '../components/chat/ChatInput';
import { Spinner } from '../components/common/Spinner';
import { PreviewSidebar } from '../components/layout/PreviewSidebar';
import type { Message, ModerationInfo } from '../types';

export function Chat() {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [chatTitle, setChatTitle] = useState('');
    const [deliverableInfo, setDeliverableInfo] = useState<{ level?: string; description?: string } | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!id) return;

        const loadChat = async () => {
            try {
                const [session, chatMessages] = await Promise.all([
                    apiClient.getChatSession(id),
                    apiClient.getChatMessages(id),
                ]);
                setChatTitle(session.title);
                setMessages(chatMessages);

                // Get deliverable info from location state if available
                const state = location.state as {
                    initialMessage?: string;
                    initialModel?: string;
                    deliverable?: { eden_level?: string; description?: string; title?: string };
                };

                if (state?.deliverable) {
                    setDeliverableInfo({
                        level: state.deliverable.eden_level,
                        description: state.deliverable.description || state.deliverable.title,
                    });
                }

                // If chat is empty, generate welcome message
                if (chatMessages.length === 0) {
                    // Check if there's an initial user message (manual override)
                    if (state?.initialMessage) {
                        setTimeout(() => {
                            handleSendMessage(state.initialMessage!, state.initialModel);
                        }, 100);
                    } else {
                        // Otherwise, generate AI welcome message
                        try {
                            setIsLoading(true); // Keep loading while generating welcome
                            const welcome = await apiClient.generateWelcomeMessage(id);

                            // Add welcome message to state
                            const welcomeMsg: Message = {
                                id: welcome.messageId,
                                session_id: id,
                                user_id: 'system', // or assistant user id
                                role: 'assistant',
                                content: welcome.message,
                                created_at: new Date().toISOString()
                            };
                            setMessages([welcomeMsg]);
                        } catch (err) {
                            console.error('Error generating welcome message:', err);
                        }
                    }
                }
            } catch (error) {
                console.error('Error loading chat:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadChat();
    }, [id]);

    const handleSendMessage = async (content: string, model?: string) => {
        if (!id || isSending) return;
        setIsSending(true);

        const userMessage: Message = {
            id: Date.now().toString(),
            session_id: id,
            user_id: user!.id,
            role: 'user',
            content,
            created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMessage]);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ session_id: id, content, model }),
            });

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let assistantMessage: Message | null = null;
            let moderationInfo: ModerationInfo | null = null;

            if (reader) {
                let buffer = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    buffer += chunk;

                    const parts = buffer.split('\n\n');
                    // Keep the last part in the buffer as it might be incomplete
                    buffer = parts.pop() || '';

                    for (const part of parts) {
                        if (!part.trim() || !part.startsWith('event:')) continue;

                        const lineIdx = part.indexOf('\n');
                        if (lineIdx === -1) continue;

                        const eventLine = part.substring(0, lineIdx);
                        const dataLine = part.substring(lineIdx + 1);

                        const event = eventLine.replace('event: ', '').trim();
                        const dataStr = dataLine.replace('data: ', '').trim();

                        if (!dataStr) continue;

                        try {
                            const data = JSON.parse(dataStr);

                            switch (event) {
                                case 'moderation_info':
                                    moderationInfo = data;
                                    break;
                                case 'assistant_chunk':
                                    // Initialize message if it doesn't exist yet
                                    if (!assistantMessage) {
                                        assistantMessage = {
                                            id: data.id || Date.now().toString(),
                                            session_id: id,
                                            user_id: user!.id,
                                            role: 'assistant',
                                            content: '',
                                            code_language: data.agent ? `AGENT:${data.agent}` : undefined,
                                            created_at: new Date().toISOString(),
                                            isStreaming: true,
                                            moderationInfo: moderationInfo || undefined,
                                        };
                                    }

                                    // Update content - filter out JSON deliverable blocks in real-time
                                    if (data.content) {
                                        assistantMessage.content += data.content;

                                        // Real-time JSON hiding: Check if we're in a JSON block
                                        // If content contains start of JSON block, truncate display there
                                        const jsonStartPatterns = ['```json\n{', '```json\r\n{', '```json{'];
                                        let jsonBlockStart = -1;

                                        for (const pattern of jsonStartPatterns) {
                                            const idx = assistantMessage.content.indexOf(pattern);
                                            if (idx !== -1 && (jsonBlockStart === -1 || idx < jsonBlockStart)) {
                                                jsonBlockStart = idx;
                                            }
                                        }

                                        // Also check for raw JSON starting with deliverable_ready
                                        if (jsonBlockStart === -1) {
                                            const rawJsonMatch = assistantMessage.content.match(/\{[\s\S]*?"deliverable_ready"/);
                                            if (rawJsonMatch && rawJsonMatch.index !== undefined) {
                                                jsonBlockStart = rawJsonMatch.index;
                                            }
                                        }

                                        // If JSON block detected, we'll hide it in the display
                                        // Store the full content but mark where to truncate for display
                                        if (jsonBlockStart !== -1) {
                                            (assistantMessage as any)._displayTruncateAt = jsonBlockStart;
                                        }
                                    }

                                    // Update streaming status logic
                                    // If we receive content, we are definitely streaming/active
                                    if (assistantMessage.content.length > 0) {
                                        assistantMessage.isStreaming = true;
                                    }
                                    // If backend forces thinking state
                                    if (data.isThinking === true) {
                                        assistantMessage.isStreaming = true; // "Thinking" is a streaming state
                                    }
                                    // If backend says thinking done, we still keep streaming true until 'done' event? 
                                    // Actually, usually we keep isStreaming=true until the specific 'done' event or 'assistant_message' event.

                                    // Safely update state
                                    setMessages((prev) => {
                                        const exists = prev.some(m => m.id === assistantMessage!.id);
                                        if (exists) {
                                            return prev.map(m => m.id === assistantMessage!.id ? { ...assistantMessage! } : m);
                                        }
                                        return [...prev, { ...assistantMessage! }];
                                    });
                                    break;
                                case 'deliverable_signal':
                                    if (assistantMessage) {
                                        assistantMessage.deliverableReady = true;
                                        if (data.deliverable_title) {
                                            let fname = data.deliverable_title;
                                            if (!fname.endsWith('.pdf') && !fname.endsWith('.zip')) {
                                                fname += '.pdf';
                                            }
                                            assistantMessage.deliverableFile = fname;
                                        }
                                        setMessages((prev) => [...prev.slice(0, -1), { ...assistantMessage! }]);
                                    }
                                    break;
                                case 'assistant_message':
                                    if (assistantMessage) {
                                        assistantMessage.content = data.content;
                                        assistantMessage.isStreaming = false;
                                        setMessages((prev) => [...prev.slice(0, -1), { ...assistantMessage! }]);
                                    }
                                    break;
                                case 'done':
                                    if (assistantMessage) {
                                        assistantMessage.isStreaming = false;
                                        setMessages((prev) => [...prev.slice(0, -1), { ...assistantMessage! }]);
                                    }
                                    return; // Exit loop
                            }
                        } catch (e) {
                            console.warn('Error parsing SSE data:', e);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setIsSending(false);
        }
    };

    const [previewHtml, setPreviewHtml] = useState('');
    const [showPreview, setShowPreview] = useState(false);

    const handlePreview = (html: string) => {
        setPreviewHtml(html);
        setShowPreview(true);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center" style={{ minHeight: '100vh' }}>
                <Spinner large />
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-primary-main)' }}>
            <div className="flex flex-col" style={{ height: '100vh' }}>
                {/* Simple header - back button and title */}
                <div style={{ padding: 'var(--spacing-md) var(--spacing-xl)' }}>
                    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                        <div className="flex items-center gap-md">
                            <button
                                className="btn btn-ghost"
                                onClick={() => navigate('/dashboard')}
                                style={{ padding: 'var(--spacing-xs)' }}
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <h2 className="text-ellipsis" style={{ maxWidth: '600px' }}>{chatTitle}</h2>
                        </div>
                    </div>
                </div>

                {/* Messages - seamless, no borders */}
                <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--spacing-md) var(--spacing-xl)' }}>
                    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                        {messages.length === 0 ? (
                            <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
                                <div className="text-center" style={{ maxWidth: '700px', padding: 'var(--spacing-2xl)' }}>
                                    {/* Icon based on EDEN level */}
                                    {(() => {
                                        const getEdenIcon = () => {
                                            const level = deliverableInfo?.level?.toLowerCase() || '';
                                            if (level.includes('exploración') || level.includes('e -')) {
                                                return <Compass size={64} strokeWidth={1.5} />;
                                            } else if (level.includes('definición') || level.includes('d -')) {
                                                return <Target size={64} strokeWidth={1.5} />;
                                            } else if (level.includes('estructuración')) {
                                                return <Building2 size={64} strokeWidth={1.5} />;
                                            } else if (level.includes('navegación') || level.includes('n -')) {
                                                return <Rocket size={64} strokeWidth={1.5} />;
                                            } else if (level.includes('escalamiento')) {
                                                return <TrendingUp size={64} strokeWidth={1.5} />;
                                            } else if (level.includes('desarrollo continuo')) {
                                                return <RefreshCw size={64} strokeWidth={1.5} />;
                                            } else if (level.includes('maestro')) {
                                                return <Crown size={64} strokeWidth={1.5} />;
                                            }
                                            return <Sparkles size={64} strokeWidth={1.5} />;
                                        };

                                        return (
                                            <div style={{
                                                display: 'inline-flex',
                                                padding: 'var(--spacing-2xl)',
                                                background: 'radial-gradient(circle, rgba(75, 224, 152, 0.15) 0%, transparent 70%)',
                                                borderRadius: '50%',
                                                marginBottom: 'var(--spacing-2xl)',
                                                color: 'var(--color-accent-green-main)',
                                            }}>
                                                {getEdenIcon()}
                                            </div>
                                        );
                                    })()}

                                    <h1 style={{
                                        marginBottom: 'var(--spacing-lg)',
                                        background: 'linear-gradient(135deg, var(--color-text-primary) 0%, var(--color-accent-green-soft) 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                    }}>
                                        {deliverableInfo?.level || 'Comienza tu conversación'}
                                    </h1>

                                    <p className="text-secondary" style={{
                                        fontSize: 'var(--font-size-h3)',
                                        lineHeight: '1.6',
                                        marginBottom: 'var(--spacing-xl)',
                                    }}>
                                        {deliverableInfo?.description || 'Escribe tu primera pregunta para comenzar'}
                                    </p>

                                    <div style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 'var(--spacing-xs)',
                                        padding: 'var(--spacing-sm) var(--spacing-md)',
                                        backgroundColor: 'rgba(75, 224, 152, 0.1)',
                                        borderRadius: 'var(--radius-medium)',
                                        border: '1px solid rgba(75, 224, 152, 0.2)',
                                    }}>
                                        <div style={{
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            backgroundColor: 'var(--color-accent-green-main)',
                                            animation: 'pulse 2s infinite',
                                        }} />
                                        <span className="caption" style={{ color: 'var(--color-accent-green-soft)' }}>
                                            IA lista para ayudarte
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            messages.map((message) => (
                                <MessageBubble
                                    key={message.id}
                                    message={message}
                                    onPreview={handlePreview}
                                    chatId={id}
                                />
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input - seamless, no top border */}
                <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%', padding: '0 var(--spacing-xl) var(--spacing-md)' }}>
                    <ChatInput onSendMessage={handleSendMessage} disabled={isSending} />
                </div>
            </div>

            <PreviewSidebar
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
                htmlCode={previewHtml}
            />
        </div>
    );
}
