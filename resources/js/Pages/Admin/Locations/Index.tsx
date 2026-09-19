import { Head, Link, router, useForm } from '@inertiajs/react';
import { MapPin, MonitorPlay, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ActionMenu } from '@/Components/app/ActionMenu';
import { ConfirmDialog } from '@/Components/app/ConfirmDialog';
import { DataTable, type Column } from '@/Components/app/DataTable';
import { EmptyState } from '@/Components/app/EmptyState';
import { FilterBar } from '@/Components/app/FilterBar';
import { FormField } from '@/Components/app/FormField';
import { PageHeader } from '@/Components/app/PageHeader';
import { Pagination } from '@/Components/app/Pagination';
import { StatusBadge } from '@/Components/app/StatusBadge';
import { Button } from '@/Components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { AdminLayout } from '@/Layouts/AdminLayout';
import type { LocationEntity, Option, Paginated } from '@/Types';

interface OptionBusiness {
    id: number;
    name: string;
}

export default function LocationsIndex({
    locations,
    filters,
    options,
}: {
    locations: Paginated<LocationEntity>;
    filters: { search?: string; city?: string; status?: string; business_id?: string };
    options: { statuses: Option[]; cities: string[]; businesses: OptionBusiness[] };
}) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<LocationEntity | null>(null);
    const [deleting, setDeleting] = useState<LocationEntity | null>(null);

    const form = useForm({
        business_id: '',
        name: '',
        city: '',
        state: '',
        country: 'Colombia',
        address: '',
        timezone: 'America/Bogota',
        status: 'active',
    });

    const applyFilter = (patch: Record<string, string>) => {
        const next: Record<string, string> = { ...filters, ...patch };
        Object.keys(next).forEach((key) => {
            if (!next[key]) delete next[key];
        });
        router.get('/admin/locations', next, { preserveState: true, preserveScroll: true, replace: true });
    };

    const openCreate = () => {
        form.reset();
        form.clearErrors();
        setEditing(null);
        setOpen(true);
    };

    const openEdit = (location: LocationEntity) => {
        form.setData({
            business_id: String(location.business?.id ?? ''),
            name: location.name,
            city: location.city,
            state: location.state ?? '',
            country: location.country,
            address: location.address ?? '',
            timezone: location.timezone,
            status: location.status.value,
        });
        form.clearErrors();
        setEditing(location);
    };

    const submit = () => {
        const config = {
            onSuccess: () => {
                setOpen(false);
                setEditing(null);
                form.reset();
            },
        };
        if (editing) {
            form.put(`/admin/locations/${editing.id}`, config);
        } else {
            form.post('/admin/locations', config);
        }
    };

    const columns: Array<Column<LocationEntity>> = [
        {
            key: 'name',
            header: 'Ubicación',
            cell: (row) => (
                <div className="min-w-0">
                    <Link href={`/admin/locations/${row.id}`} className="block truncate font-medium text-fg hover:text-accent">
                        {row.name}
                    </Link>
                    <span className="block truncate text-xs text-faint">{row.business?.name}</span>
                </div>
            ),
        },
        { key: 'city', header: 'Ciudad', cell: (row) => <span className="text-muted">{row.city}</span> },
        { key: 'address', header: 'Dirección', cell: (row) => <span className="truncate text-muted">{row.address ?? '—'}</span> },
        {
            key: 'screens',
            header: 'Pantallas',
            cell: (row) => (
                <span className="inline-flex items-center gap-1.5 text-muted">
                    <MonitorPlay className="size-3.5 text-faint" />
                    <span className="metric text-positive">{row.online_devices_count}</span>
                    <span className="metric text-faint">/{row.devices_count}</span>
                </span>
            ),
        },
        { key: 'status', header: 'Estado', cell: (row) => <StatusBadge value={row.status} /> },
        {
            key: 'actions',
            header: '',
            className: 'text-right',
            cell: (row) => (
                <div className="flex justify-end">
                    <ActionMenu
                        items={[
                            { label: 'Ver detalle', icon: MapPin, onSelect: () => router.visit(`/admin/locations/${row.id}`) },
                            { label: 'Editar', icon: Pencil, onSelect: () => openEdit(row) },
                            { label: 'Eliminar', icon: Trash2, variant: 'danger', separatorBefore: true, onSelect: () => setDeleting(row) },
                        ]}
                    />
                </div>
            ),
        },
    ];

    return (
        <AdminLayout>
            <Head title="Ubicaciones" />

            <PageHeader
                title="Ubicaciones"
                description="Puntos físicos donde operan las pantallas."
                actions={
                    <Button variant="primary" size="sm" onClick={openCreate}>
                        <Plus className="size-4" />
                        Nueva ubicación
                    </Button>
                }
            />

            <div className="mt-6 rounded-card border border-line bg-card p-4">
                <FilterBar search={filters.search} onSearch={(value) => applyFilter({ search: value })} searchPlaceholder="Buscar por nombre, ciudad o dirección…">
                    <Select value={filters.city ?? 'all'} onValueChange={(value) => applyFilter({ city: value === 'all' ? '' : value })}>
                        <SelectTrigger className="w-full sm:w-40">
                            <SelectValue placeholder="Ciudad" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas las ciudades</SelectItem>
                            {options.cities.map((city) => (
                                <SelectItem key={city} value={city}>
                                    {city}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={filters.business_id ?? 'all'} onValueChange={(value) => applyFilter({ business_id: value === 'all' ? '' : value })}>
                        <SelectTrigger className="w-full sm:w-48">
                            <SelectValue placeholder="Negocio" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos los negocios</SelectItem>
                            {options.businesses.map((business) => (
                                <SelectItem key={business.id} value={String(business.id)}>
                                    {business.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FilterBar>

                <div className="mt-4">
                    <DataTable
                        columns={columns}
                        rows={locations.data}
                        keyExtractor={(row) => row.id}
                        empty={<EmptyState icon={MapPin} title="Sin ubicaciones" />}
                    />
                </div>
                <Pagination paginator={locations} />
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Editar ubicación' : 'Nueva ubicación'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <FormField label="Negocio" error={form.errors.business_id} className="sm:col-span-2">
                            <Select value={form.data.business_id || undefined} onValueChange={(value) => form.setData('business_id', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un negocio" />
                                </SelectTrigger>
                                <SelectContent>
                                    {options.businesses.map((business) => (
                                        <SelectItem key={business.id} value={String(business.id)}>
                                            {business.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormField>
                        <FormField label="Nombre" error={form.errors.name}>
                            <Input value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} />
                        </FormField>
                        <FormField label="Ciudad" error={form.errors.city}>
                            <Input value={form.data.city} onChange={(e) => form.setData('city', e.target.value)} placeholder="Bogotá" />
                        </FormField>
                        <FormField label="Departamento" error={form.errors.state}>
                            <Input value={form.data.state} onChange={(e) => form.setData('state', e.target.value)} />
                        </FormField>
                        <FormField label="País" error={form.errors.country}>
                            <Input value={form.data.country} onChange={(e) => form.setData('country', e.target.value)} />
                        </FormField>
                        <FormField label="Dirección" error={form.errors.address} className="sm:col-span-2">
                            <Input value={form.data.address} onChange={(e) => form.setData('address', e.target.value)} />
                        </FormField>
                        <FormField label="Estado" error={form.errors.status}>
                            <Select value={form.data.status} onValueChange={(value) => form.setData('status', value)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {options.statuses.map((status) => (
                                        <SelectItem key={status.value} value={status.value}>
                                            {status.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormField>
                        <FormField label="Zona horaria" error={form.errors.timezone}>
                            <Input value={form.data.timezone} onChange={(e) => form.setData('timezone', e.target.value)} />
                        </FormField>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setOpen(false)}>
                            Cancelar
                        </Button>
                        <Button variant="primary" onClick={submit} disabled={form.processing}>
                            {editing ? 'Guardar cambios' : 'Crear ubicación'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!deleting}
                onOpenChange={(value) => (!value ? setDeleting(null) : null)}
                title={`Eliminar ${deleting?.name ?? ''}`}
                description="Las pantallas de esta ubicación quedarán sin asignar."
                confirmLabel="Eliminar ubicación"
                onConfirm={() => {
                    if (!deleting) return;
                    router.delete(`/admin/locations/${deleting.id}`, {
                        onSuccess: () => toast.success('Ubicación eliminada.'),
                    });
                }}
            />
        </AdminLayout>
    );
}
