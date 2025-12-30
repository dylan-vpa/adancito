import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';

export function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await register({ email, password, full_name: fullName });
            navigate('/dashboard');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al registrarse');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center" style={{ minHeight: '100vh' }}>
            <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--spacing-md)' }}>
                    <img src="/logo.png" alt="Adan Logo" style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-medium)' }} />
                </div>
                <h1 style={{ marginBottom: 'var(--spacing-lg)', textAlign: 'center' }}>Adan</h1>
                <p className="text-secondary text-center" style={{ marginBottom: 'var(--spacing-xl)' }}>
                    Crea tu cuenta
                </p>

                <form onSubmit={handleSubmit} className="flex-col gap-md">
                    {error && (
                        <div style={{
                            padding: 'var(--spacing-sm) var(--spacing-md)',
                            backgroundColor: 'rgba(224, 122, 122, 0.1)',
                            border: '1px solid var(--color-feedback-error)',
                            borderRadius: 'var(--radius-medium)',
                            color: 'var(--color-feedback-error)',
                            fontSize: 'var(--font-size-caption)'
                        }}>
                            {error}
                        </div>
                    )}

                    <Input
                        label="Nombre completo"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Tu nombre"
                    />

                    <Input
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tu@email.com"
                        required
                    />

                    <Input
                        label="Contraseña"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                    />

                    <Button type="submit" disabled={isLoading} style={{ marginTop: 'var(--spacing-md)' }}>
                        {isLoading ? 'Registrando...' : 'Crear Cuenta'}
                    </Button>

                    <div className="text-center" style={{ marginTop: 'var(--spacing-md)' }}>
                        <a href="/login" style={{ fontSize: 'var(--font-size-caption)' }}>
                            ¿Ya tienes cuenta? Inicia sesión
                        </a>
                    </div>
                </form>
            </div>
        </div>
    );
}
