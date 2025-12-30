import { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

export function Input({ label, className = '', ...props }: InputProps) {
    return (
        <div className="input-wrapper">
            {label && <label className="input-label">{label}</label>}
            <input className={`input ${className}`} {...props} />
        </div>
    );
}
