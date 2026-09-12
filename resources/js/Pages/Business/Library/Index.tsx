import { Head, router, useForm } from '@inertiajs/react';
import { Eye, Image as ImageIcon, MoreVertical, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '@/Components/app/ConfirmDialog';
import { EmptyState } from '@/Components/app/EmptyState';
import { FilterBar } from '@/Components/app/FilterBar';
import { MediaThumbnail } from '@/Components/app/MediaThumbnail';
import { PageHeader } from '@/Components/app/PageHeader';
import { Pagination } from '@/Components/app/Pagination';
import { StatusBadge } from '@/Components/app/StatusBadge';
import { UploadDropzone } from '@/Components/app/UploadDropzone';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { Input } from '@/Components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { usePermissions } from '@/Hooks/usePermissions';
import { BusinessLayout } from '@/Layouts/BusinessLayout';
import type { MediaEntity, Paginated } from '@/Types';
import { formatBytes, formatDate, formatNumber } from '@/Utils/format';

export default function LibraryIndex({
    media,
    filters,
    counts,
    totalSize,
}: {
    media: Paginated<MediaEntity>;
    filters: { search?: string; type?: string };
    counts: { total: number; images: number; videos: number };
    totalSize: number;
}) {
    const { can } = usePermissions();
    const [uploadOpen, setUploadOpen] = useState(false);
    const [previewMedia, setPreviewMedia] = useState<MediaEntity | null>(null);
    const [renaming, setRenaming] = useState<MediaEntity | null>(null);
    const [deleting, setDeleting] = useState<MediaEntity | null>(null);

    const renameForm = useForm({ filename: '' });

    const applyFilter = (patch: Record<string, string>) => {
        const next: Record<string, string> = { ...filters, ...patch };
        Object.keys(next).forEach((key) => {
            if (!next[key]) delete next[key];
        });
        router.get('/business/library', next, { preserveState: true, preserveScroll: true, replace: true });
    };

    const openRename = (asset: MediaEntity) => {
        renameForm.setData('filename', asset.filename);
        renameForm.clearErrors();
        setRenaming(asset);
    };

    return (
        <BusinessLayout>
            <Head title="Biblioteca" />

            <PageHeader
                eyebrow="Contenido"
                title="Biblioteca"
                description={`${formatNumber(counts.total)} archivos · ${counts.images} imágenes · ${counts.videos} videos · ${formatBytes(totalSize)}`}
                actions={
                    can('business.media.upload') ? (
                        <Button variant="primary" size="sm" onClick={() => setUploadOpen((value) => !value)}>
                            <Plus className="size-4" />
                            Subir contenido
                        </Button>
                    ) : null
                }
            />

            {uploadOpen && can('business.media.upload') ? (
                <div className="mt-6">
                    <UploadDropzone
                        action="/business/library"
                        onUploaded={() => setUploadOpen(false)}
                    />
                </div>
            ) : null}

            <div className="mt-6 rounded-card border border-line bg-card p-4">
                <FilterBar
                    search={filters.search}
                    onSearch={(value) => applyFilter({ search: value })}
                    searchPlaceholder="Buscar por nombre…"
                >
                    <Select value={filters.type ?? 'all'} onValueChange={(value) => applyFilter({ type: value === 'all' ? '' : value })}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los tipos</SelectItem>
                            <SelectItem value="image">Imágenes</SelectItem>
                            <SelectItem value="video">Videos</SelectItem>
                        </SelectContent>
                    </Select>
                </FilterBar>

                <div className="mt-4">
                    {media.data.length === 0 ? (
                        <EmptyState
                            icon={ImageIcon}
                            title="Sin contenido"
                            description="Sube imágenes JPG, PNG, WebP o videos MP4 para empezar."
                        />
                    ) : (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                            {media.data.map((asset) => (
                                <Card key={asset.id} className="group overflow-hidden">
                                    <div className="relative">
                                        <MediaThumbnail media={asset} className="rounded-b-none border-0 border-b" />
                                        <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="secondary" size="icon-sm" aria-label="Acciones">
                                                        <MoreVertical className="size-3.5" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onSelect={() => setPreviewMedia(asset)}>
                                                        <Eye className="size-4" /> Previsualizar
                                                    </DropdownMenuItem>
                                                    {can('business.media.upload') ? (
                                                        <DropdownMenuItem onSelect={() => openRename(asset)}>
                                                            <Pencil className="size-4" /> Renombrar
                                                        </DropdownMenuItem>
                                                    ) : null}
                                                    {can('business.media.delete') ? (
                                                        <DropdownMenuItem variant="danger" onSelect={() => setDeleting(asset)}>
                                                            <Trash2 className="size-4" /> Eliminar
                                                        </DropdownMenuItem>
                                                    ) : null}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                    <CardContent className="space-y-1.5 pt-3">
                                        <p className="truncate text-xs font-medium text-fg">{asset.filename}</p>
                                        <div className="flex items-center justify-between">
                                            <Badge tone={asset.type.value === 'video' ? 'info' : 'neutral'}>
                                                {asset.type.label}
                                            </Badge>
                                            <span className="text-[10px] text-faint">{asset.human_filesize}</span>
                                        </div>
                                        <p className="text-[10px] text-faint">
                                            {asset.resolution ?? '—'}
                                            {asset.formatted_duration ? ` · ${asset.formatted_duration}` : ''}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <StatusBadge value={asset.processing_status} dot={false} />
                                            <span className="text-[10px] text-faint">{formatDate(asset.created_at)}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
                <Pagination paginator={media} />
            </div>

            {/* Preview */}
            <Dialog open={!!previewMedia} onOpenChange={(open) => (!open ? setPreviewMedia(null) : null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{previewMedia?.filename}</DialogTitle>
                    </DialogHeader>
                    <div className="flex max-h-[70vh] items-center justify-center overflow-hidden rounded-control bg-black">
                        {previewMedia?.type.value === 'video' ? (
                            <video src={previewMedia.url} controls autoPlay className="max-h-[70vh] w-full" />
                        ) : previewMedia ? (
                            <img src={previewMedia.url} alt={previewMedia.filename} className="max-h-[70vh] w-full object-contain" />
                        ) : null}
                    </div>
                    <p className="text-xs text-faint">
                        {previewMedia?.resolution ?? '—'} · {previewMedia?.human_filesize} · {previewMedia?.mime_type}
                    </p>
                </DialogContent>
            </Dialog>

            {/* Rename */}
            <Dialog open={!!renaming} onOpenChange={(open) => (!open ? setRenaming(null) : null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Renombrar contenido</DialogTitle>
                    </DialogHeader>
                    <Input
                        value={renameForm.data.filename}
                        onChange={(event) => renameForm.setData('filename', event.target.value)}
                        placeholder="Nombre del archivo"
                    />
                    {renameForm.errors.filename ? (
                        <p className="text-xs text-danger">{renameForm.errors.filename}</p>
                    ) : null}
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setRenaming(null)}>
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            disabled={renameForm.processing}
                            onClick={() => {
                                if (!renaming) return;
                                renameForm.put(`/business/library/${renaming.id}`, {
                                    preserveScroll: true,
                                    onSuccess: () => setRenaming(null),
                                });
                            }}
                        >
                            Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!deleting}
                onOpenChange={(open) => (!open ? setDeleting(null) : null)}
                title={`Eliminar ${deleting?.filename ?? ''}`}
                description="No se puede eliminar contenido que esté dentro de una playlist."
                confirmLabel="Eliminar"
                onConfirm={() => {
                    if (!deleting) return;
                    router.delete(`/business/library/${deleting.id}`, { preserveScroll: true });
                }}
            />

            {!can('business.media.upload') ? (
                <p className="mt-4 flex items-center gap-2 text-[11px] text-faint">
                    <Upload className="size-3.5" /> No tienes permiso para subir contenido.
                </p>
            ) : null}
        </BusinessLayout>
    );
}
