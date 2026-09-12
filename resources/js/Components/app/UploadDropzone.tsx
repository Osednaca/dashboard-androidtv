import { useForm } from '@inertiajs/react';
import { Loader2, UploadCloud } from 'lucide-react';
import { useRef, useState, type DragEvent } from 'react';
import { Progress } from '@/Components/ui/progress';
import { cn } from '@/Utils/cn';

/**
 * Drag & drop uploader that reuses the existing media pipeline. Submitting
 * posts the file to the given action with Inertia so server-side validation and
 * the processing queue stay authoritative.
 */
export function UploadDropzone({
    action,
    accept = '.jpg,.jpeg,.png,.webp,.mp4',
    hint = 'JPG, PNG, WebP o MP4',
    disabled = false,
    onUploaded,
}: {
    action: string;
    accept?: string;
    hint?: string;
    disabled?: boolean;
    onUploaded?: () => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);
    const [progress, setProgress] = useState(0);

    const form = useForm<{ file: File | null }>({ file: null });

    const upload = (file: File) => {
        form.setData('file', file);
        form.post(action, {
            forceFormData: true,
            preserveScroll: true,
            onProgress: (event) => setProgress(event?.percentage ?? 0),
            onSuccess: () => {
                form.reset();
                setProgress(0);
                onUploaded?.();
            },
            onFinish: () => setProgress(0),
        });
    };

    const onDrop = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setDragging(false);
        if (disabled) return;
        const file = event.dataTransfer.files?.[0];
        if (file) upload(file);
    };

    return (
        <div
            onDragOver={(event) => {
                event.preventDefault();
                if (!disabled) setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cn(
                'rounded-card border border-dashed p-5 text-center transition-colors',
                dragging ? 'border-accent/60 bg-accent/5' : 'border-line bg-surface/40',
                disabled && 'opacity-60',
            )}
        >
            <input
                ref={inputRef}
                type="file"
                accept={accept}
                className="hidden"
                onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) upload(file);
                    event.target.value = '';
                }}
            />
            <div className="flex flex-col items-center gap-2">
                <span className="flex size-11 items-center justify-center rounded-full border border-line bg-card text-accent">
                    {form.processing ? <Loader2 className="size-5 animate-spin" /> : <UploadCloud className="size-5" />}
                </span>
                <div>
                    <p className="text-sm text-fg">
                        {form.processing ? `Subiendo… ${progress}%` : 'Arrastra un archivo o'}
                    </p>
                    <button
                        type="button"
                        disabled={disabled || form.processing}
                        onClick={() => inputRef.current?.click()}
                        className="mt-1 text-xs font-medium text-accent hover:underline disabled:opacity-60"
                    >
                        selecciona desde tu equipo
                    </button>
                </div>
                <p className="text-[11px] text-faint">{hint}</p>
                {form.processing ? <Progress value={progress} className="mt-1 w-48" /> : null}
                {form.errors.file ? <p className="text-xs text-danger">{form.errors.file}</p> : null}
            </div>
        </div>
    );
}
