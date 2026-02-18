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
            console.log("ALL KEYS:");
            console.log(JSON.stringify(Object.keys(fields).sort(), null, 2));

            console.log("\nSAMPLE DATA FOR KEY FIELDS:");
            const interestingKeys = [
                'candidateName', 'companyName', 'roleName', 'jobRoleName', 'jobRole', 'Designation',
                'jdUid', 'publicIdentifier', 'internalWeekdayNotes', 'notes', 'Account Manager',
                'Pending Since', 'Update Pending since', 'company-role'
            ];
            interestingKeys.forEach(k => {
                console.log(`${k}:`, fields[k]);
            });
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

fetchOneRecord();
