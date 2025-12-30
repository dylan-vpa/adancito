export function Spinner({ className = '', large = false }: { className?: string; large?: boolean }) {
    return <div className={`spinner ${large ? 'spinner-large' : ''} ${className}`} />;
}
