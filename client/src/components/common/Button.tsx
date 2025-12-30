import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost';
    children: React.ReactNode;
}

export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
    const variantClass = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        ghost: 'btn-ghost',
    }[variant];

    return (
        <button className={`btn ${variantClass} ${className}`} {...props}>
            {children}
        </button>
    );
}
