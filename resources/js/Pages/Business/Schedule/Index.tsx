import { Head, router, useForm } from '@inertiajs/react';
import { CalendarDays, CalendarPlus } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '@/Components/app/ConfirmDialog';
import { EmptyState } from '@/Components/app/EmptyState';
import { PageHeader } from '@/Components/app/PageHeader';
import { ScheduleCard } from '@/Components/app/ScheduleCard';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { usePermissions } from '@/Hooks/usePermissions';
import { BusinessLayout } from '@/Layouts/BusinessLayout';
import type { ContentScheduleEntity, PlaylistSummary } from '@/Types';
import { cn } from '@/Utils/cn';

const weekDays = [
    { value: 1, label: 'L' },
    { value: 2, label: 'M' },
    { value: 3, label: 'M' },
    { value: 4, label: 'J' },
    { value: 5, label: 'V' },
    { value: 6, label: 'S' },
    { value: 7, label: 'D' },
];

export default function ScheduleIndex({
    schedules,
    playlists,
    locations,
}: {
    schedules: ContentScheduleEntity[];
    playlists: PlaylistSummary[];
    locations: Array<{ id: number; name: string; city: string }>;
}) {
    const { can } = usePermissions();
    const canManage = can('business.schedules.manage');

    const [editing, setEditing] = useState<ContentScheduleEntity | null>(null);
    const [open, setOpen] = useState(false);
    const [deleting, setDeleting] = useState<ContentScheduleEntity | null>(null);

    const form = useForm({
        name: '',
        playlist_id: '',
        location_id: '',
        daily_start_time: '08:00',
        daily_end_time: '12:00',
        days_of_week: [] as number[],
        status: 'active',
    });

    const openCreate = () => {
        form.reset();
        form.clearErrors();
        setEditing(null);
        setOpen(true);
    };

    const openEdit = (schedule: ContentScheduleEntity) => {
        form.setData({
            name: schedule.name,
            playlist_id: schedule.playlist ? String(schedule.playlist.id) : '',
            location_id: schedule.location ? String(schedule.location.id) : '',
            daily_start_time: schedule.daily_start_time?.slice(0, 5) ?? '08:00',
            daily_end_time: schedule.daily_end_time?.slice(0, 5) ?? '12:00',
            days_of_week: schedule.days_of_week ?? [],
            status: schedule.status,
        });
        form.clearErrors();
        setEditing(schedule);
        setOpen(true);
    };

    const submit = () => {
        const config = { preserveScroll: true, onSuccess: () => setOpen(false) };
        if (editing) {
            form.put(`/business/schedule/${editing.id}`, config);
        } else {
            form.post('/business/schedule', config);
        }
    };

    const active = schedules.filter((schedule) => schedule.is_active_now);

    return (
        <BusinessLayout>
            <Head title="Programación" />

            <PageHeader
                eyebrow="Contenido"
                title="Programación"
                description="Define qué playlist se reproduce en cada franja horaria."
                actions={
                    canManage ? (
                        <Button variant="primary" size="sm" onClick={openCreate}>
                            <CalendarPlus className="size-4" />
                            Nueva programación
                        </Button>
                    ) : null
                }
            />

            <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-12">
                <Card className="xl:col-span-4">
                    <CardHeader>
                        <CardTitle>Hoy</CardTitle>
                        <Badge tone={active.length > 0 ? 'positive' : 'neutral'}>
                            {active.length > 0 ? 'En curso' : 'Sin franja activa'}
                        </Badge>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {schedules.length === 0 ? (
                            <EmptyState icon={CalendarDays} title="Sin programaciones" />
                        ) : (
                            schedules.map((schedule) => (
                                <div
                                    key={schedule.id}
                                    className={cn(
                                        'flex items-center gap-3 rounded-control border px-3 py-2',
                                        schedule.is_active_now
                                            ? 'border-accent/40 bg-accent/10'
                                            : 'border-line bg-surface',
                                    )}
                                >
                                    <span className="metric w-24 shrink-0 text-xs text-muted">
                                        {schedule.daily_start_time?.slice(0, 5)} – {schedule.daily_end_time?.slice(0, 5)}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-medium text-fg">{schedule.name}</p>
                                        <p className="truncate text-[10px] text-faint">
                                            {schedule.playlist?.name ?? '—'}
                                            {schedule.location ? ` · ${schedule.location.name}` : ' · Todas las ubicaciones'}
                                        </p>
                                    </div>
                                    {schedule.is_active_now ? <span className="size-2 rounded-full bg-accent" /> : null}
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                <div className="space-y-3 xl:col-span-8">
                    {schedules.length === 0 ? (
                        <EmptyState
                            icon={CalendarDays}
                            title="Sin programaciones"
                            description="Crea franjas como Desayuno, Almuerzo o Cena."
                        />
                    ) : (
                        schedules.map((schedule) => (
                            <ScheduleCard
                                key={schedule.id}
                                schedule={schedule}
                                canManage={canManage}
                                onEdit={openEdit}
                                onDelete={setDeleting}
                            />
                        ))
                    )}
                </div>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Editar programación' : 'Nueva programación'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5 sm:col-span-2">
                            <label className="text-xs font-medium text-muted">Nombre</label>
                            <Input
                                value={form.data.name}
                                onChange={(event) => form.setData('name', event.target.value)}
                                placeholder="Ej: Desayuno"
                            />
                            {form.errors.name ? <p className="text-xs text-danger">{form.errors.name}</p> : null}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted">Playlist</label>
                            <Select value={form.data.playlist_id} onValueChange={(value) => form.setData('playlist_id', value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona playlist" />
                                </SelectTrigger>
                                <SelectContent>
                                    {playlists.map((playlist) => (
                                        <SelectItem key={playlist.id} value={String(playlist.id)}>
                                            {playlist.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {form.errors.playlist_id ? <p className="text-xs text-danger">{form.errors.playlist_id}</p> : null}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted">Ubicación</label>
                            <Select value={form.data.location_id || 'all'} onValueChange={(value) => form.setData('location_id', value === 'all' ? '' : value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Todas" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas las ubicaciones</SelectItem>
                                    {locations.map((location) => (
                                        <SelectItem key={location.id} value={String(location.id)}>
                                            {location.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted">Hora de inicio</label>
                            <Input
                                type="time"
                                value={form.data.daily_start_time}
                                onChange={(event) => form.setData('daily_start_time', event.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted">Hora de fin</label>
                            <Input
                                type="time"
                                value={form.data.daily_end_time}
                                onChange={(event) => form.setData('daily_end_time', event.target.value)}
                            />
                            {form.errors.daily_end_time ? (
                                <p className="text-xs text-danger">{form.errors.daily_end_time}</p>
                            ) : null}
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                            <label className="text-xs font-medium text-muted">Días</label>
                            <div className="flex gap-1.5">
                                {weekDays.map((day) => {
                                    const activeDay = form.data.days_of_week.includes(day.value);
                                    return (
                                        <button
                                            key={day.value}
                                            type="button"
                                            onClick={() =>
                                                form.setData(
                                                    'days_of_week',
                                                    activeDay
                                                        ? form.data.days_of_week.filter((value) => value !== day.value)
                                                        : [...form.data.days_of_week, day.value],
                                                )
                                            }
                                            className={cn(
                                                'size-9 rounded-control border text-xs font-medium transition-colors',
                                                activeDay
                                                    ? 'border-accent/40 bg-accent/15 text-accent'
                                                    : 'border-line bg-surface text-muted',
                                            )}
                                        >
                                            {day.label}
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-[11px] text-faint">Sin días seleccionados = todos los días.</p>
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                            <label className="text-xs font-medium text-muted">Estado</label>
                            <Select value={form.data.status} onValueChange={(value) => form.setData('status', value)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Activa</SelectItem>
                                    <SelectItem value="inactive">Inactiva</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setOpen(false)}>
                            Cancelar
                        </Button>
                        <Button variant="primary" onClick={submit} disabled={form.processing}>
                            {editing ? 'Guardar cambios' : 'Crear programación'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!deleting}
                onOpenChange={(value) => (!value ? setDeleting(null) : null)}
                title={`Eliminar ${deleting?.name ?? ''}`}
                description="La franja dejará de reproducirse."
                confirmLabel="Eliminar"
                onConfirm={() => {
                    if (!deleting) return;
                    router.delete(`/business/schedule/${deleting.id}`, { preserveScroll: true });
                }}
            />
        </BusinessLayout>
    );
}
