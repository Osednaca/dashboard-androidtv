import type { DeviceEntity } from '@/Types';
import type { LiveSource } from '@/Components/app/LiveStreamDialog';

export interface PreviewMediaData {
    id: number;
    type: 'image' | 'video' | 'live_stream';
    url: string;
    mime_type: string;
    live?: LiveSource | null;
}

export interface DevicePreviewData {
    device: DeviceEntity;
    layout: {
        id: number;
        name: string;
        orientation: string | null;
        rotation: number;
        split: 'top_bottom' | 'side_by_side';
        business_first: boolean;
        business_percentage: number;
        advertising_percentage: number;
        ratio: string;
    } | null;
    business_media: PreviewMediaData | null;
    advertising: { campaign_name: string; media: PreviewMediaData } | null;
    playlist: { id: number; name: string } | null;
    last_sync_at: string | null;
    manifest_version: string | null;
    pending_manifest_version: string | null;
    status: 'approximate' | 'unconfirmed';
    playback_reported: false;
    checked_at: string;
}
