import { useState, useEffect } from 'react';
import { Copy, Check, Mail, Calendar, Award, Coins as CoinsIcon, Star } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../services/api';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';

export function Profile() {
    const { user } = useAuth();
    const [referralCode, setReferralCode] = useState('');
    const [referralCount, setReferralCount] = useState(0);
    const [coins, setCoins] = useState(0);
    const [copied, setCopied] = useState(false);
    const [feedback, setFeedback] = useState({ rating: 5, message: '' });
    const [feedbackSent, setFeedbackSent] = useState(false);
    const [referrals, setReferrals] = useState<Array<{ id: string; email: string; full_name: string | null; created_at: string }>>([]);

    useEffect(() => {
        loadProfileData();
    }, []);

    const loadProfileData = async () => {
        try {
            const [code, count, userCoins, refs] = await Promise.all([
                apiClient.getReferralCode(),
                apiClient.getReferralCount(),
                apiClient.getUserCoins(),
                apiClient.getReferrals(),
            ]);
            setReferralCode(code);
            setReferralCount(count);
            setCoins(userCoins);
            setReferrals(refs);
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    };

    const handleSubmitFeedback = async () => {
        try {
            await apiClient.submitFeedback({
                rating: feedback.rating,
                message: feedback.message,
                feedback_type: 'general',
            });
            setFeedbackSent(true);
            setFeedback({ rating: 5, message: '' });
            setTimeout(() => setFeedbackSent(false), 3000);
        } catch (error) {
            console.error('Error submitting feedback:', error);
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-primary-main)' }}>
            <Header />

            <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--spacing-xl)' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <h1 style={{ marginBottom: 'var(--spacing-2xl)' }}>Mi Perfil</h1>

                    {/* User Info Card */}
                    <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <div className="flex items-center gap-md" style={{ marginBottom: 'var(--spacing-lg)' }}>
                            <div className="avatar avatar-lg">
                                {user?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 style={{ marginBottom: 'var(--spacing-xs)' }}>{user?.full_name || 'Usuario'}</h2>
                                <div className="flex items-center gap-xs text-secondary">
                                    <Mail size={16} />
                                    <span className="caption">{user?.email}</span>
                                </div>
                                <div className="flex items-center gap-xs text-muted" style={{ marginTop: 'var(--spacing-xs)' }}>
                                    <Calendar size={14} />
                                    <span className="caption">
                                        Miembro desde {new Date(user?.created_at || '').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                        <div className="card">
                            <div className="flex items-center gap-sm" style={{ marginBottom: 'var(--spacing-sm)' }}>
                                <CoinsIcon size={20} color="var(--color-accent-green-main)" />
                                <span className="caption text-secondary">Monedas</span>
                            </div>
                            <h2>{coins}</h2>
                        </div>
                        <div className="card">
                            <div className="flex items-center gap-sm" style={{ marginBottom: 'var(--spacing-sm)' }}>
                                <Award size={20} color="var(--color-accent-green-main)" />
                                <span className="caption text-secondary">Referidos</span>
                            </div>
                            <h2>{referralCount}</h2>
                        </div>
                    </div>

                    {/* Referral Section */}
                    {referralCode && (
                        <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                            <h3 style={{ marginBottom: 'var(--spacing-md)' }}>🔗 Tu Link de Referido</h3>
                            <p className="text-secondary caption" style={{ marginBottom: 'var(--spacing-md)' }}>
                                Comparte este link y gana recompensas cuando tus amigos se unan
                            </p>

                            {/* Shareable Link */}
                            <div style={{
                                padding: 'var(--spacing-md)',
                                background: 'var(--color-primary-surface)',
                                borderRadius: 'var(--radius-medium)',
                                marginBottom: 'var(--spacing-md)'
                            }}>
                                <div className="flex gap-sm" style={{ alignItems: 'center' }}>
                                    <Input
                                        value={`${window.location.origin}/register?ref=${referralCode}`}
                                        readOnly
                                        style={{ flex: 1, fontFamily: 'monospace', fontSize: 'var(--font-size-caption)' }}
                                    />
                                    <Button onClick={() => {
                                        navigator.clipboard.writeText(`${window.location.origin}/register?ref=${referralCode}`);
                                        setCopied(true);
                                        setTimeout(() => setCopied(false), 2000);
                                    }}>
                                        {copied ? <Check size={18} /> : <Copy size={18} />}
                                        <span style={{ marginLeft: 'var(--spacing-xs)' }}>
                                            {copied ? '¡Copiado!' : 'Copiar Link'}
                                        </span>
                                    </Button>
                                </div>
                            </div>

                            {/* Referral Code Display */}
                            <p className="caption text-secondary" style={{ marginBottom: 'var(--spacing-sm)' }}>
                                Código: <strong style={{ fontFamily: 'monospace' }}>{referralCode}</strong>
                            </p>
                        </div>
                    )}

                    {/* Referrals List */}
                    <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                        <h3 style={{ marginBottom: 'var(--spacing-md)' }}>👥 Mis Referidos ({referrals.length})</h3>

                        {referrals.length > 0 ? (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-caption)' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--color-neutral-gray-200)', textAlign: 'left' }}>
                                            <th style={{ padding: 'var(--spacing-sm)', color: 'var(--color-neutral-gray-600)' }}>Usuario</th>
                                            <th style={{ padding: 'var(--spacing-sm)', color: 'var(--color-neutral-gray-600)' }}>Fecha</th>
                                            <th style={{ padding: 'var(--spacing-sm)', color: 'var(--color-neutral-gray-600)' }}>Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {referrals.map((ref) => (
                                            <tr key={ref.id} style={{ borderBottom: '1px solid var(--color-neutral-gray-100)' }}>
                                                <td style={{ padding: 'var(--spacing-sm)' }}>
                                                    <div className="flex items-center gap-sm">
                                                        <div className="avatar avatar-sm" style={{ width: 24, height: 24, fontSize: 10 }}>
                                                            {(ref.full_name || ref.email).charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 500 }}>{ref.full_name || 'Usuario'}</div>
                                                            <div className="text-secondary" style={{ fontSize: '0.8em' }}>{ref.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: 'var(--spacing-sm)', color: 'var(--color-neutral-gray-600)' }}>
                                                    {new Date(ref.created_at).toLocaleDateString()}
                                                </td>
                                                <td style={{ padding: 'var(--spacing-sm)' }}>
                                                    <span style={{
                                                        padding: '2px 8px',
                                                        borderRadius: '12px',
                                                        backgroundColor: 'rgba(122, 215, 163, 0.2)',
                                                        color: 'var(--color-accent-green-dark)',
                                                        fontSize: '0.8em',
                                                        fontWeight: 500
                                                    }}>
                                                        Activo
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-center p-md text-secondary">
                                <p style={{ marginBottom: 'var(--spacing-sm)' }}>Aún no tienes referidos.</p>
                                <p className="caption">¡Comparte tu link para empezar a ganar!</p>
                            </div>
                        )}
                    </div>

                    {/* Feedback Form */}
                    <div className="card">
                        <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Enviar Feedback</h3>
                        <p className="text-secondary caption" style={{ marginBottom: 'var(--spacing-lg)' }}>
                            Tu opinión nos ayuda a mejorar Adan
                        </p>

                        {feedbackSent && (
                            <div style={{
                                padding: 'var(--spacing-sm) var(--spacing-md)',
                                backgroundColor: 'rgba(122, 215, 163, 0.1)',
                                border: '1px solid var(--color-feedback-success)',
                                borderRadius: 'var(--radius-medium)',
                                color: 'var(--color-feedback-success)',
                                marginBottom: 'var(--spacing-md)',
                            }}>
                                ¡Gracias por tu feedback!
                            </div>
                        )}

                        <div style={{ marginBottom: 'var(--spacing-md)' }}>
                            <label className="input-label" style={{ marginBottom: 'var(--spacing-sm)' }}>Calificación</label>
                            <div className="flex gap-sm">
                                {[1, 2, 3, 4, 5].map((ratingValue) => (
                                    <button
                                        key={ratingValue}
                                        type="button"
                                        onClick={() => setFeedback({ ...feedback, rating: ratingValue })}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: 'var(--spacing-xs)',
                                            color: ratingValue <= feedback.rating ? 'var(--color-accent-green-main)' : 'var(--color-neutral-gray-600)',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        <Star size={24} fill={ratingValue <= feedback.rating ? 'currentColor' : 'none'} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <textarea
                            value={feedback.message}
                            onChange={(e) => setFeedback({ ...feedback, message: e.target.value })}
                            placeholder="Cuéntanos qué piensas de Adan..."
                            className="input textarea"
                            style={{ marginBottom: 'var(--spacing-md)', minHeight: '100px' }}
                        />

                        <Button onClick={handleSubmitFeedback} disabled={!feedback.message.trim()}>
                            Enviar Feedback
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
