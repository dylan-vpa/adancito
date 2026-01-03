import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, LayoutDashboard, Settings } from 'lucide-react';
import { cn } from '../lib/utils';

export function Layout({ children }: { children: React.ReactNode }) {
    const { user, logout } = useAuth();

    return (
        <div className="flex h-screen bg-primary text-white overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-primary-light border-r border-white/10 flex flex-col">
                <div className="p-6">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                        MVP Dashboard
                    </h1>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    <a href="/" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-accent/10 text-accent">
                        <LayoutDashboard size={20} />
                        <span>Overview</span>
                    </a>
                    {/* Adán can inject more nav items here */}
                </nav>

                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center font-bold">
                            {user?.name?.[0] || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user?.name}</p>
                            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <LogOut size={16} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <header className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-primary/50 backdrop-blur-sm sticky top-0 z-10">
                    <h2 className="font-medium text-lg">Dashboard</h2>
                </header>
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
