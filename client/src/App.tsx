import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { useAuth } from './hooks/useAuth';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Chat } from './pages/Chat';
import { Profile } from './pages/Profile';
import { Archived } from './pages/Archived';
import { ProjectView } from './pages/ProjectView';
import { Spinner } from './components/common/Spinner';
import { Toaster } from 'sonner';
import './styles/index.css';

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center" style={{ minHeight: '100vh' }}>
                <Spinner large />
            </div>
        );
    }

    return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
    return (
        <ToastProvider>
            <AuthProvider>
                <BrowserRouter>
                    <Toaster
                        position="bottom-center"
                        theme="dark"
                        richColors
                        toastOptions={{
                            style: {
                                background: 'rgba(22, 26, 30, 0.8)',
                                backdropFilter: 'blur(12px)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderRadius: '12px',
                                color: 'var(--color-neutral-white)',
                                fontSize: '14px',
                                fontFamily: 'var(--font-primary)',
                                padding: '16px'
                            },
                            className: 'adan-toast'
                        }}
                    />
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        <Route path="/dashboard" element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        } />

                        <Route path="/chat/:id" element={
                            <ProtectedRoute>
                                <Chat />
                            </ProtectedRoute>
                        } />

                        <Route path="/profile" element={
                            <ProtectedRoute>
                                <Profile />
                            </ProtectedRoute>
                        } />

                        <Route path="/archived" element={
                            <ProtectedRoute>
                                <Archived />
                            </ProtectedRoute>
                        } />

                        <Route path="/projects/:id" element={
                            <ProtectedRoute>
                                <ProjectView />
                            </ProtectedRoute>
                        } />

                        <Route path="/" element={<Navigate to="/dashboard" />} />
                    </Routes>
                </BrowserRouter>
            </AuthProvider>
        </ToastProvider>
    );
}

export default App;
