import { X, RefreshCw, Download, Maximize2, Minimize2, Monitor, GripVertical } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';

interface PreviewSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    htmlCode?: string;
    url?: string;
    inline?: boolean;
}

export function PreviewSidebar({ isOpen, onClose, htmlCode = '', url, inline = false }: PreviewSidebarProps) {
    const [key, setKey] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [width, setWidth] = useState(600);
    const [isResizing, setIsResizing] = useState(false);
    const sidebarRef = useRef<HTMLDivElement>(null);

    // Refresh iframe when code changes
    useEffect(() => {
        setKey(prev => prev + 1);
    }, [htmlCode, url]);

    // Handle resize
    const startResize = useCallback((e: React.MouseEvent) => {
        if (inline) return;
        e.preventDefault();
        setIsResizing(true);
    }, [inline]);

    useEffect(() => {
        if (inline) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            const newWidth = window.innerWidth - e.clientX;
            if (newWidth >= 400 && newWidth <= window.innerWidth * 0.9) {
                setWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'ew-resize';
            document.body.style.userSelect = 'none';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isResizing, inline]);

    const handleDownload = () => {
        if (!htmlCode) return;
        const blob = new Blob([htmlCode], { type: 'text/html' });
        const objUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objUrl;
        a.download = 'mvp-landing.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(objUrl);
    };

    if (!isOpen) return null;

    const iframeProps = url ? { src: url } : { srcDoc: htmlCode };
    const title = url ? 'Live Preview' : 'Vista Previa';

    if (inline) {
        return (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'var(--color-primary-surface)', // Match chat background/surface
                    borderLeft: '1px solid var(--color-primary-stroke)',
                }}
            >
                {/* Header */}
                <div style={{
                    padding: 'var(--spacing-md)',
                    borderBottom: '1px solid var(--color-primary-stroke)',
                    backgroundColor: 'var(--color-primary-main)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    minHeight: '69px', // Align with Chat header height if possible
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '8px',
                            background: 'var(--color-accent-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: 0.1
                        }}>
                            <div style={{ position: 'absolute', opacity: 1, color: 'var(--color-accent-primary)' }}>
                                <Monitor size={18} />
                            </div>
                        </div>
                        {/* Wrapper for absolute icon alignment hack or just clean flex */}
                        <div style={{ marginLeft: '-32px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Monitor size={18} className="text-accent-primary" />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <h3 style={{ color: 'var(--color-text-primary)', fontSize: '14px', fontWeight: 600, margin: 0 }}>
                                {title}
                            </h3>
                            {url && (
                                <span className="text-xs px-2 py-0.5 rounded bg-green-500/10 text-green-500 border border-green-500/20 font-medium">
                                    ONLINE
                                </span>
                            )}
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                            onClick={() => setKey(prev => prev + 1)}
                            className="btn btn-ghost"
                            style={{ width: '36px', height: '36px', padding: 0 }}
                            title="Reload Preview"
                        >
                            <RefreshCw size={18} className="text-gray-400 hover:text-white transition-colors" />
                        </button>
                        {!url && (
                            <button
                                onClick={handleDownload}
                                className="btn btn-ghost"
                                style={{ width: '36px', height: '36px', padding: 0 }}
                                title="Download HTML"
                            >
                                <Download size={18} className="text-gray-400 hover:text-white transition-colors" />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="btn btn-ghost"
                            style={{ width: '36px', height: '36px', padding: 0 }}
                            title="Close Preview"
                        >
                            <X size={18} className="text-gray-400 hover:text-white transition-colors" />
                        </button>
                    </div>
                </div>

                {/* Preview Area */}
                <div style={{ flex: 1, position: 'relative', backgroundColor: 'white' }}>
                    <iframe
                        key={key}
                        {...iframeProps}
                        style={{
                            width: '100%',
                            height: '100%',
                            border: 'none',
                        }}
                        title="MVP Preview"
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    />
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Backdrop */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 9998,
                }}
                onClick={onClose}
            />

            {/* Sidebar - FIXED to RIGHT */}
            <div
                ref={sidebarRef}
                style={{
                    position: 'fixed',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: isFullscreen ? '100vw' : `${width}px`,
                    maxWidth: '100vw',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'linear-gradient(180deg, #0f0f1a 0%, #0a0a12 100%)',
                    boxShadow: '-10px 0 50px rgba(0, 0, 0, 0.8)',
                    animation: 'slideInFromRight 0.3s ease-out',
                }}
            >
                {/* Resize Handle */}
                {!isFullscreen && (
                    <div
                        onMouseDown={startResize}
                        style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: '8px',
                            cursor: 'ew-resize',
                            background: isResizing ? 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            if (!isResizing) e.currentTarget.style.background = 'rgba(102, 126, 234, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            if (!isResizing) e.currentTarget.style.background = 'transparent';
                        }}
                    >
                        <GripVertical size={12} style={{ color: 'rgba(255,255,255,0.3)' }} />
                    </div>
                )}

                {/* Gradient line at top */}
                <div style={{
                    height: '3px',
                    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                }} />

                {/* Header */}
                <div style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.05) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '14px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
                        }}>
                            <Monitor size={24} color="white" />
                        </div>
                        <div>
                            <h3 style={{ color: 'white', fontSize: '18px', fontWeight: 700, margin: 0 }}>
                                {title}
                            </h3>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: 0 }}>
                                Tu Landing Page • {htmlCode ? Math.round(htmlCode.length / 1024) : 0}KB
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                            onClick={handleDownload}
                            style={{
                                padding: '10px 16px',
                                borderRadius: '10px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                fontWeight: 700,
                                fontSize: '13px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                        >
                            <Download size={16} /> Descargar
                        </button>
                        <button
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            style={{
                                padding: '10px',
                                borderRadius: '10px',
                                background: 'rgba(255,255,255,0.1)',
                                color: 'rgba(255,255,255,0.7)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                cursor: 'pointer',
                            }}
                        >
                            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                        </button>
                        <button
                            onClick={() => setKey(prev => prev + 1)}
                            style={{
                                padding: '10px',
                                borderRadius: '10px',
                                background: 'rgba(255,255,255,0.1)',
                                color: 'rgba(255,255,255,0.7)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                cursor: 'pointer',
                            }}
                        >
                            <RefreshCw size={18} />
                        </button>
                        <button
                            onClick={onClose}
                            style={{
                                padding: '10px',
                                borderRadius: '10px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                color: '#ef4444',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                cursor: 'pointer',
                                marginLeft: '8px',
                            }}
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Browser Frame */}
                <div style={{
                    flex: 1,
                    padding: '20px',
                    background: '#050508',
                    overflow: 'hidden',
                }}>
                    <div style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 25px 60px rgba(0,0,0,0.6)',
                        display: 'flex',
                        flexDirection: 'column',
                    }}>
                        {/* Browser Chrome */}
                        <div style={{
                            height: '36px',
                            background: 'linear-gradient(180deg, #2a2a3a 0%, #1a1a2a 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0 16px',
                            gap: '12px',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                        }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f57' }} />
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#febc2e' }} />
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#28c840' }} />
                            </div>
                            <div style={{
                                flex: 1,
                                height: '24px',
                                borderRadius: '6px',
                                background: 'rgba(255,255,255,0.05)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px',
                                color: 'rgba(255,255,255,0.4)',
                            }}>
                                🔒 {url || 'mvp-preview-live'}
                            </div>
                        </div>

                        {/* Iframe */}
                        <iframe
                            key={key}
                            {...iframeProps}
                            style={{
                                flex: 1,
                                width: '100%',
                                border: 'none',
                                background: 'white',
                            }}
                            title="MVP Preview"
                            sandbox="allow-scripts allow-modals allow-forms allow-popups"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '12px 20px',
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    background: 'linear-gradient(90deg, rgba(102, 126, 234, 0.1) 0%, transparent 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#22c55e',
                            animation: 'pulse 2s infinite',
                        }} />
                        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                            Preview en vivo
                        </span>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#667eea' }}>
                        🚀 Generado por Adán
                    </span>
                </div>
            </div>

            {/* CSS Animation */}
            <style>{`
                @keyframes slideInFromRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </>
    );
}
