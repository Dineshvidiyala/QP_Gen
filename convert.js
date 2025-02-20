const xlsx = require("xlsx");
const fs = require("fs");
const path = require("path");

const JSON_FILE_PATH = path.join(__dirname, "questions.json");

function convertExcelToJson(filePath) {
    try {
        console.log("📂 Checking if file exists:", filePath);

        if (!fs.existsSync(filePath)) {
            console.error("❌ Error: Excel file not found!");
            return null;
        }

        console.log("📖 Reading Excel file...");
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const jsonData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        if (!jsonData || jsonData.length === 0) {
            console.error("❌ Error: No data found in Excel file!");
            return null;
        }

        console.log("💾 Saving to questions.json...");
        fs.writeFileSync(JSON_FILE_PATH, JSON.stringify(jsonData, null, 2));

        console.log("✅ questions.json generated successfully!");
        return jsonData;
    } catch (error) {
        console.error("❌ Error converting Excel to JSON:", error);
        return null;
    }
}

module.exports = { convertExcelToJson };
