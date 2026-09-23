import type { CampaignEntity } from '@/Types';

export interface TargetInput {
    [key: string]: string | number | boolean;
    target_type: string;
    target_id: number | '';
    target_value: string;
    is_exclusion: boolean;
}

export interface CreativeInput {
    [key: string]: string | number | undefined;
    media_asset_id: number | '';
    duration: number;
    weight: number;
}

export interface FormCampaign extends Omit<CampaignEntity, 'creatives_count'> {
    creatives?: Array<{ media_asset_id: number; duration: number; weight: number }>;
    targets?: Array<{ target_type: string; target_id: number | null; target_value: string | null; is_exclusion: boolean }>;
}

export function initialCampaignValues(campaign: FormCampaign | null) {
    return {
        advertiser_id: campaign?.advertiser ? String(campaign.advertiser.id) : '',
        name: campaign?.name ?? '',
        description: campaign?.description ?? '',
        starts_at: campaign ? campaign.starts_at ?? '' : new Date().toISOString().slice(0, 10),
        ends_at: campaign ? campaign.ends_at ?? '' : new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        daily_start_time: campaign ? campaign.daily_start_time?.slice(0, 5) ?? '' : '07:00',
        daily_end_time: campaign ? campaign.daily_end_time?.slice(0, 5) ?? '' : '22:00',
        days_of_week: campaign ? campaign.days_of_week ?? [] : [1, 2, 3, 4, 5, 6],
        priority: campaign?.priority ?? 5,
        playback_goal: campaign?.playback_goal ?? null,
        impressions_goal: campaign?.impressions_goal ?? null,
        budget: campaign?.budget ?? '',
        publish: false,
        creatives: (campaign?.creatives ?? []).map((creative) => ({ ...creative })) as CreativeInput[],
        targets: (campaign?.targets ?? []).map((target) => ({
            target_type: target.target_type,
            target_id: target.target_id ?? '',
            target_value: target.target_value ?? '',
            is_exclusion: target.is_exclusion,
        })) as TargetInput[],
    };
}
