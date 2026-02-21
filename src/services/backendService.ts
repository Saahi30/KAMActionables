import type { ActionableItem, CommentResponse } from '../types';

const UPDATE_REPLIES_URL = import.meta.env.VITE_BACKEND_UPDATE_URL;
const IDENTITY_ID = import.meta.env.VITE_BACKEND_IDENTITY_ID;

import { fetchRecord } from './airtableService';

export const addComment = async (item: ActionableItem, comment: string): Promise<CommentResponse> => {
    if (!comment || !comment.trim()) {
        throw new Error("Comment can't be empty");
    }

    const now = new Date().toISOString().split("T")[0];

    // The Weekday backend API always uses "internalWeekdayNotes" for both IC and POST_TBR.
    // Writing to any other field name is silently ignored by the API.
    console.log(`[addComment] Source: ${item.source} | jdUid=${item.jdUid} | publicIdentifier=${item.publicIdentifier}`);

    // Fetch latest notes from backend to avoid overwriting concurrent changes
    let existing = item.displayNotes || "";
    try {
        const freshRecord = await fetchRecord(item.id, item.source);
        console.log(`[addComment] Fresh record fields:`, freshRecord?.fields);
        if (freshRecord && freshRecord.fields) {
            existing = freshRecord.fields.internalWeekdayNotes || "";
            console.log(`[addComment] Existing internalWeekdayNotes:`, existing);
        } else {
            console.warn("[addComment] Fresh record returned null — using local displayNotes as fallback");
        }
    } catch (e) {
        console.warn("[addComment] Could not fetch fresh notes, using local state", e);
    }

    // Append style (matches Retool): new entry goes at the BOTTOM so oldest is first
    const newEntry = `[${now}] ${comment.trim()}`;
    const updatedComments = existing ? `${existing}\n${newEntry}` : newEntry;
    console.log(`[addComment] Updated notes:`, updatedComments);

    const payload = {
        jdUid: item.jdUid,
        publicIdentifier: item.publicIdentifier,
        data: {
            internalWeekdayNotes: updatedComments
        }
    };
    console.log(`[addComment] Sending payload:`, JSON.stringify(payload, null, 2));

    try {
        const response = await fetch(UPDATE_REPLIES_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'weekdayidentityid': IDENTITY_ID
            },
            body: JSON.stringify(payload)
        });

        const responseText = await response.text();
        console.log(`[addComment] API ${response.status}:`, responseText.slice(0, 300));

        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText} — ${responseText}`);
        }

        return {
            success: true,
            updatedComments: updatedComments,
            item: payload
        };

    } catch (error) {
        console.error("[addComment] Error:", error);
        throw error;
    }
};

export const markItemComplete = async (item: ActionableItem): Promise<boolean> => {
    const today = new Date().toISOString().split("T")[0];

    // Fetch latest notes to avoid overwriting recent comments
    let existing = item.displayNotes || "";
    try {
        const freshRecord = await fetchRecord(item.id, item.source);
        if (freshRecord && freshRecord.fields) {
            existing = freshRecord.fields.internalWeekdayNotes || "";
        }
    } catch (e) {
        console.warn("Could not fetch fresh notes for completion, using local state", e);
    }

    const marker = `[SUBMITTED: ${today}]`;
    const updatedComments = existing ? `${existing}\n${marker}` : marker;

    const payload = {
        jdUid: item.jdUid,
        publicIdentifier: item.publicIdentifier,
        data: {
            internalWeekdayNotes: updatedComments
        }
    };

    try {
        const res = await fetch(UPDATE_REPLIES_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "weekdayidentityid": IDENTITY_ID
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            throw new Error(await res.text());
        }
        return true;
    } catch (error) {
        console.error("Error marking complete:", error);
        throw error;
    }
};

// Mock function since we don't have the SQL API Endpoint yet
export const fetchComments = async (_ids: number[]): Promise<any[]> => {
    // TODO: Replace with real API call that executes the SQL provided
    console.warn("Fetching comments Mock - No API provided for SQL query");
    return [];
};
