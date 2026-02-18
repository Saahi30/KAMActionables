// Field Mapping Reference for IC and Post-TBR Airtable Bases
// Use this as a quick reference when debugging field mapping issues

export const FIELD_MAPPINGS = {
    // POST-TBR FIELD NAMES (from Post-TBR base)
    POST_TBR: {
        candidateName: "candidateName",
        company: "Company Name",
        role: "jobRole",
        status: "Post TBR Status",
        pendingDays: "Update Pending since",
        notes: "internalWeekdayNotes",
        schedulerNotes: "Scheduler Notes",
        kam: "Account Manager (from companyMapperViaUid) (from uidMapped)",
        jdUid: "jdUid",
        publicIdentifier: "publicIdentifier",
        platformLink: "Candidate Platform Link",
        conversationStatus: "conversationStatus",
        roleActive: "isRoleActive? (from KAM JD Interface) (from jdUidMapper)",
        interviewProcessFinal: "interviewProcessFinal"
    },

    // IC FIELD NAMES (from Info Collection base)
    // Note: Many fields can be arrays, so we extract [0] element
    IC: {
        // Candidate Name - try these in order
        candidateName: ["candidateName", "Name", "Candidate Name"],

        // Company - try these in order (can be array or string)
        company: ["Company Name", "company", "Company"],

        // Role - try these in order (can be array or string)
        role: ["jobRole", "role", "Designation", "Job Role"],

        // Status - try these in order
        status: ["Info Call Status", "IC Status", "Post TBR Status", "conversationStatus"],

        // Pending Days - try these in order
        pendingDays: ["Update Pending since", "Pending since"],

        // Notes - try these in order
        notes: ["internalWeekdayNotes", "Weekday POC", "notes", "IC Questions"],

        // Scheduler Notes
        schedulerNotes: ["Scheduler Notes", "IC Caller Notes"],

        // KAM / Account Manager (can be array or string)
        kam: ["Account Manager", "kam"],

        // JD UID
        jdUid: ["jdUid", "JD UID"],

        // Public Identifier
        publicIdentifier: ["publicIdentifier", "Public Identifier"],

        // Platform Link
        platformLink: ["Candidate Platform Link"],

        // Conversation Status
        conversationStatus: ["conversationStatus"]
    }
};

// Helper function to extract field value with fallbacks
export const extractField = (
    fields: Record<string, any>,
    possibleNames: string | string[],
    defaultValue: any = null
): any => {
    const names = Array.isArray(possibleNames) ? possibleNames : [possibleNames];

    for (const name of names) {
        if (fields[name] !== undefined && fields[name] !== null) {
            const value = fields[name];
            // If it's an array, return the first element
            if (Array.isArray(value) && value.length > 0) {
                return value[0];
            }
            // Otherwise return the value as-is
            if (value !== "") {
                return value;
            }
        }
    }

    return defaultValue;
};

// Example usage:
// const candidateName = extractField(f, FIELD_MAPPINGS.IC.candidateName, "Unknown Candidate");
