import { Check, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { MediaThumbnail } from '@/Components/app/MediaThumbnail';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
import type { MediaEntity } from '@/Types';
import { cn } from '@/Utils/cn';

export function MediaPicker({
    open,
    onOpenChange,
    media,
    selectedIds = [],
    onSelect,
    title = 'Seleccionar contenido',
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    media: MediaEntity[];
    selectedIds?: number[];
    onSelect: (media: MediaEntity) => void;
    title?: string;
}) {
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return media;
        return media.filter((asset) => asset.filename.toLowerCase().includes(term));
    }, [media, search]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>

                <div className="relative mb-3">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Buscar en la biblioteca…"
                        className="pl-9"
                    />
                </div>

                {filtered.length === 0 ? (
                    <p className="rounded-control border border-dashed border-line px-4 py-10 text-center text-xs text-faint">
                        Sin contenido disponible.
                    </p>
                ) : (
                    <div className="grid max-h-[55vh] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-4">
                        {filtered.map((asset) => {
                            const selected = selectedIds.includes(asset.id);
                            return (
                                <button
                                    key={asset.id}
                                    type="button"
                                    onClick={() => onSelect(asset)}
                                    className={cn(
                                        'relative space-y-1.5 rounded-control border p-1.5 text-left transition-colors',
                                        selected ? 'border-accent/60 bg-accent/10' : 'border-line hover:border-line-strong',
                                    )}
                                >
                                    <MediaThumbnail media={asset} />
                                    <p className="truncate text-[11px] text-fg">{asset.filename}</p>
                                    <p className="text-[10px] text-faint">
                                        {asset.type.label}
                                        {asset.formatted_duration ? ` · ${asset.formatted_duration}` : ''}
                                    </p>
                                    {selected ? (
                                        <span className="absolute right-2 top-2 flex size-4 items-center justify-center rounded-full bg-accent text-[#20170a]">
                                            <Check className="size-3" strokeWidth={3} />
                                        </span>
                                    ) : null}
                                </button>
                            );
                        })}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
