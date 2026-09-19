import { Head, router, useForm } from '@inertiajs/react';
import { Grid2X2, Image as ImageIcon, List, Plus, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { DataTable, type Column } from '@/Components/app/DataTable';
import { EmptyState } from '@/Components/app/EmptyState';
import { FilterBar } from '@/Components/app/FilterBar';
import { MediaThumbnail } from '@/Components/app/MediaThumbnail';
import { PageHeader } from '@/Components/app/PageHeader';
import { Pagination } from '@/Components/app/Pagination';
import { StatusBadge } from '@/Components/app/StatusBadge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { AdminLayout } from '@/Layouts/AdminLayout';
import type { MediaEntity, Option, Paginated } from '@/Types';
import { formatDate } from '@/Utils/format';
import { cn } from '@/Utils/cn';

export default function CreativesIndex({
    assets,
    filters,
    options,
}: {
    assets: Paginated<MediaEntity>;
    filters: { search?: string; type?: string; processing_status?: string };
    options: { types: Option[]; statuses: Option[]; advertisers: Array<{ id: number; name: string }>; businesses: Array<{ id: number; name: string }> };
}) {
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [uploading, setUploading] = useState(false);
    const [deleting, setDeleting] = useState<MediaEntity | null>(null);

    const form = useForm<{ file: File | null; advertiser_id: string; business_id: string }>({
        file: null,
        advertiser_id: '',
        business_id: '',
    });

    const applyFilter = (patch: Record<string, string>) => {
        const next: Record<string, string> = { ...filters, ...patch };
        Object.keys(next).forEach((key) => {
            if (!next[key]) delete next[key];
        });
        router.get('/admin/creatives', next, { preserveState: true, preserveScroll: true, replace: true });
    };

    const submitUpload = () => {
        form.post('/admin/creatives', {
            forceFormData: true,
            onSuccess: () => {
                setUploading(false);
                form.reset();
                toast.success('Archivo subido. Se está procesando.');
            },
        });
    };

    const columns: Array<Column<MediaEntity>> = [
        {
            key: 'file',
            header: 'Archivo',
            cell: (row) => (
                <div className="flex items-center gap-3">
                    <MediaThumbnail media={row} className="w-16" />
                    <div className="min-w-0">
                        <p className="truncate font-medium text-fg">{row.filename}</p>
                        <p className="text-xs text-faint">{row.mime_type}</p>
                    </div>
                </div>
            ),
        },
        { key: 'type', header: 'Tipo', cell: (row) => <span className="text-muted">{row.type.label}</span> },
        { key: 'resolution', header: 'Resolución', cell: (row) => <span className="metric text-muted">{row.resolution ?? '—'}</span> },
        { key: 'duration', header: 'Duración', cell: (row) => <span className="metric text-muted">{row.formatted_duration ?? '—'}</span> },
        { key: 'size', header: 'Tamaño', cell: (row) => <span className="metric text-muted">{row.human_filesize}</span> },
        { key: 'status', header: 'Proceso', cell: (row) => <StatusBadge value={row.processing_status} /> },
        { key: 'usage', header: 'Usos', cell: (row) => <span className="metric text-fg">{row.usage_count}</span> },
        {
            key: 'actions',
            header: '',
            className: 'text-right',
            cell: (row) => (
                <Button variant="ghost" size="icon-sm" onClick={() => setDeleting(row)} aria-label="Eliminar">
                    <Trash2 className="size-4 text-danger" />
                </Button>
            ),
        },
    ];

    return (
        <AdminLayout>
            <Head title="Creatividades" />

            <PageHeader
                title="Creatividades"
                description="Biblioteca de imágenes y videos para las campañas."
                actions={
                    <>
                        <div className="flex overflow-hidden rounded-control border border-line">
                            <button
                                type="button"
                                onClick={() => setView('grid')}
                                className={cn('p-2', view === 'grid' ? 'bg-elevated text-fg' : 'text-faint')}
                                aria-label="Vista de cuadrícula"
                            >
                                <Grid2X2 className="size-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setView('list')}
                                className={cn('p-2', view === 'list' ? 'bg-elevated text-fg' : 'text-faint')}
                                aria-label="Vista de lista"
                            >
                                <List className="size-4" />
                            </button>
                        </div>
                        <Button variant="primary" size="sm" onClick={() => setUploading(true)}>
                            <Plus className="size-4" />
                            Subir creatividad
                        </Button>
                    </>
                }
            />

            <div className="mt-6 rounded-card border border-line bg-card p-4">
                <FilterBar search={filters.search} onSearch={(value) => applyFilter({ search: value })} searchPlaceholder="Buscar por nombre de archivo…">
                    <Select value={filters.type ?? 'all'} onValueChange={(value) => applyFilter({ type: value === 'all' ? '' : value })}>
                        <SelectTrigger className="w-full sm:w-36">
                            <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los tipos</SelectItem>
                            {options.types.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={filters.processing_status ?? 'all'} onValueChange={(value) => applyFilter({ processing_status: value === 'all' ? '' : value })}>
                        <SelectTrigger className="w-full sm:w-40">
                            <SelectValue placeholder="Proceso" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los estados</SelectItem>
                            {options.statuses.map((status) => (
                                <SelectItem key={status.value} value={status.value}>
                                    {status.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FilterBar>

                <div className="mt-4">
                    {assets.data.length === 0 ? (
                        <EmptyState icon={ImageIcon} title="Sin creatividades" description="Sube imágenes JPG, PNG, WebP o videos MP4." />
                    ) : view === 'grid' ? (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                            {assets.data.map((asset) => (
                                <Card key={asset.id} className="group">
                                    <CardContent className="space-y-2 pt-4">
                                        <MediaThumbnail media={asset} />
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="truncate text-xs text-fg">{asset.filename}</p>
                                                <p className="text-[11px] text-faint">
                                                    {asset.resolution ?? '—'} · {asset.human_filesize}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setDeleting(asset)}
                                                className="opacity-0 transition-opacity group-hover:opacity-100"
                                                aria-label="Eliminar"
                                            >
                                                <Trash2 className="size-3.5 text-danger" />
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <StatusBadge value={asset.processing_status} />
                                            <span className="text-[11px] text-faint">{asset.usage_count} usos</span>
                                        </div>
                                        <p className="text-[10px] text-faint">{formatDate(asset.created_at)}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <DataTable columns={columns} rows={assets.data} keyExtractor={(row) => row.id} empty={<EmptyState icon={ImageIcon} title="Sin creatividades" />} />
                    )}
                </div>
                <Pagination paginator={assets} />
            </div>

            <Dialog open={uploading} onOpenChange={setUploading}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Subir creatividad</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="file">Archivo</Label>
                            <label
                                htmlFor="file"
                                className="flex cursor-pointer flex-col items-center gap-2 rounded-control border border-dashed border-line-strong bg-inset px-4 py-8 text-center transition-colors hover:border-accent/50"
                            >
                                <Upload className="size-5 text-faint" />
                                <span className="text-xs text-muted">
                                    {form.data.file ? form.data.file.name : 'Arrastra o selecciona JPG, PNG, WebP o MP4 (máx. 500 MB)'}
                                </span>
                                <input
                                    id="file"
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.webp,.mp4"
                                    className="hidden"
                                    onChange={(event) => form.setData('file', event.target.files?.[0] ?? null)}
                                />
                            </label>
                            {form.errors.file ? <p className="text-xs text-danger">{form.errors.file}</p> : null}
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <Label>Anunciante (opcional)</Label>
                                <Select value={form.data.advertiser_id || undefined} onValueChange={(value) => form.setData('advertiser_id', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sin anunciante" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {options.advertisers.map((advertiser) => (
                                            <SelectItem key={advertiser.id} value={String(advertiser.id)}>
                                                {advertiser.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Negocio (opcional)</Label>
                                <Select value={form.data.business_id || undefined} onValueChange={(value) => form.setData('business_id', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sin negocio" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {options.businesses.map((business) => (
                                            <SelectItem key={business.id} value={String(business.id)}>
                                                {business.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setUploading(false)}>
                            Cancelar
                        </Button>
                        <Button variant="primary" onClick={submitUpload} disabled={form.processing || !form.data.file}>
                            Subir archivo
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!deleting} onOpenChange={(open) => (!open ? setDeleting(null) : null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Eliminar creatividad</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-muted">
                        ¿Eliminar <span className="text-fg">{deleting?.filename}</span>? No se puede eliminar una
                        creatividad usada por una campaña activa.
                    </p>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setDeleting(null)}>
                            Cancelar
                        </Button>
                        <Button
                            variant="danger"
                            onClick={() => {
                                if (!deleting) return;
                                router.delete(`/admin/creatives/${deleting.id}`, {
                                    preserveScroll: true,
                                    onSuccess: () => setDeleting(null),
                                });
                            }}
                        >
                            Eliminar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
