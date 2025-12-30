import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, FolderKanban, User, Archive, LogOut, X, ChevronRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(false);

    const menuItems = [
        { icon: Home, label: 'Inicio', path: '/dashboard' },
        { icon: FolderKanban, label: 'Proyectos', path: '/dashboard' },
        { icon: Archive, label: 'Archivados', path: '/archived' },
        { icon: User, label: 'Perfil', path: '/profile' },
    ];

    const sidebarWidth = isCollapsed ? '60px' : '280px';

    return (
        <div
            style={{
                width: sidebarWidth,
                height: '100vh',
                backgroundColor: 'var(--color-primary-surface)',
                borderRight: '1px solid rgba(255, 255, 255, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                padding: isCollapsed ? 'var(--spacing-sm)' : 'var(--spacing-lg)',
                transition: 'all var(--duration-normal) var(--easing)',
                position: 'relative',
            }}
        >
            {/* Toggle button */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="btn btn-ghost"
                style={{
                    position: 'absolute',
                    top: 'var(--spacing-md)',
                    right: isCollapsed ? '50%' : 'var(--spacing-md)',
                    transform: isCollapsed ? 'translateX(50%)' : 'none',
                    padding: 'var(--spacing-xs)',
                    minWidth: '32px',
                    minHeight: '32px',
                    zIndex: 10,
                }}
                title={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
            >
                {isCollapsed ? <ChevronRight size={20} /> : <X size={20} />}
            </button>

            {/* Logo */}
            <div style={{ marginBottom: 'var(--spacing-xl)', marginTop: 'var(--spacing-2xl)' }}>
                {isCollapsed ? (
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <img src="/logo.png" alt="Adan" style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-medium)' }} />
                    </div>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                        <img src="/logo.png" alt="Adan" style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-medium)' }} />
                        <h2 style={{ fontSize: 'var(--font-size-h2)' }}>Adan</h2>
                    </div>
                )}
            </div>

            {/* Menu Items */}
            <nav style={{ flex: 1 }}>
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <button
                            key={item.label}
                            onClick={() => navigate(item.path)}
                            className="btn btn-ghost w-full"
                            style={{
                                justifyContent: isCollapsed ? 'center' : 'flex-start',
                                marginBottom: 'var(--spacing-xs)',
                                backgroundColor: isActive ? 'var(--color-primary-elevated)' : 'transparent',
                                color: isActive ? 'var(--color-accent-green-main)' : 'inherit',
                                padding: isCollapsed ? 'var(--spacing-sm)' : 'var(--spacing-sm) var(--spacing-md)',
                            }}
                            title={isCollapsed ? item.label : undefined}
                        >
                            <item.icon size={20} />
                            {!isCollapsed && <span style={{ marginLeft: 'var(--spacing-sm)' }}>{item.label}</span>}
                        </button>
                    );
                })}
            </nav>

            {/* User Section */}
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.04)', paddingTop: 'var(--spacing-md)' }}>
                {!isCollapsed && (
                    <div className="flex items-center gap-md" style={{ marginBottom: 'var(--spacing-md)' }}>
                        <div className="avatar avatar-sm">
                            {user?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div className="font-medium text-ellipsis" style={{ fontSize: 'var(--font-size-caption)' }}>
                                {user?.full_name || user?.email}
                            </div>
                        </div>
                    </div>
                )}
                <button
                    onClick={logout}
                    className="btn btn-ghost w-full"
                    style={{
                        fontSize: 'var(--font-size-caption)',
                        justifyContent: isCollapsed ? 'center' : 'flex-start',
                        color: 'var(--color-feedback-error)',
                        padding: isCollapsed ? 'var(--spacing-sm)' : 'var(--spacing-sm) var(--spacing-md)',
                    }}
                    title={isCollapsed ? 'Cerrar sesión' : undefined}
                >
                    <LogOut size={16} />
                    {!isCollapsed && <span style={{ marginLeft: 'var(--spacing-sm)' }}>Cerrar Sesión</span>}
                </button>
            </div>
        </div>
    );
}
