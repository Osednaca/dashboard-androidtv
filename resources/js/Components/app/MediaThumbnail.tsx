import { Image as ImageIcon, Play } from 'lucide-react';
import { useState } from 'react';
import type { MediaEntity } from '@/Types';
import { cn } from '@/Utils/cn';

export function MediaThumbnail({
    media,
    className,
}: {
    media: Pick<MediaEntity, 'thumbnail_url' | 'type' | 'filename'> | null | undefined;
    className?: string;
}) {
    const isVideo = media?.type?.value === 'video';
    const [failedUrl, setFailedUrl] = useState<string | null>(null);

    return (
        <div
            className={cn(
                'relative flex aspect-video items-center justify-center overflow-hidden rounded-control border border-line bg-inset',
                className,
            )}
        >
            {media?.thumbnail_url && failedUrl !== media.thumbnail_url && !isVideo ? (
                <img
                    src={media.thumbnail_url}
                    alt={media.filename}
                    loading="lazy"
                    onError={() => setFailedUrl(media.thumbnail_url)}
                    className="size-full object-cover"
                />
            ) : (
                <span className="text-faint">
                    {isVideo ? <Play className="size-5" /> : <ImageIcon className="size-5" />}
                </span>
            )}
            {isVideo ? (
                <span className="absolute bottom-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-black/70 text-accent">
                    <Play className="size-3" />
                </span>
            ) : null}
        </div>
    );
}
