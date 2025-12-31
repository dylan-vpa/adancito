
import { Check, Circle, Loader, Lock } from 'lucide-react';
import type { ProjectDeliverable } from '../../types';

interface StepsTimelineProps {
    deliverables: ProjectDeliverable[];
    onDeliverableClick?: (deliverable: ProjectDeliverable) => void;
    isDeliverableAccessible?: (deliverable: ProjectDeliverable) => boolean;
}

export function StepsTimeline({ deliverables, onDeliverableClick, isDeliverableAccessible }: StepsTimelineProps) {
    const sortedDeliverables = [...deliverables].sort((a, b) => a.step_number - b.step_number);

    const getStepColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'var(--color-accent-green-main)';
            case 'in_progress':
                return 'var(--color-accent-green-strong)';
            default:
                return 'var(--color-neutral-gray-500)';
        }
    };

    const getStepIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <Check size={16} />;
            case 'in_progress':
                return <Loader size={16} className="animate-spin" />;
            default:
                return <Circle size={16} />;
        }
    };

    return (
        <div style={{ position: 'relative', padding: 'var(--spacing-lg) 0' }}>
            {/* Progress Line */}
            <div
                style={{
                    position: 'absolute',
                    top: '48px',
                    left: '24px',
                    right: '24px',
                    height: '2px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    zIndex: 0,
                }}
            />

            {/* Steps */}
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                {sortedDeliverables.map((deliverable) => {
                    const color = getStepColor(deliverable.status);
                    const isAccessible = isDeliverableAccessible ? isDeliverableAccessible(deliverable) : true;
                    const isClickable = isAccessible && deliverable.status !== 'pending';
                    const isLocked = !isAccessible && deliverable.status === 'pending';

                    return (
                        <div
                            key={deliverable.id}
                            onClick={() => isClickable && onDeliverableClick?.(deliverable)}
                            style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                cursor: isClickable ? 'pointer' : 'default',
                                opacity: isAccessible ? 1 : 0.4,
                            }}
                        >
                            {/* Step Circle */}
                            <div
                                style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%',
                                    backgroundColor: 'var(--color-primary-surface)',
                                    border: `2px solid ${isLocked ? 'var(--color-neutral-gray-500)' : color}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: isLocked ? 'var(--color-neutral-gray-500)' : color,
                                    marginBottom: 'var(--spacing-md)',
                                }}
                            >
                                {isLocked ? <Lock size={16} /> : getStepIcon(deliverable.status)}
                            </div>

                            {/* Step Info */}
                            <div style={{ textAlign: 'center', maxWidth: '120px' }}>
                                <div className="caption font-semibold" style={{ color: isLocked ? 'var(--color-neutral-gray-500)' : color, marginBottom: 'var(--spacing-xs)' }}>
                                    Paso {deliverable.step_number}
                                </div>
                                <div className="caption text-secondary" style={{ fontSize: '11px' }}>
                                    {deliverable.title}
                                </div>
                                {deliverable.status === 'completed' && deliverable.completed_at && (
                                    <div className="caption text-muted flex items-center justify-center gap-xs" style={{ fontSize: '10px', marginTop: 'var(--spacing-xs)' }}>
                                        <Check size={10} /> Completado
                                    </div>
                                )}
                                {isLocked && (
                                    <div className="caption text-muted flex items-center justify-center gap-xs" style={{ fontSize: '10px', marginTop: 'var(--spacing-xs)' }}>
                                        <Lock size={10} /> Bloqueado
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
