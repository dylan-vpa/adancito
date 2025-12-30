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
