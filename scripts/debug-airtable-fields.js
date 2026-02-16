const API_KEY = "Bearer patTsv0YyrtEJvO2j.bf35626140b797df052a7deafb49a1316d8d7c28c3ff6495940ec90d4c336c01";
const BASE_ID = "apphLcvA4OO7gKjl9";
const TABLE = "tbliHNuWXCvnIZKLy"; // Post-TBR Table
const VIEW = "DNT - Vaibhav KAM Pending 10 Days";

async function fetchOneRecord() {
    try {
        const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE}?view=${encodeURIComponent(VIEW)}&pageSize=1`;
        const res = await fetch(url, { headers: { Authorization: API_KEY } });
        const json = await res.json();

        if (json.records && json.records.length > 0) {
            const record = json.records[0];
            console.log("Fields found:");
            console.log(JSON.stringify(Object.keys(record.fields), null, 2));

            // Also look for fields that might contain "comment" or "note"
            console.log("\nPotential comment fields content:");
            Object.keys(record.fields).forEach(key => {
                if (key.toLowerCase().includes("comment") || key.toLowerCase().includes("note")) {
                    console.log(`${key}:`, record.fields[key]);
                }
            });
        } else {
            console.log("No records found.");
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

fetchOneRecord();
