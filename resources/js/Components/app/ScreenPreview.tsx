import { Image as ImageIcon, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/Components/ui/badge';
import { LivePreview } from '@/Components/app/LiveStreamDialog';
import type { DevicePreviewData, PreviewMediaData } from '@/Types/preview';
import { formatRelative } from '@/Utils/format';
import { cn } from '@/Utils/cn';

export type ScreenPreviewData = DevicePreviewData;

function PreviewMedia({ media }: { media: PreviewMediaData | null }) {
    const [failed, setFailed] = useState(false);
    if (!media || failed) {
        return <div className="flex size-full flex-col items-center justify-center gap-2 p-3 text-center text-xs text-white/60">
            <ImageIcon className="size-4" />
            <span>{failed ? 'No se pudo cargar el contenido' : 'Sin contenido confirmado en esta zona'}</span>
        </div>;
    }
    if (media.type === 'live_stream') {
        return media.live ? <LivePreview source={media.live} compact />
            : <span className="p-3 text-xs text-white/60">Directo sin fuente disponible</span>;
    }
    return media.type === 'video' ? (
        <video src={media.url} className="size-full object-contain" muted autoPlay loop playsInline onError={() => setFailed(true)} />
    ) : (
        <img src={media.url} alt="Contenido confirmado" className="size-full object-contain" onError={() => setFailed(true)} />
    );
}

export function ScreenPreview({ preview, className }: { preview: DevicePreviewData | null; className?: string }) {
    if (!preview) {
        return <div className="flex aspect-video items-center justify-center rounded-control border border-dashed border-line bg-inset text-xs text-muted">
            Sin pantallas para previsualizar.
        </div>;
    }
    const { device, layout } = preview;
    const portrait = layout ? layout.rotation % 180 !== 0 : false;
    const stacked = layout?.split === 'top_bottom';
    const zones = [
        { key: 'business', label: 'Negocio', percent: layout?.business_percentage ?? 70, media: preview.business_media },
        { key: 'advertising', label: 'Publicidad', percent: layout?.advertising_percentage ?? 30, media: preview.advertising?.media ?? null },
    ];
    if (layout && !layout.business_first) zones.reverse();

    return <div className={cn('space-y-3', className)}>
        <div className="flex flex-wrap gap-2 text-xs text-fg">
            <Badge>{layout ? `${portrait ? 'Vertical' : 'Horizontal'} · ${layout.rotation}°` : 'Orientación sin confirmar'}</Badge>
            {layout ? <Badge>{stacked ? 'Arriba / abajo' : 'Izquierda / derecha'} · {layout.ratio}</Badge> : null}
        </div>
        <div className={cn('mx-auto rounded-[20px] border border-line-strong bg-[#04080d] p-2.5 shadow-float', portrait ? 'w-full max-w-[280px]' : 'w-full')}>
            <div data-preview-orientation={portrait ? 'portrait' : 'landscape'} data-preview-split={layout?.split}
                className={cn('relative flex overflow-hidden rounded-[12px] bg-black', stacked ? 'flex-col' : 'flex-row')}
                style={{ aspectRatio: portrait ? '9 / 16' : '16 / 9' }}>
                {layout ? zones.map(zone => <div key={zone.key} data-preview-zone={zone.key}
                    className="relative min-h-0 min-w-0 overflow-hidden border border-white/10 bg-black"
                    style={{ flex: `${zone.percent} 1 0%` }}>
                    <PreviewMedia key={zone.media ? `${zone.media.id}:${zone.media.url}` : 'empty'} media={zone.media} />
                    <span className="pointer-events-none absolute bottom-1 left-1 rounded bg-black/80 px-1.5 py-0.5 text-[10px] text-white">
                        {zone.label} · {zone.percent}%
                    </span>
                </div>) : <div className="flex size-full items-center justify-center p-4 text-center text-xs text-white/60">Diseño y contenido aún sin confirmar</div>}
            </div>
        </div>
        <p role="status" className="text-xs text-muted">
            {preview.status === 'unconfirmed' ? 'La TV todavía no ha confirmado un manifiesto.'
                : 'Vista aproximada del contenido confirmado. Sin reporte de reproducción de la TV; no está sincronizada.'}
            {preview.pending_manifest_version ? ' Hay cambios pendientes de confirmar.' : ''}
        </p>
        <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
                <p className="truncate text-sm font-medium text-fg">{device.name}</p>
                <p className="truncate text-xs text-muted">{device.business?.name ?? '—'}{device.location ? ` · ${device.location.name}, ${device.location.city}` : ''}</p>
            </div>
            <Badge tone={device.is_online ? 'positive' : 'danger'} dot>{device.is_online ? 'En línea' : 'Desconectada'}</Badge>
        </div>
        <dl className="grid grid-cols-2 gap-3 border-t border-line pt-3 text-xs">
            <div><dt className="text-faint">Diseño confirmado</dt><dd className="text-fg">{layout?.name ?? '—'}</dd></div>
            <div><dt className="text-faint">Lista del negocio</dt><dd className="text-fg">{preview.playlist?.name ?? '—'}</dd></div>
            <div><dt className="text-faint">Publicidad de muestra</dt><dd className="text-fg">{preview.advertising?.campaign_name ?? 'Sin pauta elegible'}</dd></div>
            <div><dt className="text-faint">Manifiesto confirmado</dt><dd className="metric text-fg">{preview.manifest_version ?? '—'}</dd></div>
            <div><dt className="text-faint">Última sincronización</dt><dd className="text-fg">{formatRelative(preview.last_sync_at)}</dd></div>
            <div><dt className="text-faint">Consulta del dashboard</dt><dd className="flex items-center gap-1 text-fg"><RefreshCw className="size-3" />{formatRelative(preview.checked_at)}</dd></div>
        </dl>
    </div>;
}
