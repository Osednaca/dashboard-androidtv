import { Image as ImageIcon, Play, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/Components/ui/badge';
import type { DeviceEntity, MediaEntity } from '@/Types';
import { formatRelative } from '@/Utils/format';
import { cn } from '@/Utils/cn';

export interface BusinessPreviewData {
    device: DeviceEntity;
    layout: {
        id: number;
        name: string;
        orientation: string | null;
        business_percentage: number;
        advertising_percentage: number;
        ratio: string;
    } | null;
    business_media: MediaEntity | null;
    advertising: { campaign_name: string; media: MediaEntity } | null;
    playlist: { id: number; name: string } | null;
    last_sync_at: string | null;
}

function PreviewMedia({ media, label }: { media: MediaEntity | null; label: string }) {
    const [failed, setFailed] = useState(false);
    const isVideo = media?.type?.value === 'video';

    if (!media || failed) {
        return (
            <div className="flex size-full flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-[#13273c] to-[#050b12] px-3 text-center">
                <ImageIcon className="size-4 text-white/25" />
                <span className="line-clamp-2 text-[9px] leading-tight text-white/40">
                    {media?.filename ?? label}
                </span>
            </div>
        );
    }

    return isVideo ? (
        <video
            key={media.url}
            src={media.url}
            className="size-full object-cover"
            muted
            autoPlay
            loop
            playsInline
            onError={() => setFailed(true)}
        />
    ) : (
        <img
            src={media.url}
            alt={media.filename}
            className="size-full object-cover"
            onError={() => setFailed(true)}
        />
    );
}

export function BusinessScreenPreview({
    preview,
    className,
}: {
    preview: BusinessPreviewData | null;
    className?: string;
}) {
    if (!preview) {
        return (
            <div className="flex aspect-video items-center justify-center rounded-control border border-dashed border-line bg-inset text-xs text-muted">
                Sin pantallas para previsualizar.
            </div>
        );
    }

    const businessPct = preview.layout?.business_percentage ?? 70;
    const adPct = preview.layout?.advertising_percentage ?? 100 - businessPct;
    const showAds = adPct > 0;
    const device = preview.device;

    return (
        <div className={cn('space-y-3', className)}>
            <div className="rounded-[20px] border border-line-strong bg-[#04080d] p-2.5 shadow-float">
                <div className="relative flex aspect-video overflow-hidden rounded-[12px] bg-black">
                    <div className="relative flex items-center justify-center bg-black" style={{ width: `${businessPct}%` }}>
                        <PreviewMedia media={preview.business_media} label="Sin contenido del negocio" />
                        <span className="absolute left-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-medium text-accent">
                            Tu contenido · {businessPct}%
                        </span>
                    </div>
                    {showAds ? (
                        <div
                            className="relative flex items-center justify-center border-l border-white/10 bg-[#0a0f16]"
                            style={{ width: `${adPct}%` }}
                        >
                            <PreviewMedia media={preview.advertising?.media ?? null} label="Publicidad de la red" />
                            <span className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[9px] text-white/70">
                                Publicidad · {adPct}%
                            </span>
                        </div>
                    ) : null}
                </div>
                <div className="mx-auto mt-2 h-1 w-16 rounded-full bg-line-strong" />
            </div>

            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-fg">{device.name}</p>
                    <p className="truncate text-xs text-muted">
                        {device.location ? `${device.location.name}, ${device.location.city}` : 'Sin ubicación'}
                    </p>
                </div>
                <Badge tone={device.is_online ? 'positive' : 'danger'} dot>
                    {device.is_online ? 'En línea' : 'Desconectada'}
                </Badge>
            </div>

            <dl className="grid grid-cols-2 gap-3 border-t border-line pt-3 text-xs">
                <div>
                    <dt className="text-faint">Layout</dt>
                    <dd className="truncate text-fg">{preview.layout?.name ?? '—'}</dd>
                </div>
                <div>
                    <dt className="text-faint">División</dt>
                    <dd className="metric text-fg">{preview.layout?.ratio ?? '—'}</dd>
                </div>
                <div>
                    <dt className="text-faint">Playlist actual</dt>
                    <dd className="truncate text-fg">{preview.playlist?.name ?? '—'}</dd>
                </div>
                <div>
                    <dt className="text-faint">Última sincronización</dt>
                    <dd className="flex items-center gap-1 text-fg">
                        <RefreshCw className="size-3 text-faint" />
                        {formatRelative(preview.last_sync_at)}
                    </dd>
                </div>
                <div className="col-span-2">
                    <dt className="text-faint">Publicidad actual</dt>
                    <dd className="flex items-center gap-1.5 truncate text-fg">
                        <Play className="size-3 text-faint" />
                        {preview.advertising?.campaign_name ?? 'Sin pauta activa'}
                    </dd>
                </div>
            </dl>
        </div>
    );
}
