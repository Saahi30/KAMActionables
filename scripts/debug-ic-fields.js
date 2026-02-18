const API_KEY = "Bearer patTsv0YyrtEJvO2j.bf35626140b797df052a7deafb49a1316d8d7c28c3ff6495940ec90d4c336c01";
const BASE_ID = "appM08adSUl7mLnBR"; // IC Base ID
const TABLE = "Info Collection";
const VIEW = "DNT - KAM Pending (IC)";

async function fetchOneRecord() {
    try {
        const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE)}?view=${encodeURIComponent(VIEW)}&pageSize=3`;
        const res = await fetch(url, { headers: { Authorization: API_KEY } });
        const json = await res.json();

        if (json.records && json.records.length > 0) {
            console.log("Total records found:", json.records.length);
            json.records.forEach((record, index) => {
                console.log(`\nRecord ${index + 1} fields:`);
                console.log(JSON.stringify(record.fields, null, 2));
            });
        } else {
            console.log("No records found.");
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

fetchOneRecord();
