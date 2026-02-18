import type { ActionableItem, CommentResponse } from '../types';

const UPDATE_REPLIES_URL = import.meta.env.VITE_BACKEND_UPDATE_URL;
const IDENTITY_ID = import.meta.env.VITE_BACKEND_IDENTITY_ID;

import { fetchRecord } from './airtableService';

export const addComment = async (item: ActionableItem, comment: string): Promise<CommentResponse> => {
    if (!comment || !comment.trim()) {
        throw new Error("Comment can't be empty");
    }

    const now = new Date().toISOString().split("T")[0];

    // Fetch latest notes to avoid overwriting
    let existing = item.displayNotes || "";
    try {
        const freshRecord = await fetchRecord(item.id, item.source);
        if (freshRecord && freshRecord.fields) {
            existing = freshRecord.fields.internalWeekdayNotes || "";
        } else {
            console.warn("Fresh record fetch returned null or no fields.");
        }
    } catch (e) {
        console.warn("Could not fetch fresh notes, using local state", e);
    }

    const newEntry = `[${now}] ${comment.trim()}`;
    const updatedComments = existing ? `${newEntry}\n${existing}` : newEntry;

    const payload = {
        jdUid: item.jdUid,
        publicIdentifier: item.publicIdentifier,
        data: {
            internalWeekdayNotes: updatedComments
        }
    };

    try {
        const response = await fetch(UPDATE_REPLIES_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'weekdayidentityid': IDENTITY_ID
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }

        // The user's snippet doesn't show the actual response format of the fetch, 
        // but the wrapper returns a success object. We'll assume the API returns JSON or we just return success.
        // For now, let's return the structured response the UI expects.

        return {
            success: true,
            updatedComments: updatedComments,
            item: payload
        };

    } catch (error) {
        console.error("Error adding comment:", error);
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

    const marker = `[COMPLETED: ${today}]`;
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
