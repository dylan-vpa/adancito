import { useState } from 'react';
import { Button } from '../common/Button';
import { Bot, Layers, Users, ChevronRight, Check } from 'lucide-react';

interface OnboardingModalProps {
    onClose: () => void;
}

export function OnboardingModal({ onClose }: OnboardingModalProps) {
    const [step, setStep] = useState(0);

    const steps = [
        {
            icon: Bot,
            title: "Tu Cofundador Inteligente",
            description: "Adan no es solo un chat. Es un sistema de IA diseñado para construir negocios reales contigo, paso a paso."
        },
        {
            icon: Layers,
            title: "El Framework EDEN",
            description: "Seguimos un camino probado de 7 niveles: desde validar tu idea (El Dolor) hasta el Lanzamiento Real al mercado."
        },
        {
            icon: Users,
            title: "Junta Directiva de Agentes",
            description: "Tendrás acceso a agentes especializados (CEO, CTO, Marketing) que trabajarán juntos para resolver tus desafíos."
        }
    ];

    const currentStep = steps[step];

    const handleNext = () => {
        if (step < steps.length - 1) {
            setStep(step + 1);
        } else {
            onClose();
        }
    };

    return (
        <div className="modal-overlay">
            <div
                className="modal"
                onClick={e => e.stopPropagation()}
                style={{
                    maxWidth: '450px',
                    width: '100%',
                    padding: '40px',
                    background: 'var(--surface-glass-bg)',
                    border: 'var(--surface-glass-border)',
                    boxShadow: 'var(--shadow-soft)',
                    backdropFilter: 'blur(var(--surface-glass-blur))',
                    borderRadius: 'var(--radius-large)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center'
                }}
            >
                {/* Step Indicators */}
                <div className="flex gap-2 mb-8">
                    {steps.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-accent' : 'w-2 bg-white/10'}`}
                            style={{ backgroundColor: i === step ? 'var(--color-accent-primary)' : 'rgba(255,255,255,0.1)' }}
                        />
                    ))}
                </div>

                {/* Icon Animation */}
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-accent/20 blur-xl rounded-full animate-pulse" style={{ backgroundColor: 'rgba(158, 200, 179, 0.2)' }}></div>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        zIndex: 10
                    }}>
                        <currentStep.icon size={32} color="var(--color-accent-primary)" />
                    </div>
                </div>

                {/* Content */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 key={step}">
                    <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>{currentStep.title}</h2>
                    <p className="text-secondary" style={{ marginBottom: '32px', lineHeight: '1.6' }}>
                        {currentStep.description}
                    </p>
                </div>

                {/* Actions */}
                <div className="w-full flex gap-3">
                    {step < steps.length - 1 ? (
                        <>
                            <Button
                                variant="ghost"
                                onClick={onClose}
                                style={{ flex: 1 }}
                            >
                                Saltar
                            </Button>
                            <Button
                                onClick={handleNext}
                                style={{ flex: 2 }}
                            >
                                Siguiente
                                <ChevronRight size={16} style={{ marginLeft: '8px' }} />
                            </Button>
                        </>
                    ) : (
                        <Button
                            onClick={handleNext}
                            style={{ width: '100%', background: '#FFFFFF', color: '#000000' }}
                        >
                            Comenzar mi viaje
                            <Check size={16} style={{ marginLeft: '8px' }} />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
