import { Eye, EyeOff } from 'lucide-react';
import * as React from 'react';
import { Input } from '@/Components/ui/input';
import { cn } from '@/Utils/cn';

/**
 * Password field with a show/hide toggle. Reused anywhere a password is
 * entered so the affordance stays consistent across the platform.
 */
export function PasswordInput({
    className,
    ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
    const [visible, setVisible] = React.useState(false);

    return (
        <div className="relative">
            <Input type={visible ? 'text' : 'password'} className={cn('pr-10', className)} {...props} />
            <button
                type="button"
                onClick={() => setVisible((value) => !value)}
                aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={visible}
                tabIndex={-1}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-faint transition-colors hover:text-fg focus-visible:text-fg"
            >
                {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
        </div>
    );
}
