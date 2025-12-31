import React from 'react';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    type?: 'default' | 'danger' | 'success' | 'info';
    width?: string;
}

export function Modal({
    isOpen,
    onClose,
    title,
    children,
    footer,
    type = 'default',
    width = '500px'
}: ModalProps) {
    if (!isOpen) return null;

    const getHeaderIcon = () => {
        switch (type) {
            case 'danger': return <AlertTriangle className="text-error" />;
            case 'success': return <CheckCircle style={{ color: 'var(--color-accent-green-main)' }} />;
            case 'info': return <Info className="text-primary" />;
            default: return null;
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                className="card"
                style={{
                    width,
                    maxWidth: '90vw',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: 0, // Reset padding as we have header/content/footer
                    animation: 'scaleIn 0.2s ease-out'
                }}
            >
                {/* Header */}
                <div
                    style={{
                        padding: 'var(--spacing-lg) var(--spacing-xl)',
                        borderBottom: '1px solid var(--color-primary-surface)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <div className="flex items-center gap-md">
                        {getHeaderIcon()}
                        <h2 className="text-lg font-bold">{title}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="btn-ghost"
                        style={{ padding: 'var(--spacing-xs)' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div
                    style={{
                        padding: 'var(--spacing-xl)',
                        overflowY: 'auto',
                    }}
                >
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div
                        style={{
                            padding: 'var(--spacing-md) var(--spacing-xl)',
                            borderTop: '1px solid var(--color-primary-surface)',
                            backgroundColor: 'rgba(0, 0, 0, 0.2)', // Darker glassy footer
                            borderBottomLeftRadius: 'var(--radius-large)',
                            borderBottomRightRadius: 'var(--radius-large)',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: 'var(--spacing-md)',
                        }}
                    >
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
