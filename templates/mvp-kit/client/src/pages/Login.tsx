import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await login(email, password);
        navigate('/');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-primary text-white p-4">
            <div className="w-full max-w-md p-8 rounded-2xl bg-primary-light border border-white/10 shadow-2xl">
                <h2 className="text-2xl font-bold mb-6 text-center">Sign In</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 focus:border-accent outline-none transition-colors"
                            placeholder="demo@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 focus:border-accent outline-none transition-colors"
                            placeholder="••••••••"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-3 rounded-lg bg-accent hover:bg-accent-hover text-white font-semibold transition-colors mt-6"
                    >
                        Enter Dashboard
                    </button>
                </form>
            </div>
        </div>
    );
}
