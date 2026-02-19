import type { ActionableItem, AirtableRecord, Severity } from '../types';

export const normalizePostTBR = (records: AirtableRecord[]): ActionableItem[] => {
    return records.map(r => {
        const f = r.fields || {};
        const days = Number(f["Update Pending since"] || 0);

        let severity: Severity = "low";
        if (days >= 45) severity = "extreme";
        else if (days >= 30) severity = "critical";
        else if (days >= 15) severity = "high";
        else if (days >= 10) severity = "medium";

        const internalNotes = f.internalWeekdayNotes || f.weekdayComments || "";

        // Use LAST snooze match (Retool appends, so newest snooze is at the bottom)
        const allSnoozeMatches = [...internalNotes.matchAll(/\[SNOOZE:\s*(\d{4}-\d{2}-\d{2})\]/g)];
        const snoozeMatch = allSnoozeMatches.length > 0 ? allSnoozeMatches[allSnoozeMatches.length - 1] : null;

        return {
            id: r.id,
            candidateName: f.candidateName || "Unknown Candidate",
            company: f["Company Name"] || "Unknown Company",
            role: f.jobRole || "Unknown Role",
            status: f["Post TBR Status"] || "Unknown Status",
            pendingDays: days,
            severity,
            roleActive: f["isRoleActive? (from KAM JD Interface) (from jdUidMapper)"],
            schedulerNotes: f["Scheduler Notes"] || "",
            kam: Array.isArray(f["Account Manager (from companyMapperViaUid) (from uidMapped)"])
                ? (f["Account Manager (from companyMapperViaUid) (from uidMapped)"][0] || "")
                : (f["Account Manager (from companyMapperViaUid) (from uidMapped)"] || ""),
            source: "POST_TBR" as const,
            jdUid: Number(f.jdUid),
            publicIdentifier: f.publicIdentifier || "",
            platformLink: f["Candidate Platform Link"] || "#",
            interviewProcessFinal: f["interviewProcessFinal"] || "",
            stage: f.conversationStatus || "",
            displayNotes: f.internalWeekdayNotes || "",
            snoozeUntil: snoozeMatch ? snoozeMatch[1] : null,
            raw: f
        };
    });
};

export const normalizeICData = (records: AirtableRecord[]): ActionableItem[] => {
    return records.map(r => {
        const f = r.fields || {};

        // Extract pending days from Airtable's pre-calculated "Pending Since" field
        const days = Number(f["Pending Since"] || 0);

        let severity: Severity = "low";
        if (days >= 45) severity = "extreme";
        else if (days >= 30) severity = "critical";
        else if (days >= 15) severity = "high";
        else if (days >= 10) severity = "medium";

        // KAM writes land in internalWeekdayNotes (same field as POST_TBR, via Weekday API)
        // Use LAST snooze match — Retool appends, so newest snooze is at the bottom
        const kamNotes = f.internalWeekdayNotes || "";
        const allIcSnoozeMatches = [...kamNotes.matchAll(/\[SNOOZE:\s*(\d{4}-\d{2}-\d{2})\]/g)];
        const snoozeMatch = allIcSnoozeMatches.length > 0 ? allIcSnoozeMatches[allIcSnoozeMatches.length - 1] : null;

        // Extract candidate name
        const candidateName = f.candidateName || f.Name || f["Candidate Name"] || "Unknown Candidate";

        // Extract company - companyName is the correct field for IC!
        let company = "Unknown Company";
        if (f.companyName) {
            company = Array.isArray(f.companyName) ? f.companyName[0] : f.companyName;
        } else if (f["Company Name"]) {
            company = Array.isArray(f["Company Name"]) ? f["Company Name"][0] : f["Company Name"];
        } else if (f.company) {
            company = Array.isArray(f.company) ? f.company[0] : f.company;
        } else if (f.Company) {
            company = Array.isArray(f.Company) ? f.Company[0] : f.Company;
        } else if (f["company (from jdUidMapper)"]) {
            company = Array.isArray(f["company (from jdUidMapper)"]) ? f["company (from jdUidMapper)"][0] : f["company (from jdUidMapper)"];
        }

        // Extract role - "Job Role" is the correct field for IC!
        let role = "Unknown Role";
        if (f["Job Role"]) {
            role = Array.isArray(f["Job Role"]) ? f["Job Role"][0] : f["Job Role"];
        } else if (f.jobRole) {
            role = Array.isArray(f.jobRole) ? f.jobRole[0] : f.jobRole;
        } else if (f.role) {
            role = Array.isArray(f.role) ? f.role[0] : f.role;
        } else if (f.Designation) {
            role = Array.isArray(f.Designation) ? f.Designation[0] : f.Designation;
        }

        // Extract status - "Info Call Status" is the main field
        const status = f["Info Call Status"] || f["IC Status"] || f["Post TBR Status"] || f.conversationStatus || "Unknown Status";

        // Extract account manager
        let kam = "";
        const kamField = f["Account Manager (from companyMapperViaUid) (from uidMapped)"] || f["Account Manager"] || f.kam;
        if (kamField) {
            kam = Array.isArray(kamField) ? kamField[0] : kamField;
        }

        // displayNotes = KAM comments (internalWeekdayNotes) + original IC notes + Slack link
        const icNotes = f["IC Caller Notes"] || "";
        const slackLink = f["Flagged Slack Link"] || "";
        const parts = [kamNotes, icNotes, slackLink].filter(Boolean);
        const displayNotes = parts.join("\n").trim();

        return {
            id: r.id,
            candidateName,
            company,
            role,
            status,
            pendingDays: days,
            severity,
            roleActive: f["isRoleActive? (from KAM JD Interface) (from jdUidMapper)"] ?? true,
            schedulerNotes: f["Scheduler Notes"] || "",
            kam,
            source: "IC" as const,
            jdUid: Number(f.jdUid || f["JD UID"] || 0),
            publicIdentifier: f.publicIdentifier || f["Public Identifier"] || "",
            platformLink: f["PF Link"] || f["Candidate Dashboard"] || f["Candidate Platform Link"] || "#",
            interviewProcessFinal: "",
            stage: f.conversationStatus || "",
            displayNotes,
            snoozeUntil: snoozeMatch ? snoozeMatch[1] : null,
            raw: f
        };
    });
}

export const mergeActionables = (baseItems: ActionableItem[], commentsRaw: any): ActionableItem[] => {
    let comments: any[] = [];

    // If it's already an array of objects, use it
    if (Array.isArray(commentsRaw)) {
        comments = commentsRaw;
    } else if (commentsRaw && typeof commentsRaw === "object") {
        // Columnar shape handling
        const keys = Object.keys(commentsRaw || {});
        const len = commentsRaw[keys[0]] ? commentsRaw[keys[0]].length : 0;
        for (let i = 0; i < len; i++) {
            const row: any = {};
            keys.forEach(k => {
                row[k] = Array.isArray(commentsRaw[k]) ? commentsRaw[k][i] : commentsRaw[k];
            });
            comments.push(row);
        }
    }

    // Build comment map
    const commentMap: Record<string, string> = {};
    comments.forEach(c => {
        const key = `${c.jdUid ?? c.jdUid}_${c.publicIdentifier ?? c.publicIdentifier}`;
        commentMap[key] = c.internalWeekdayNotes ?? "";
    });

    // Map baseItems -> merged items and filter out completed items
    return baseItems
        .map(item => {
            const jd = item.jdUid;
            const pub = item.publicIdentifier;
            const key = `${jd}_${pub}`;

            const liveComments = commentMap[key] ?? "";

            let snoozeUntil: string | null = null;
            try {
                const m = (liveComments || "").match(/\[SNOOZE:\s*(\d{4}-\d{2}-\d{2})\]/);
                if (m) snoozeUntil = m[1];
            } catch (e) {
                snoozeUntil = null;
            }

            return {
                ...item,
                displayNotes: liveComments || item.displayNotes,
                snoozeUntil: snoozeUntil || item.snoozeUntil
            };
        })
        .filter(item => {
            // Exclude items that have been marked as complete
            const notes = item.displayNotes || "";
            return !notes.match(/\[COMPLETED:\s*\d{4}-\d{2}-\d{2}\]/);
        });
};
