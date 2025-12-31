import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

export function Login() {
    const [step, setStep] = useState<'email' | 'password'>('email');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            toast.error('Por favor ingresa tu email');
            return;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            toast.error('Por favor ingresa un email válido');
            return;
        }
        setStep('password');
    };

    const [showWelcomeAnimation, setShowWelcomeAnimation] = useState(false);
    const [loadingText, setLoadingText] = useState('Verificando credenciales...');

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) {
            toast.error('Por favor ingresa tu contraseña');
            return;
        }

        setIsLoading(true);

        try {
            await login({ email, password });
            setShowWelcomeAnimation(true);

            // Text sequence for the animation
            setTimeout(() => setLoadingText('Conectando con Neural Core...'), 800);
            setTimeout(() => setLoadingText('Cargando entorno de trabajo...'), 1800);
            setTimeout(() => setLoadingText('Bienvenido a Adán'), 2600);

            // Optional: keep or remove depending on if visual feedback is enough
            // toast.success('¡Bienvenido de nuevo!'); 
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Error al iniciar sesión');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (showWelcomeAnimation) {
            const timer = setTimeout(() => {
                navigate('/dashboard');
            }, 3500); // Extended slightly to fit the text sequence
            return () => clearTimeout(timer);
        }
    }, [showWelcomeAnimation, navigate]);

    if (showWelcomeAnimation) {
        return (
            <div className="fixed top-0 left-0 z-50 w-full flex flex-col items-center justify-center bg-[#0B0E11] text-white" style={{ height: '100dvh' }}>
                {/* Background Ambient Effects - Subtle Noise & Vignette */}
                <div className="absolute inset-0 pointer-events-none" style={{
                    backgroundImage: 'radial-gradient(circle at center, rgba(158, 200, 179, 0.03) 0%, rgba(11, 14, 17, 0.8) 100%)',
                }}></div>

                <div className="relative z-10 flex flex-col items-center justify-center p-8">
                    {/* Logo Container - Circular & Glassy (Matched to Form) */}
                    <div className="relative mb-16">
                        {/* Radar/Pulse Effect */}
                        <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] border border-white/5 rounded-full animate-ping" style={{ animationDuration: '2s' }}></div>
                        <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140px] h-[140px] border border-white/10 rounded-full animate-pulse"></div>

                        {/* Icon Circle - Glassy Style with Inline Styles */}
                        <div
                            className="relative w-24 h-24 flex items-center justify-center z-10 backdrop-blur-md"
                            style={{
                                borderRadius: '50%',
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                padding: '24px',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                                marginBottom: '24px'
                            }}
                        >
                            <div className="absolute inset-0 rounded-full bg-white/5 blur-md animate-pulse"></div>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white relative z-10">
                                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                                <polyline points="10 17 15 12 10 7" />
                                <line x1="15" y1="12" x2="3" y2="12" />
                            </svg>
                        </div>
                    </div>

                    <div className="h-6 flex items-center justify-center overflow-visible">
                        <p className="text-secondary italic text-sm animate-pulse transition-all duration-300 text-center text-nowrap">
                            {loadingText}
                        </p>
                    </div>

                    {/* Refined Progress Bar */}
                    <div className="mt-16 h-[2px] w-48 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)] animate-progress-fill" style={{ animationDuration: '3.5s' }}></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full flex items-center justify-center bg-base p-4" style={{ minHeight: '100dvh' }}>
            <div className="card" style={{ maxWidth: '380px', width: '100%', padding: '32px' }}>
                <div className="flex justify-start" style={{ marginBottom: '24px' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.15)', // Increased visibility
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--color-neutral-white)'
                    }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                            <polyline points="10 17 15 12 10 7" />
                            <line x1="15" y1="12" x2="3" y2="12" />
                        </svg>
                    </div>
                </div>

                <div className="text-left" style={{ marginBottom: '24px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>Bienvenido a Adán</h1>
                    <p className="text-secondary text-sm">
                        {step === 'email' ? 'Por favor, inicia sesión para continuar.' : `Iniciando sesión como ${email}`}
                    </p>
                </div>

                {step === 'email' ? (
                    <form onSubmit={handleEmailSubmit} className="flex-col gap-md">
                        <Input
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="nombre@ejemplo.com"
                            autoFocus
                        />

                        <Button
                            type="submit"
                            style={{
                                marginTop: '8px',
                                background: '#FFFFFF',
                                color: '#000000',
                                width: '100%',
                                height: '40px',
                                fontWeight: 600
                            }}
                        >
                            Continuar con correo
                        </Button>

                        <div className="flex items-center gap-md" style={{ margin: '16px 0' }}>
                            <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.1)' }}></div>
                            <span className="text-secondary pointer-events-none" style={{ fontSize: '12px' }}>o</span>
                            <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.1)' }}></div>
                        </div>

                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => navigate('/register')}
                            style={{ width: '100%', height: '40px', fontSize: '13px' }}
                        >
                            Crear una cuenta nueva
                        </Button>
                    </form>
                ) : (
                    <form onSubmit={handleLoginSubmit} className="flex-col gap-md">
                        <div className="flex items-center gap-xs" style={{ marginBottom: '16px', cursor: 'pointer' }} onClick={() => setStep('email')}>
                            <ArrowLeft size={14} className="text-secondary" />
                            <span className="text-secondary text-sm">Editar email</span>
                        </div>

                        <Input
                            label="Contraseña"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            autoFocus
                        />

                        <Button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                marginTop: '8px',
                                background: '#FFFFFF',
                                color: '#000000',
                                width: '100%',
                                height: '40px',
                                fontWeight: 600
                            }}
                        >
                            {isLoading ? <div className="spinner" style={{ borderColor: '#000', borderTopColor: 'transparent' }} /> : 'Iniciar Sesión'}
                        </Button>
                    </form>
                )}
            </div>
        </div>
    );
}
