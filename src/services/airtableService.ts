import type { AirtableRecord } from '../types';

const API_KEY = import.meta.env.VITE_AIRTABLE_API_KEY;
const BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID;

// Post-TBR Configuration
const POST_TBR_TABLE = "tbliHNuWXCvnIZKLy";
const POST_TBR_VIEW = "DNT - Vaibhav KAM Pending 10 Days";

// IC Configuration
const IC_BASE_ID = import.meta.env.VITE_AIRTABLE_IC_BASE_ID;
const IC_TABLE = "Info Collection";
const IC_VIEW = "DNT - KAM Pending (IC)";

export const fetchPostTBRRecords = async (): Promise<AirtableRecord[]> => {
    let allRecords: AirtableRecord[] = [];
    let offset: string | null = null;

    try {
        do {
            const url = `https://api.airtable.com/v0/${BASE_ID}/${POST_TBR_TABLE}?view=${encodeURIComponent(POST_TBR_VIEW)}${offset ? `&offset=${offset}` : ""}&pageSize=100`;
            const res = await fetch(url, { headers: { Authorization: API_KEY } });
            const json = await res.json();

            if (!json || !json.records) break;
            allRecords = allRecords.concat(json.records);
            offset = json.offset as string | null;
        } while (offset);
    } catch (error) {
        console.error("Error fetching Post-TBR records:", error);
        // In a real app, we might want to throw or return empty
    }

    return allRecords;
};

export const fetchICRecords = async (): Promise<AirtableRecord[]> => {
    let allRecords: AirtableRecord[] = [];
    let offset: string | null = null;

    try {
        do {
            // Note: The user provided URL had quotes around '100', but standard API is usually number. 
            // Also handling the view name encoding.
            const url = `https://api.airtable.com/v0/${IC_BASE_ID}/${encodeURIComponent(IC_TABLE)}?view=${encodeURIComponent(IC_VIEW)}${offset ? `&offset=${offset}` : ""}&pageSize=100`;

            const res = await fetch(url, { headers: { Authorization: API_KEY } });
            const json = await res.json();

            if (!json || !json.records) break;
            allRecords = allRecords.concat(json.records);
            offset = json.offset as string | null;
        } while (offset);
    } catch (error) {
        console.error("Error fetching IC records:", error);
    }

    return allRecords;
};
export const fetchRecord = async (recordId: string, source: 'POST_TBR' | 'IC'): Promise<AirtableRecord | null> => {
    try {
        const table = source === 'POST_TBR' ? POST_TBR_TABLE : IC_TABLE;
        const base = source === 'POST_TBR' ? BASE_ID : IC_BASE_ID;
        const encodedTable = encodeURIComponent(table);

        // Add timestamp to prevent caching
        const url = `https://api.airtable.com/v0/${base}/${encodedTable}/${recordId}?_t=${Date.now()}`;
        const res = await fetch(url, { headers: { Authorization: API_KEY } });

        if (!res.ok) {
            console.error(`Failed to fetch record ${recordId}: ${res.statusText}`);
            return null;
        }

        const json = await res.json();
        return json;
    } catch (error) {
        console.error("Error fetching record:", error);
        return null;
    }
};
