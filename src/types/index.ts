export type Severity = 'extreme' | 'critical' | 'high' | 'medium' | 'low';

export interface ActionableItem {
    id: string;
    candidateName: string;
    company: string;
    role: string;
    status: string;
    pendingDays: number;
    severity: Severity;
    roleActive: boolean | string; // Airtable might return string or boolean
    schedulerNotes: string;
    kam: string;
    source: 'POST_TBR' | 'IC';
    jdUid: number;
    publicIdentifier: string;
    platformLink: string;
    interviewProcessFinal: string;
    stage: string;
    displayNotes: string; // Internal comments
    snoozeUntil: string | null; // YYYY-MM-DD
    raw: any; // Keep original record for debugging/updates
}

export interface AirtableRecord {
    id: string;
    fields: Record<string, any>;
    createdTime: string;
}

export interface CommentResponse {
    success: boolean;
    updatedComments: string;
    item: {
        jdUid: number;
        publicIdentifier: string;
        data: Record<string, string>;
    };
}

export interface KamStat {
    name: string;
    count: number;
}
