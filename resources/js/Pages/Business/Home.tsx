import { Head, Link, router } from '@inertiajs/react';
import {
    CalendarDays,
    Image as ImageIcon,
    ListVideo,
    MonitorPlay,
    PlayCircle,
    Plus,
    RefreshCw,
    Upload,
    Volume2,
} from 'lucide-react';
import { BusinessScreenPreview, type BusinessPreviewData } from '@/Components/app/BusinessScreenPreview';
import { MediaThumbnail } from '@/Components/app/MediaThumbnail';
import { PageHeader } from '@/Components/app/PageHeader';
import { StatCard } from '@/Components/app/StatCard';
import { StatusBadge } from '@/Components/app/StatusBadge';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Progress } from '@/Components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { usePermissions } from '@/Hooks/usePermissions';
import { BusinessLayout } from '@/Layouts/BusinessLayout';
import type {
    BusinessProfile,
    ContentScheduleEntity,
    DeviceEntity,
    MediaEntity,
    PlaylistSummary,
} from '@/Types';
import { formatDuration, formatNumber, formatRelative, formatTime } from '@/Utils/format';

interface HomeProps {
    business: BusinessProfile;
    kpis: {
        screens: { online: number; total: number };
        media: { total: number; images: number; videos: number };
        schedules: { active: number; total: number };
        last_sync_at: string | null;
    };
    playlists: PlaylistSummary[];
    schedules: ContentScheduleEntity[];
    recentMedia: MediaEntity[];
    devices: DeviceEntity[];
    preview: BusinessPreviewData | null;
    selectedDeviceId: number | null;
    audioVolume: number;
}

export default function BusinessHome({
    business,
    kpis,
    playlists,
    schedules,
    recentMedia,
    devices,
    preview,
    selectedDeviceId,
    audioVolume,
}: HomeProps) {
    const { can } = usePermissions();
    const allOnline = kpis.screens.total > 0 && kpis.screens.online === kpis.screens.total;

    const selectDevice = (id: string) => {
        router.get('/business/dashboard', { device: id }, { preserveState: true, preserveScroll: true, only: ['preview', 'selectedDeviceId'] });
    };

    return (
        <BusinessLayout>
            <Head title="Inicio" />

            <PageHeader
                eyebrow="Panel del negocio"
                title={`¡Hola, ${business.name}!`}
                description="Tu contenido está llegando a más personas. Aquí tienes un resumen de tu negocio."
                actions={
                    <>
                        <div className="hidden items-center gap-2 rounded-control border border-line bg-surface px-3 py-2 text-xs text-muted sm:flex">
                            <CalendarDays className="size-3.5 text-faint" />
                            Hoy ·{' '}
                            {new Date().toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </div>
                        {can('business.media.upload') ? (
                            <Button variant="primary" size="sm" asChild>
                                <Link href="/business/library">
                                    <Plus className="size-4" />
                                    Subir contenido
                                </Link>
                            </Button>
                        ) : null}
                    </>
                }
            />

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    label="Pantallas conectadas"
                    value={`${kpis.screens.online} / ${kpis.screens.total}`}
                    hint={allOnline ? 'Todas en línea' : `${kpis.screens.total - kpis.screens.online} desconectada(s)`}
                    icon={MonitorPlay}
                    meter={kpis.screens.total > 0 ? (kpis.screens.online / kpis.screens.total) * 100 : 0}
                />
                <StatCard
                    label="Contenido activo"
                    value={kpis.media.total}
                    hint={`${kpis.media.images} imágenes · ${kpis.media.videos} videos`}
                    icon={ImageIcon}
                    delay={80}
                />
                <StatCard
                    label="Promociones programadas"
                    value={kpis.schedules.active}
                    hint={kpis.schedules.active > 0 ? 'Hoy en reproducción' : 'Sin programaciones'}
                    icon={CalendarDays}
                    delay={160}
                />
                <StatCard
                    label="Última sincronización"
                    value={formatRelative(kpis.last_sync_at)}
                    hint="Todo actualizado"
                    icon={RefreshCw}
                    delay={240}
                />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
                <Card className="xl:col-span-6">
                    <CardHeader>
                        <div>
                            <CardTitle>Vista previa en vivo</CardTitle>
                            <p className="mt-0.5 text-xs text-muted">Simulación de tu pantalla con el layout actual</p>
                        </div>
                        {preview?.device.is_online ? (
                            <span className="inline-flex items-center gap-1.5 text-xs text-positive">
                                <span className="size-1.5 animate-pulse rounded-full bg-positive" /> En reproducción
                            </span>
                        ) : null}
                    </CardHeader>
                    <CardContent>
                        <BusinessScreenPreview preview={preview} />
                        <div className="mt-4 flex flex-wrap items-center gap-2">
                            <Select value={String(selectedDeviceId ?? '')} onValueChange={selectDevice}>
                                <SelectTrigger className="w-full sm:w-56">
                                    <SelectValue placeholder="Seleccionar pantalla" />
                                </SelectTrigger>
                                <SelectContent>
                                    {devices.map((device) => (
                                        <SelectItem key={device.id} value={String(device.id)}>
                                            {device.name}
                                            {device.is_online ? '' : ' · desconectada'}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Badge tone="neutral">
                                Diseño {preview?.layout?.ratio ?? '—'}
                            </Badge>
                            <Button variant="ghost" size="sm" asChild className="ml-auto">
                                <Link href="/business/preview">Ver en pantalla completa</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="xl:col-span-3">
                    <CardHeader>
                        <CardTitle>Playlists</CardTitle>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/business/playlists">Ver todas</Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {playlists.length === 0 ? (
                            <p className="rounded-control border border-dashed border-line px-3 py-8 text-center text-xs text-faint">
                                Aún no tienes playlists.
                            </p>
                        ) : (
                            playlists.slice(0, 5).map((playlist) => (
                                <Link
                                    key={playlist.id}
                                    href={`/business/playlists/${playlist.id}`}
                                    className="flex items-center gap-3 rounded-control border border-line bg-surface p-2 transition-colors hover:border-line-strong"
                                >
                                    <MediaThumbnail media={playlist.cover} className="w-14 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-medium text-fg">{playlist.name}</p>
                                        <p className="text-[10px] text-faint">
                                            {playlist.items_count} elementos · {formatDuration(playlist.total_duration)}
                                        </p>
                                    </div>
                                    <PlayCircle className="size-5 shrink-0 text-accent" />
                                </Link>
                            ))
                        )}
                    </CardContent>
                </Card>

                <Card className="xl:col-span-3">
                    <CardHeader>
                        <CardTitle>Programación de hoy</CardTitle>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/business/schedule">Ver calendario</Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {schedules.length === 0 ? (
                            <p className="rounded-control border border-dashed border-line px-3 py-8 text-center text-xs text-faint">
                                Sin programaciones.
                            </p>
                        ) : (
                            schedules.map((schedule) => (
                                <div
                                    key={schedule.id}
                                    className="flex items-center gap-3 rounded-control border border-line bg-surface px-3 py-2"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-medium text-fg">{schedule.name}</p>
                                        <p className="text-[10px] text-faint">
                                            {formatTime(schedule.daily_start_time)} – {formatTime(schedule.daily_end_time)}
                                            {schedule.playlist ? ` · ${schedule.playlist.name}` : ''}
                                        </p>
                                    </div>
                                    {schedule.is_active_now ? <Badge tone="positive" dot>En curso</Badge> : null}
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
                <Card className="xl:col-span-6">
                    <CardHeader>
                        <CardTitle>Biblioteca reciente</CardTitle>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/business/library">Ver biblioteca</Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                            {recentMedia.map((media) => (
                                <div key={media.id} className="space-y-1.5">
                                    <MediaThumbnail media={media} />
                                    <p className="truncate text-[11px] text-fg">{media.filename}</p>
                                    <p className="text-[10px] text-faint">
                                        {media.type.label}
                                        {media.formatted_duration ? ` · ${media.formatted_duration}` : ''}
                                    </p>
                                </div>
                            ))}
                            {can('business.media.upload') ? (
                                <Link
                                    href="/business/library"
                                    className="flex aspect-video flex-col items-center justify-center gap-1 rounded-control border border-dashed border-line text-faint transition-colors hover:border-accent/50 hover:text-accent"
                                >
                                    <Plus className="size-4" />
                                    <span className="text-[10px]">Subir contenido</span>
                                </Link>
                            ) : null}
                        </div>
                    </CardContent>
                </Card>

                <Card className="xl:col-span-4">
                    <CardHeader>
                        <CardTitle>Dispositivos</CardTitle>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/business/screens">Ver todos</Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="px-0">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-y border-line text-[10px] uppercase tracking-wider text-faint">
                                    <th className="px-5 py-2 text-left font-semibold">Nombre</th>
                                    <th className="px-2 py-2 text-left font-semibold">Ubicación</th>
                                    <th className="px-2 py-2 text-left font-semibold">Estado</th>
                                    <th className="px-5 py-2 text-right font-semibold">Últ. sinc.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {devices.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-5 py-8 text-center text-faint">
                                            Sin pantallas.
                                        </td>
                                    </tr>
                                ) : (
                                    devices.map((device) => (
                                        <tr
                                            key={device.id}
                                            onClick={() => router.visit(`/business/screens/${device.id}`)}
                                            className="cursor-pointer border-b border-line/60 last:border-0 hover:bg-surface/60"
                                        >
                                            <td className="px-5 py-2.5 text-fg">{device.name}</td>
                                            <td className="px-2 py-2.5 text-muted">{device.location?.name ?? '—'}</td>
                                            <td className="px-2 py-2.5">
                                                <StatusBadge value={device.status} />
                                            </td>
                                            <td className="px-5 py-2.5 text-right text-muted">
                                                {formatRelative(device.last_sync_at)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                <Card className="xl:col-span-2">
                    <CardHeader>
                        <CardTitle>Audio y sincronización</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <div className="mb-1.5 flex items-center justify-between text-xs">
                                <span className="flex items-center gap-1.5 text-muted">
                                    <Volume2 className="size-3.5 text-faint" /> Audio
                                </span>
                                <span className="metric text-fg">{audioVolume}%</span>
                            </div>
                            <Progress value={audioVolume} />
                        </div>
                        <div className="rounded-control border border-line bg-surface px-3 py-2 text-xs">
                            <p className="flex items-center gap-1.5 text-muted">
                                <ListVideo className="size-3.5 text-faint" /> Sincronización
                            </p>
                            <p className="mt-0.5 text-fg">{formatRelative(kpis.last_sync_at)}</p>
                        </div>
                        <p className="text-[10px] text-faint">
                            {formatNumber(kpis.media.total)} contenidos en tu biblioteca.
                        </p>
                        {can('business.media.upload') ? (
                            <Button variant="secondary" size="sm" className="w-full" asChild>
                                <Link href="/business/library">
                                    <Upload className="size-4" />
                                    Subir contenido
                                </Link>
                            </Button>
                        ) : null}
                    </CardContent>
                </Card>
            </div>
        </BusinessLayout>
    );
}
