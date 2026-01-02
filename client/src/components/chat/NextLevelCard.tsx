import { ArrowRight, Sparkles } from 'lucide-react';

interface NextLevelCardProps {
    currentLevel: string;
    onStartNextLevel: () => void;
}

const LEVEL_CONFIG: Record<string, { next: string; title: string; desc: string; color: string; gradient: string }> = {
    'Exploración': {
        next: 'Definición',
        title: 'Fase 2: Definición',
        desc: 'Transforma tus hallazgos en una estrategia clara.',
        color: '#E57B30', // Orange-ish
        gradient: 'linear-gradient(135deg, rgba(229, 123, 48, 0.2) 0%, rgba(229, 123, 48, 0.1) 100%)'
    },
    'Definición': {
        next: 'Estructuración',
        title: 'Fase 3: Estructuración',
        desc: 'Diseña la arquitectura y los planos de tu solución.',
        color: '#E5C07B', // Amber/Yellow
        gradient: 'linear-gradient(135deg, rgba(229, 192, 123, 0.2) 0%, rgba(229, 192, 123, 0.1) 100%)'
    },
    'Estructuración': {
        next: 'Navegación',
        title: 'Fase 4: Navegación (MVP)',
        desc: 'Construye y lanza tu producto mínimo viable.',
        color: '#9EC8B3', // Green
        gradient: 'linear-gradient(135deg, rgba(158, 200, 179, 0.2) 0%, rgba(158, 200, 179, 0.1) 100%)'
    },
    // Fallback or loop?
    'Navegación': {
        next: 'Escalamiento',
        title: 'Fase 5: Escalamiento',
        desc: 'Lleva tu producto al siguiente nivel de crecimiento.',
        color: '#9EC8B3',
        gradient: 'linear-gradient(135deg, rgba(158, 200, 179, 0.2) 0%, rgba(158, 200, 179, 0.1) 100%)'
    }
};

export function NextLevelCard({ currentLevel, onStartNextLevel }: NextLevelCardProps) {
    // Normalize level string just in case
    const normalizedLevel = Object.keys(LEVEL_CONFIG).find(k =>
        currentLevel.toLowerCase().includes(k.toLowerCase().split(' - ')[0].trim().toLowerCase())
    ) || 'Exploración';

    const nextConfig = LEVEL_CONFIG[normalizedLevel];

    if (!nextConfig) return null;

    return (
        <div
            className="w-full max-w-2xl mx-auto mt-8 p-1 rounded-2xl animate-slide-up-fade"
            style={{
                background: `linear-gradient(to right, ${nextConfig.color}, transparent)`,
                boxShadow: `0 10px 30px -10px ${nextConfig.color}40`
            }}
        >
            <div className="bg-[#0B0E11] rounded-xl p-6 relative overflow-hidden group">
                {/* Background Glow */}
                <div
                    className="absolute top-0 right-0 w-64 h-64 opacity-10 rounded-full blur-[60px] transition-opacity duration-500 group-hover:opacity-20"
                    style={{ background: nextConfig.color }}
                />

                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span
                                className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                                style={{
                                    background: `${nextConfig.color}20`,
                                    color: nextConfig.color,
                                    border: `1px solid ${nextConfig.color}30`
                                }}
                            >
                                Siguiente Nivel
                            </span>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">{nextConfig.title}</h3>
                        <p className="text-gray-400 max-w-md">{nextConfig.desc}</p>
                    </div>

                    <button
                        onClick={onStartNextLevel}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-black transition-transform hover:scale-105 active:scale-95 whitespace-nowrap"
                        style={{ background: nextConfig.color }}
                    >
                        <Sparkles size={18} />
                        <span>Iniciar {nextConfig.next}</span>
                        <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
