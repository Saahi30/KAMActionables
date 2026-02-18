const API_KEY = "Bearer patTsv0YyrtEJvO2j.bf35626140b797df052a7deafb49a1316d8d7c28c3ff6495940ec90d4c336c01";
const BASE_ID = "appM08adSUl7mLnBR"; // IC Base ID
const TABLE = "Info Collection";
const VIEW = "DNT - KAM Pending (IC)";

async function fetchOneRecord() {
    try {
        const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}?view=${encodeURIComponent(VIEW)}&pageSize=1`;
        const res = await fetch(url, { headers: { Authorization: API_KEY } });
        const json = await res.json();

        if (json.records && json.records.length > 0) {
            const fields = json.records[0].fields;
            console.log("FIELDS KEYS:");
            console.log(Object.keys(fields).sort());

            console.log("\nSAMPLE DATA:");
            console.log("candidateName:", fields.candidateName);
            console.log("Name:", fields.Name);
            console.log("company:", fields.company);
            console.log("Company Name:", fields["Company Name"]);
            console.log("Company:", fields.Company);
            console.log("role:", fields.role);
            console.log("jobRole:", fields.jobRole);
            console.log("Designation:", fields.Designation);
            console.log("jdUid:", fields.jdUid);
            console.log("publicIdentifier:", fields.publicIdentifier);
            console.log("internalWeekdayNotes:", fields.internalWeekdayNotes);
            console.log("notes:", fields.notes);
            console.log("Account Manager:", fields["Account Manager"]);
            console.log("Update Pending since:", fields["Update Pending since"]);
            console.log("Pending Since:", fields["Pending Since"]);
        } else {
            console.log("No records found.");
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

fetchOneRecord();
