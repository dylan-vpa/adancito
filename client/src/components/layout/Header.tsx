import { useNavigate, useLocation } from 'react-router-dom';
import { Home, User, Archive, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export function Header() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();

    const menuItems = [
        { icon: Home, label: 'Inicio', path: '/dashboard' },
        { icon: Archive, label: 'Archivados', path: '/archived' },
        { icon: User, label: 'Perfil', path: '/profile' },
    ];

    return (
        <header style={{ padding: 'var(--spacing-md) var(--spacing-xl)' }}>
            <div className="flex items-center justify-between" style={{ maxWidth: '1400px', margin: '0 auto' }}>
                {/* Logo */}
                <div className="flex items-center gap-md">
                    <img src="/logo.png" alt="Adan" style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-medium)' }} />
                    <h2 style={{ fontSize: 'var(--font-size-h2)', marginBottom: 0 }}>Adan</h2>
                </div>

                {/* Navigation */}
                <nav className="flex items-center gap-xs">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path ||
                            (item.path === '/dashboard' && location.pathname.startsWith('/projects'));
                        return (
                            <button
                                key={item.label}
                                onClick={() => navigate(item.path)}
                                className="btn btn-ghost"
                                style={{
                                    backgroundColor: isActive ? 'var(--color-primary-elevated)' : 'transparent',
                                    color: isActive ? 'var(--color-accent-green-main)' : 'inherit',
                                }}
                            >
                                <item.icon size={18} style={{ marginRight: 'var(--spacing-xs)' }} />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>

                {/* User Section */}
                <div className="flex items-center gap-md">
                    <div className="flex items-center gap-sm">
                        <div className="avatar avatar-sm">
                            {user?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <span className="caption text-secondary" style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user?.full_name || user?.email}
                        </span>
                    </div>
                    <button
                        onClick={logout}
                        className="btn btn-ghost"
                        style={{ color: 'var(--color-feedback-error)', padding: 'var(--spacing-xs)' }}
                        title="Cerrar sesión"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </header>
    );
}
