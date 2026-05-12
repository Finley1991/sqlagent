import { ButtonHTMLAttributes, PropsWithChildren } from 'react';

type Variant = 'primary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, PropsWithChildren {
  variant?: Variant;
}

export function Button({ children, className = '', variant = 'primary', ...props }: ButtonProps) {
  const variantClass =
    variant === 'primary'
      ? 'bg-accent hover:bg-blue-500 text-white'
      : 'bg-transparent hover:bg-slate-700 text-slate-300 border border-borderSoft';

  return (
    <button
      className={`rounded-md px-3 py-1.5 text-sm transition-colors ${variantClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
