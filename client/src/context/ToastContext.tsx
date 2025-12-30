import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType) => {
        const id = Date.now().toString();
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto remove after 3 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    const getIcon = (type: ToastType) => {
        switch (type) {
            case 'success': return <CheckCircle size={20} />;
            case 'error': return <AlertCircle size={20} />;
            case 'warning': return <AlertTriangle size={20} />;
            default: return <Info size={20} />;
        }
    };

    const getColor = (type: ToastType) => {
        switch (type) {
            case 'success': return 'var(--color-accent-green-main)';
            case 'error': return '#ef4444';
            case 'warning': return '#f59e0b';
            default: return 'var(--color-primary-light)';
        }
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div
                style={{
                    position: 'fixed',
                    bottom: 'var(--spacing-xl)',
                    right: 'var(--spacing-xl)',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--spacing-sm)',
                }}
            >
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className="animate-slide-up"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-md)',
                            padding: 'var(--spacing-md) var(--spacing-lg)',
                            backgroundColor: 'var(--color-primary-elevated)',
                            border: '1px solid var(--color-primary-surface)',
                            borderLeft: `3px solid ${getColor(toast.type)}`,
                            borderRadius: 'var(--radius-medium)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                            minWidth: '300px',
                            maxWidth: '400px',
                        }}
                    >
                        <span style={{ color: getColor(toast.type) }}>{getIcon(toast.type)}</span>
                        <p style={{ flex: 1, margin: 0, fontSize: '14px' }}>{toast.message}</p>
                        <button
                            onClick={() => removeToast(toast.id)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--color-text-secondary)',
                                cursor: 'pointer',
                                padding: 0,
                            }}
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
