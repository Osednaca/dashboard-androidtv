import { MonitorPlay, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/Components/ui/badge';
import type { DeviceEntity, MediaEntity } from '@/Types';
import { formatRelative } from '@/Utils/format';
import { cn } from '@/Utils/cn';

export interface ScreenPreviewData {
    device: DeviceEntity;
    business_media: MediaEntity | null;
    advertising: { campaign: { name: string; advertiser: { name: string } | null }; media: MediaEntity } | null;
}

export function ScreenPreview({ preview }: { preview: ScreenPreviewData | null }) {
    if (!preview) {
        return (
            <div className="flex aspect-video items-center justify-center rounded-control border border-dashed border-line bg-inset text-xs text-muted">
                Sin pantallas en línea para previsualizar.
            </div>
        );
    }

    const { device, business_media: businessMedia, advertising } = preview;
    const business = device.current_layout ? 100 - parseFloat(device.current_layout.ratio.split('/')[1] ?? '30') : 70;
    const ads = 100 - business;

    return (
        <div className="space-y-3">
            <div className="rounded-[20px] border border-line-strong bg-[#04080d] p-2.5 shadow-float">
                <div className="relative flex aspect-video overflow-hidden rounded-[12px] bg-black">
                    <div className="relative flex items-center justify-center" style={{ width: `${business}%` }}>
                        {businessMedia ? (
                            <>
                                <img
                                    src={businessMedia.url}
                                    alt=""
                                    className="size-full object-cover"
                                    onError={(event) => {
                                        (event.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                                <span className="absolute bottom-2 left-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white/80">
                                    Contenido del negocio · {business}%
                                </span>
                            </>
                        ) : (
                            <span className="text-[10px] text-white/40">Sin contenido asignado</span>
                        )}
                    </div>
                    <div
                        className="relative flex items-center justify-center border-l border-white/10 bg-[#0a0f16]"
                        style={{ width: `${ads}%` }}
                    >
                        {advertising ? (
                            <>
                                <img
                                    src={advertising.media.url}
                                    alt=""
                                    className="size-full object-cover"
                                    onError={(event) => {
                                        (event.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                                <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-accent">
                                    Publicidad · {ads}%
                                </span>
                            </>
                        ) : (
                            <span className="text-[10px] text-white/40">Sin pauta activa</span>
                        )}
                    </div>
                </div>
                <div className="mx-auto mt-2 h-1 w-16 rounded-full bg-line-strong" />
            </div>

            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-fg">{device.name}</p>
                    <p className="truncate text-xs text-muted">
                        {device.business?.name ?? '—'}
                        {device.location ? ` · ${device.location.name}, ${device.location.city}` : ''}
                    </p>
                </div>
                <Badge tone={device.is_online ? 'positive' : 'danger'} dot>
                    {device.is_online ? 'En línea' : 'Desconectada'}
                </Badge>
            </div>

            <dl className="grid grid-cols-2 gap-3 border-t border-line pt-3 text-xs">
                <div>
                    <dt className="text-faint">Layout</dt>
                    <dd className="text-fg">{device.current_layout?.name ?? '—'}</dd>
                </div>
                <div>
                    <dt className="text-faint">Campaña actual</dt>
                    <dd className="truncate text-fg">{advertising?.campaign.name ?? 'Sin pauta'}</dd>
                </div>
                <div>
                    <dt className="text-faint">Manifiesto</dt>
                    <dd className="metric truncate text-fg">{device.current_manifest_version ?? '—'}</dd>
                </div>
                <div>
                    <dt className="text-faint">Última sincronización</dt>
                    <dd className="flex items-center gap-1 text-fg">
                        <RefreshCw className="size-3 text-faint" />
                        {formatRelative(device.last_sync_at)}
                    </dd>
                </div>
            </dl>

            <div className={cn('flex items-center gap-2 text-xs', device.is_online ? 'text-positive' : 'text-danger')}>
                {device.is_online ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5" />}
                {device.is_online ? 'Reproduciendo' : 'Sin conexión'}
                <MonitorPlay className="ml-auto size-3.5 text-faint" />
                <span className="metric text-faint">{device.app_version ?? '—'}</span>
            </div>
        </div>
    );
}
