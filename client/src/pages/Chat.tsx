import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, Compass, Target, Rocket, Sparkles } from 'lucide-react';
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
    const [mvpDeployStatus, setMvpDeployStatus] = useState<'idle' | 'deploying' | 'running' | 'error'>('idle');
    const [mvpPreviewUrl, setMvpPreviewUrl] = useState<string | null>(null);
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
    const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);

    // Expose for manual testing: window.setPreviewUrl('http://localhost:3000')
    useEffect(() => {
        (window as any).setPreviewUrl = setPreviewUrl;
    }, []);

    const handlePreview = (html: string) => {
        setPreviewHtml(html);
        setShowPreview(true);
    };

    // Layout & Resizing Logic
    const [previewWidth, setPreviewWidth] = useState(600);
    const [isResizing, setIsResizing] = useState(false);

    const startResize = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            const newWidth = window.innerWidth - e.clientX;
            // Min width 350px, Max width 70% of screen
            if (newWidth >= 350 && newWidth <= window.innerWidth * 0.7) {
                setPreviewWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isResizing]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center white-text" style={{ minHeight: '100vh', color: 'white' }}>
                <Spinner large />
            </div>
        );
    }

    // Theme Logic
    const getTheme = () => {
        const level = deliverableInfo?.level?.toLowerCase() || '';

        // Level 1: Exploración (The Pain) -> RED / WARM
        if (level.includes('nivel 1') || level.includes('exploración') || level.includes('dolor')) {
            return {
                gradient: 'var(--gradient-level-1)',
                accent: '#E07A7A', // Reddish
                textGradient: 'linear-gradient(135deg, #FFFFFF 0%, #E07A7A 100%)',
                icon: <Compass size={64} strokeWidth={1.5} />
            };
        }

        // Level 2: Definición (The Solution) -> ORANGE
        if (level.includes('nivel 2') || level.includes('definición') || level.includes('solución')) {
            return {
                gradient: 'var(--gradient-level-2)',
                accent: '#E57B30', // Orange
                textGradient: 'linear-gradient(135deg, #FFFFFF 0%, #E57B30 100%)',
                icon: <Target size={64} strokeWidth={1.5} />
            };
        }

        // Level 3: Estructuración (Business Plan) -> YELLOW / AMBER
        if (level.includes('nivel 3') || level.includes('estructuración') || level.includes('plan')) {
            return {
                gradient: 'var(--gradient-level-3)',
                accent: '#E5C07B', // Amber
                textGradient: 'linear-gradient(135deg, #FFFFFF 0%, #E5C07B 100%)',
                icon: <Sparkles size={64} strokeWidth={1.5} />
            };
        }

        // Level 4+: Navegación (MVP & Beyond) -> GREEN
        if (level.includes('nivel 4') || level.includes('navegación') || level.includes('mvp') || level.includes('nivel 5') || level.includes('nivel 6') || level.includes('nivel 7')) {
            return {
                gradient: 'var(--gradient-level-4)',
                accent: '#9EC8B3', // Green
                textGradient: 'linear-gradient(135deg, #FFFFFF 0%, #9EC8B3 100%)',
                icon: <Rocket size={64} strokeWidth={1.5} />
            };
        }

        // Default -> GREEN (Paradixe Brand)
        return {
            gradient: 'var(--gradient-primary)',
            accent: '#9EC8B3',
            textGradient: 'linear-gradient(135deg, #FFFFFF 0%, #9EC8B3 100%)',
            icon: <Sparkles size={64} strokeWidth={1.5} />
        };
    };

    const theme = getTheme();

    // MVP Deployment handler
    const handleDeployMVP = async (content: string) => {
        if (mvpDeployStatus === 'deploying') return;

        setMvpDeployStatus('deploying');
        setShowPreview(true); // Show the sidebar
        setPreviewHtml('<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#1a1a2e;color:white;font-family:system-ui"><div style="text-align:center"><h2>🚀 Construyendo MVP...</h2><p style="opacity:0.7">Esto puede tomar 2-5 minutos</p></div></div>');

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/mvp/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    content,
                    projectName: chatTitle || 'MVP Project',
                    chatId: id
                })
            });

            // SSE streaming response
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const events = buffer.split('\n\n');
                    buffer = events.pop() || ''; // Keep incomplete event in buffer

                    for (const event of events) {
                        if (!event.trim()) continue;

                        const lines = event.split('\n');
                        const eventLine = lines.find(l => l.startsWith('event:'));
                        const dataLine = lines.find(l => l.startsWith('data:'));

                        if (!eventLine || !dataLine) continue;

                        const eventType = eventLine.replace('event:', '').trim();
                        const dataStr = dataLine.replace('data:', '').trim();

                        try {
                            const data = JSON.parse(dataStr);

                            if (eventType === 'progress') {
                                // Update loading message with progress
                                setPreviewHtml(`<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#1a1a2e;color:white;font-family:system-ui"><div style="text-align:center"><h2>🚀 ${data.status}</h2><p style="opacity:0.7">Por favor espera...</p></div></div>`);
                            } else if (eventType === 'complete') {
                                console.log('[MVP] Complete:', data);
                                setMvpPreviewUrl(data.url);
                                setPreviewHtml(''); // Clear HTML to use URL
                                setMvpDeployStatus('running');
                            } else if (eventType === 'error') {
                                console.error('[MVP] Error:', data);
                                setPreviewHtml(`<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#2d1a1a;color:#ff6b6b;font-family:system-ui"><div style="text-align:center"><h2>❌ Error</h2><p>${data.error || 'Build failed'}</p></div></div>`);
                                setMvpDeployStatus('error');
                            }
                        } catch (e) {
                            console.error('[MVP] Parse error:', e, dataStr);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('MVP deployment error:', error);
            setPreviewHtml('<div style="display:flex;align-items:center;justify-content:center;height:100%;background:#2d1a1a;color:#ff6b6b;font-family:system-ui"><div style="text-align:center"><h2>❌ Error de conexión</h2></div></div>');
            setMvpDeployStatus('error');
        }
    };



    return (
        <div style={{ height: '100vh', background: theme.gradient, display: 'flex', overflow: 'hidden', transition: 'background 1s ease' }}>
            {/* Left Pane: Chat Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: '400px', height: '100%' }}>
                {/* Header */}
                <div style={{ padding: 'var(--spacing-md) var(--spacing-xl)', borderBottom: '1px solid var(--color-primary-stroke)' }}>
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

                {/* Messages Area */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '0' }} className="scrollbar-thin">
                    <div style={{ maxWidth: '900px', margin: '0 auto', padding: 'var(--spacing-md) var(--spacing-xl)', minHeight: '100%' }}>
                        {messages.length === 0 ? (
                            <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
                                <div className="text-center" style={{ maxWidth: '700px', padding: 'var(--spacing-2xl)' }}>
                                    {/* ... Welcome Icon Logic ... */}
                                    <div style={{
                                        display: 'inline-flex',
                                        padding: 'var(--spacing-2xl)',
                                        background: 'radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, transparent 70%)',
                                        borderRadius: '50%',
                                        marginBottom: 'var(--spacing-2xl)',
                                        color: theme.accent,
                                        transition: 'color 1s ease'
                                    }}>
                                        {theme.icon}
                                    </div>

                                    <h1 style={{
                                        marginBottom: 'var(--spacing-lg)',
                                        background: theme.textGradient,
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                        transition: 'background 1s ease'
                                    }}>
                                        {deliverableInfo?.level || 'Comienza tu conversación'}
                                    </h1>

                                    <p className="text-secondary" style={{ fontSize: 'var(--font-size-h3)', lineHeight: '1.6', marginBottom: 'var(--spacing-xl)' }}>
                                        {deliverableInfo?.description || 'Escribe tu primera pregunta para comenzar'}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            messages.map((message) => (
                                <MessageBubble
                                    key={message.id}
                                    message={message}
                                    onPreview={handlePreview}
                                    chatId={id}
                                    onDeployMVP={handleDeployMVP}
                                />
                            ))
                        )}



                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input Area */}
                <div style={{
                    width: '100%',
                    borderTop: '1px solid var(--color-primary-stroke)',
                    backgroundColor: 'var(--color-primary-main)',
                    position: 'relative',
                    zIndex: 10
                }}>
                    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 var(--spacing-xl) var(--spacing-md)' }}>
                        <ChatInput onSendMessage={handleSendMessage} disabled={isSending} accentColor={theme.accent} />
                    </div>
                </div>
            </div>

            {/* Right Pane: Preview Sidebar (Resizable) */}
            {showPreview && (
                <>
                    {/* Resize Handle */}
                    <div
                        onMouseDown={startResize}
                        className="w-1 hover:bg-accent-green/50 transition-colors cursor-col-resize flex items-center justify-center z-50"
                        style={{ background: isResizing ? 'var(--color-accent-green-main)' : 'var(--color-primary-stroke)' }}
                    >
                    </div>

                    {/* Preview Container */}
                    <div style={{ width: previewWidth, minWidth: '350px', height: '100%', position: 'relative' }}>
                        <PreviewSidebar
                            isOpen={showPreview}
                            onClose={() => setShowPreview(false)}
                            htmlCode={previewHtml}
                            url={mvpPreviewUrl || previewUrl}
                            inline={true}
                        />
                    </div>
                </>
            )}
        </div>
    );
}
