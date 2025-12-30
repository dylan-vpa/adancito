import { createContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '../services/api';
import type { User, LoginCredentials, RegisterData } from '../types';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in on mount
        const token = localStorage.getItem('token');
        if (token) {
            apiClient.getMe()
                .then(userData => setUser(userData))
                .catch(() => localStorage.removeItem('token'))
                .finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, []);

    const login = async (credentials: LoginCredentials) => {
        const { user: userData } = await apiClient.login(credentials);
        setUser(userData);
    };

    const register = async (data: RegisterData) => {
        const { user: userData } = await apiClient.register(data);
        setUser(userData);
    };

    const logout = async () => {
        await apiClient.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            isAuthenticated: !!user,
            login,
            register,
            logout,
        }}>
            {children}
        </AuthContext.Provider>
    );
}
