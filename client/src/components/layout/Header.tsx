import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, User, Archive, LogOut, Settings, Menu, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export function Header() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const menuItems = [
        { icon: Home, label: 'Inicio', path: '/dashboard' },
        { icon: Archive, label: 'Archivados', path: '/archived' },
    ];

    // Close dropdown on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        setIsDropdownOpen(false);
        setIsMobileMenuOpen(false);
        logout();
    };

    return (
        <header style={{ padding: 'var(--spacing-md) var(--spacing-xl)' }}>
            <div className="flex items-center justify-between" style={{ maxWidth: '1400px', margin: '0 auto' }}>
                {/* Logo */}
                <div
                    className="flex items-center gap-md cursor-pointer"
                    onClick={() => navigate('/dashboard')}
                >
                    <img src="/logo.png" alt="Adan" style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-medium)' }} />
                    <h2 style={{ fontSize: 'var(--font-size-h2)', marginBottom: 0 }}>Adan</h2>
                </div>

                {/* Desktop Navigation */}
                {!isMobile && (
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
                                        color: isActive ? '#FFFFFF' : 'var(--color-text-secondary)',
                                        fontWeight: isActive ? 600 : 400,
                                        opacity: 1
                                    }}
                                >
                                    <item.icon size={18} style={{ marginRight: 'var(--spacing-xs)' }} />
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>
                )}

                {/* User Section - Avatar Dropdown (Desktop) */}
                {!isMobile && (
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="avatar cursor-pointer transition-transform hover:scale-105 active:scale-95"
                            style={{
                                border: isDropdownOpen ? '1px solid var(--color-accent-primary)' : '1px solid rgba(255,255,255,0.1)'
                            }}
                        >
                            {user?.avatar_url ? (
                                <img src={user.avatar_url} alt={user.full_name || 'User'} />
                            ) : (
                                <span>
                                    {user?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                                </span>
                            )}
                        </button>

                        {/* Dropdown Menu */}
                        {isDropdownOpen && (
                            <div
                                className="absolute right-0 mt-2 w-56 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                                style={{
                                    backgroundColor: '#161A1E',
                                    border: '1px solid rgba(255, 255, 255, 0.05)',
                                    borderRadius: '16px',
                                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                                    backdropFilter: 'blur(16px)',
                                    minWidth: '220px',
                                    color: '#FFFFFF',
                                    padding: '6px' // Added padding as requested
                                }}
                            >
                                <div className="px-4 py-3 border-b border-white/5 mb-2 text-center">
                                    <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
                                    <p className="text-xs text-secondary truncate">{user?.email}</p>
                                </div>

                                <button
                                    onClick={() => { setIsDropdownOpen(false); navigate('/profile'); }}
                                    className="w-full justify-center px-4 py-2 text-sm text-secondary hover:text-white hover:bg-white/5 flex items-center gap-3 transition-colors rounded-lg"
                                >
                                    <User size={16} />
                                    Mi Perfil
                                </button>

                                <button
                                    onClick={() => { setIsDropdownOpen(false); navigate('/settings'); }}
                                    className="w-full justify-center px-4 py-2 text-sm text-secondary hover:text-white hover:bg-white/5 flex items-center gap-3 transition-colors rounded-lg"
                                >
                                    <Settings size={16} />
                                    Configuración
                                </button>

                                <div className="my-1 border-t border-white/5"></div>

                                <button
                                    onClick={handleLogout}
                                    className="w-full justify-center px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 flex items-center gap-3 transition-colors rounded-lg"
                                >
                                    <LogOut size={16} />
                                    Cerrar Sesión
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Mobile Menu Button */}
                {isMobile && (
                    <button
                        className="p-2 text-secondary hover:text-white transition-colors"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                )}
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="md:hidden fixed inset-0 top-[72px] z-40 bg-base animate-in fade-in slide-in-from-top-4 duration-200"
                    style={{ padding: 'var(--spacing-lg)' }}
                >
                    <nav className="flex flex-col gap-md">
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.path ||
                                (item.path === '/dashboard' && location.pathname.startsWith('/projects'));
                            return (
                                <button
                                    key={item.label}
                                    onClick={() => { setIsMobileMenuOpen(false); navigate(item.path); }}
                                    className="flex items-center gap-sm p-4 rounded-xl transition-colors text-left"
                                    style={{
                                        backgroundColor: isActive ? 'var(--color-elevated)' : 'transparent',
                                        color: isActive ? '#FFFFFF' : 'var(--color-text-secondary)',
                                        border: isActive ? '1px solid var(--color-accent-primary)' : '1px solid transparent'
                                    }}
                                >
                                    <item.icon size={20} />
                                    <span className="font-medium">{item.label}</span>
                                </button>
                            );
                        })}

                        <div className="h-px bg-white/5 my-2"></div>

                        <button
                            onClick={() => { setIsMobileMenuOpen(false); navigate('/profile'); }}
                            className="flex items-center gap-sm p-4 rounded-xl hover:bg-white/5 transition-colors text-left text-secondary"
                        >
                            <User size={20} />
                            <span>Mi Perfil</span>
                        </button>

                        <button
                            onClick={() => { setIsMobileMenuOpen(false); navigate('/settings'); }}
                            className="flex items-center gap-sm p-4 rounded-xl hover:bg-white/5 transition-colors text-left text-secondary"
                        >
                            <Settings size={20} />
                            <span>Configuración</span>
                        </button>

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-sm p-4 rounded-xl hover:bg-white/5 transition-colors text-left text-red-400"
                        >
                            <LogOut size={20} />
                            <span>Cerrar Sesión</span>
                        </button>
                    </nav>
                </div>
            )}
        </header>
    );
}
