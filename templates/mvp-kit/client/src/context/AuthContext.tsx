import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
    id: string;
    email: string;
    name: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string) => Promise<void>;
    logout: () => void;
}

// Default value with no-op functions to avoid null errors
const AuthContext = createContext<AuthContextType>({
    user: null,
    isLoading: true,
    login: async () => { },
    register: async () => { },
    logout: () => { }
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    // Auto-login with demo user for MVP preview
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Auto-login demo user after short delay
        const timer = setTimeout(() => {
            setUser({ id: 'demo-user', email: 'demo@mvp.local', name: 'Demo User' });
            setIsLoading(false);
        }, 200);
        return () => clearTimeout(timer);
    }, []);

    const login = async (email: string, password: string) => {
        console.log('Login:', email);
        localStorage.setItem('token', 'demo-jwt-token');
        setUser({ id: 'demo-user', email, name: 'Demo User' });
    };

    const register = async (email: string, password: string, name: string) => {
        console.log('Register:', email, name);
        localStorage.setItem('token', 'demo-jwt-token');
        setUser({ id: 'demo-user', email, name });
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
