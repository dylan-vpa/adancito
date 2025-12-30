import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '../../types';
import { Bot, User, FileText, Download } from 'lucide-react';
import { useEffect, useRef } from 'react';

// Styles for blinking cursor
const cursorStyles = `
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
  .typing-cursor::after {
    content: '▋';
    display: inline-block;
    vertical-align: baseline;
    animation: blink 1s step-end infinite;
    color: var(--color-accent-green-main);
    margin-left: 4px;
  }
`;

interface MessageBubbleProps {
    message: Message;
    onPreview?: (html: string) => void;
    chatId?: string; // Used to mark deliverable as completed
}

export function MessageBubble({ message, onPreview, chatId }: MessageBubbleProps) {
    const isUser = message.role === 'user';
    const isStreaming = message.isStreaming;
    const deliverables = message.moderationInfo?.deliverables;
    const hasMarkedComplete = useRef(false);

    // Check for HTML code block and auto-complete level when MVP code card appears
    const hasHtmlCode = /```html[\s\S]*?<!DOCTYPE html/i.test(message.content) && !message.isStreaming;

    useEffect(() => {
        // When HTML code block is detected and streaming is done, mark as completed
        if (hasHtmlCode && chatId && !hasMarkedComplete.current && !message.isStreaming) {
            hasMarkedComplete.current = true;
            console.log('[MessageBubble] HTML code detected, marking level as completed');

            // Call API to mark the deliverable as completed
            fetch(`/api/deliverables/complete-by-chat/${chatId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        console.log('[MessageBubble] ✅ Level marked as completed');
                    } else {
                        console.log('[MessageBubble] Level completion response:', data);
                    }
                })
                .catch(err => console.error('[MessageBubble] Error marking complete:', err));
        }
    }, [hasHtmlCode, chatId, message.isStreaming]);

    // Parse agent info from code_language field
    let rawAgentName = message.code_language?.startsWith('AGENT:')
        ? message.code_language.replace('AGENT:', '')
        : 'Adán';

    // Map internal model names to display names
    const agentName = rawAgentName === 'gpt-oss' ? 'Adán' : rawAgentName;

    // Extract full deliverable data from message content (including content for PDF)
    const jsonMatch = message.content.match(/```json\s*(\{[\s\S]*?"deliverable_ready":\s*true[\s\S]*?\})\s*```/);
    let parsedDeliverable: { deliverable_title?: string; deliverable_content?: string } | null = null;
    if (jsonMatch) {
        try {
            parsedDeliverable = JSON.parse(jsonMatch[1]);
        } catch (e) {
            // Fallback regex extraction if JSON is malformed
            console.warn("JSON parse failed, trying regex extraction");
            const rawJson = jsonMatch[1];
            const titleMatch = rawJson.match(/"deliverable_title"\s*:\s*"([^"]+)"/);
            const contentMatch = rawJson.match(/"deliverable_content"\s*:\s*"((?:[^"\\]|\\.)*)"/);

            if (titleMatch || contentMatch) {
                parsedDeliverable = {
                    deliverable_title: titleMatch ? titleMatch[1] : undefined,
                    deliverable_content: contentMatch ? contentMatch[1]
                        .replace(/\\n/g, '\n')
                        .replace(/\\"/g, '"')
                        .replace(/\\\\/g, '\\') : undefined
                };
            }
        }
    }

    // NEW: Download handler that sends content to server for on-demand PDF generation
    const handleDownload = async (title: string, content?: string) => {
        try {
            const token = localStorage.getItem('token');

            console.log('[MessageBubble] Generating PDF with title:', title);
            console.log('[MessageBubble] Content length:', content?.length || 0);

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
            alert('Error al descargar el documento. Inténtalo de nuevo.');
        }
    };

    const isDeliverableReady = message.deliverableReady || !!jsonMatch;

    // Prefer the file from signal, then the parsed one from content, then the first from prediction
    const fileToShow = message.deliverableFile
        || parsedDeliverable?.deliverable_title
        || (deliverables && deliverables.length > 0 ? deliverables[0] : null);

    // Format filename if needed
    const displayFilename = fileToShow && !fileToShow.endsWith('.pdf') && !fileToShow.endsWith('.zip')
        ? `${fileToShow}.pdf`
        : fileToShow;

    // Filter out internal JSON triggers from the content to be displayed
    // During streaming, use the truncation marker if available
    let displayContent = message.content;

    // Check for streaming truncation marker (set by Chat.tsx during streaming)
    const truncateAt = (message as any)._displayTruncateAt;
    if (typeof truncateAt === 'number' && truncateAt > 0 && message.isStreaming) {
        // During streaming, truncate at the JSON block start
        displayContent = displayContent.substring(0, truncateAt);
    }

    // Always apply regex filter for completed messages (and as backup during streaming)
    displayContent = displayContent.replace(/```json\s*\{[\s\S]*?"deliverable_ready":\s*true[\s\S]*?\}\s*```/g, '').trim();

    // Also remove raw JSON blocks without code fencing
    displayContent = displayContent.replace(/\{[\s\S]*?"deliverable_ready"\s*:\s*true[\s\S]*?\}/g, '').trim();

    return (
        <div
            className="flex gap-md w-full animate-fade-in group"
            style={{
                flexDirection: isUser ? 'row-reverse' : 'row',
                marginBottom: 'var(--spacing-lg)',
            }}
        >
            <style>{cursorStyles}</style>

            {/* Avatar */}
            <div
                className="flex-shrink-0 flex items-center justify-center"
                style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: isUser ? 'var(--color-primary-elevated)' : 'var(--color-primary-surface)',
                    border: '1px solid var(--color-primary-stroke)',
                    overflow: 'hidden'
                }}
            >
                {isUser ? (
                    <User size={20} className="text-secondary" />
                ) : (
                    <Bot size={20} className="text-accent-green" />
                )}
            </div>

            {/* Message Content Container */}
            <div
                style={{
                    maxWidth: isUser ? '85%' : '100%',
                    flex: isUser ? '0 1 auto' : '1',
                    minWidth: '0',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start'
                }}
            >
                {/* Header (Name) - AI Only */}
                {!isUser && (
                    <div className="flex items-center gap-sm mb-xs">
                        <span className="font-semibold text-primary text-sm">{agentName}</span>
                    </div>
                )}

                {/* Message Bubble */}
                <div
                    className={isUser ? 'card' : ''}
                    style={{
                        backgroundColor: isUser
                            ? 'var(--color-primary-elevated)'
                            : 'transparent',
                        padding: isUser ? 'var(--spacing-md)' : '0',
                        borderRadius: isUser ? 'var(--radius-large)' : '0',
                        position: 'relative',
                        width: isUser ? 'auto' : '100%'
                    }}
                >
                    {isStreaming && !message.content ? (
                        <div className="flex items-center gap-sm text-secondary">
                            <span className="typing-cursor">Pensando</span>
                        </div>
                    ) : (
                        <div className={`markdown-content ${isStreaming ? 'typing-cursor' : ''}`}>
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    code({ node, inline, className, children, ...props }: any) {
                                        const match = /language-(\w+)/.exec(className || '');
                                        const isHtml = match && match[1] === 'html';
                                        const codeContent = String(children).replace(/\n$/, '');

                                        const handleCodeDownload = () => {
                                            const blob = new Blob([codeContent], { type: 'text/html' });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `mvp-${Date.now()}.html`;
                                            document.body.appendChild(a);
                                            a.click();
                                            document.body.removeChild(a);
                                            URL.revokeObjectURL(url);
                                        };

                                        // For HTML code, show a beautiful card instead of raw code
                                        if (isHtml && !inline) {
                                            return (
                                                <div className="my-6">
                                                    {/* Outer glow effect */}
                                                    <div
                                                        className="relative overflow-hidden rounded-2xl transition-all duration-500 hover:transform hover:-translate-y-2 group"
                                                        style={{
                                                            background: 'linear-gradient(145deg, rgba(15, 15, 30, 0.9) 0%, rgba(10, 10, 20, 0.95) 100%)',
                                                            boxShadow: '0 0 0 1px rgba(102, 126, 234, 0.3), 0 20px 50px rgba(102, 126, 234, 0.15), 0 0 100px rgba(118, 75, 162, 0.1)',
                                                        }}
                                                    >
                                                        {/* Animated gradient border */}
                                                        <div
                                                            className="absolute inset-0 rounded-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-500"
                                                            style={{
                                                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #667eea 100%)',
                                                                padding: '1px',
                                                                WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                                                                WebkitMaskComposite: 'xor',
                                                                maskComposite: 'exclude',
                                                            }}
                                                        />

                                                        <div className="relative p-6">
                                                            {/* Header */}
                                                            <div className="flex items-center gap-4 mb-5">
                                                                <div
                                                                    className="w-14 h-14 rounded-2xl flex items-center justify-center relative"
                                                                    style={{
                                                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                                        boxShadow: '0 8px 25px rgba(102, 126, 234, 0.5)'
                                                                    }}
                                                                >
                                                                    <Bot size={28} className="text-white" />
                                                                    {/* Pulse effect */}
                                                                    <div className="absolute inset-0 rounded-2xl animate-ping opacity-20" style={{
                                                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                                                    }}></div>
                                                                </div>
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{
                                                                            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)',
                                                                            color: '#a78bfa',
                                                                            border: '1px solid rgba(167, 139, 250, 0.3)'
                                                                        }}>
                                                                            🚀 MVP Listo
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-white font-bold text-lg">
                                                                        Tu Landing Page
                                                                    </div>
                                                                    <div className="text-white/40 text-xs">
                                                                        {codeContent.length.toLocaleString()} caracteres de código
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Action Buttons */}
                                                            <div className="flex gap-3">
                                                                {onPreview && (
                                                                    <button
                                                                        onClick={() => onPreview(codeContent)}
                                                                        className="flex-1 py-4 px-5 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl flex items-center justify-center gap-3"
                                                                        style={{
                                                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                                            color: 'white',
                                                                            boxShadow: '0 8px 30px rgba(102, 126, 234, 0.4)'
                                                                        }}
                                                                    >
                                                                        <Bot size={20} />
                                                                        <span>Ver Preview</span>
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={handleCodeDownload}
                                                                    className="flex-1 py-4 px-5 rounded-xl font-bold text-sm transition-all duration-300 hover:scale-[1.03] flex items-center justify-center gap-3"
                                                                    style={{
                                                                        background: 'rgba(255, 255, 255, 0.05)',
                                                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                                                        color: 'white',
                                                                    }}
                                                                >
                                                                    <Download size={20} />
                                                                    <span>Descargar HTML</span>
                                                                </button>
                                                            </div>

                                                            {/* Code preview toggle */}
                                                            <details className="mt-5">
                                                                <summary className="text-xs text-white/40 cursor-pointer hover:text-white/70 transition-colors flex items-center gap-2">
                                                                    <span className="w-4 h-px bg-white/20"></span>
                                                                    Ver código fuente
                                                                    <span className="flex-1 h-px bg-white/20"></span>
                                                                </summary>
                                                                <pre className="mt-3 p-4 rounded-xl text-xs overflow-auto max-h-48" style={{
                                                                    background: 'rgba(0,0,0,0.4)',
                                                                    border: '1px solid rgba(255,255,255,0.05)',
                                                                    color: '#a78bfa'
                                                                }}>
                                                                    <code>{codeContent.substring(0, 800)}...</code>
                                                                </pre>
                                                            </details>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        return !inline && match ? (
                                            <pre className={`${className} rounded-xl overflow-hidden`} style={{
                                                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                padding: '1rem'
                                            }}>
                                                <code className={className} {...props}>
                                                    {children}
                                                </code>
                                            </pre>
                                        ) : (
                                            <code className={className} {...props}>
                                                {children}
                                            </code>
                                        );
                                    }
                                }}
                            >
                                {displayContent}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>

                {/* Deliverables / Actions */}
                {!isUser && isDeliverableReady && displayFilename && (
                    <div className="mt-md w-full max-w-[400px]">
                        <div
                            className="relative overflow-hidden cursor-pointer group transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-lg"
                            style={{
                                background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
                                backdropFilter: 'blur(10px)',
                                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                                borderRadius: '16px',
                                padding: '16px',
                                border: '1px solid rgba(255, 255, 255, 0.1)'
                            }}
                            onClick={() => handleDownload(
                                parsedDeliverable?.deliverable_title || displayFilename?.replace('.pdf', '') || 'documento',
                                parsedDeliverable?.deliverable_content
                            )}
                        >
                            {/* Gradient Border Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-accent-green-main/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                            <div className="flex items-center gap-4 relative z-10">
                                {/* Icon Container */}
                                <div className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(158, 200, 179, 0.2) 0%, rgba(158, 200, 179, 0.05) 100%)',
                                        border: '1px solid rgba(158, 200, 179, 0.2)'
                                    }}
                                >
                                    <FileText size={24} className="text-accent-green" />
                                </div>

                                {/* Text Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-accent-green px-2 py-0.5 rounded-full bg-accent-green/10 border border-accent-green/20">
                                            Entregable Listo
                                        </span>
                                    </div>
                                    <h4 className="text-sm font-semibold text-white truncate group-hover:text-accent-green transition-colors">
                                        {displayFilename}
                                    </h4>
                                    <p className="text-xs text-secondary mt-0.5">
                                        Clic para descargar informe PDF
                                    </p>
                                </div>

                                {/* Download Action */}
                                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-white/5 group-hover:bg-accent-green group-hover:text-primary-main transition-all duration-300">
                                    <Download size={16} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer: Timestamp */}
                <div
                    className="flex items-center gap-md"
                    style={{
                        marginTop: 'var(--spacing-xs)',
                        alignSelf: isUser ? 'flex-end' : 'flex-start'
                    }}
                >
                    <span className="caption text-muted text-xs">
                        {new Date(message.created_at).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </span>
                </div>
            </div>
        </div>
    );
}
