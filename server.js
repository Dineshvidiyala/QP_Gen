const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { convertExcelToJson } = require("./convert");

const app = express();
const PORT = 5000;

app.use(cors());

function romanToNumber(roman) {
    const romanMap = { I: 1, II: 2, III: 3, IV: 4, V: 5 };
    return romanMap[roman] || null;
}


const UPLOAD_DIR = path.join(__dirname, "uploads");
const JSON_FILE_PATH = path.join(__dirname, "questions.json");

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR);
}

const storage = multer.diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => {
        cb(null, "uploaded.xlsx");
    },
});
const upload = multer({ storage: storage });

app.post("/upload", upload.single("file"), (req, res) => {
    console.log("📂 File Upload Request Received.");

    if (!req.file) {
        console.error("❌ No file uploaded!");
        return res.status(400).json({ error: "No file uploaded!" });
    }

    const filePath = req.file.path;

    if (fs.existsSync(JSON_FILE_PATH)) {
        fs.unlinkSync(JSON_FILE_PATH);
        console.log("🗑️ Old questions.json deleted.");
    }

    const jsonData = convertExcelToJson(filePath);

    if (!jsonData || jsonData.length === 0) {
        console.error("❌ Failed to convert file! JSON is empty.");
        return res.status(500).json({ error: "Failed to convert file! JSON is empty." });
    }

    console.log("✅ JSON conversion successful! Returning response...");
    res.json({ message: "✅ File uploaded and converted successfully!", totalQuestions: jsonData.length });
});

app.get("/questions", (req, res) => {
    if (!fs.existsSync(JSON_FILE_PATH)) {
        return res.status(404).json({ error: "No question bank found. Please upload a file first!" });
    }

    const questions = JSON.parse(fs.readFileSync(JSON_FILE_PATH, "utf8"));
    
    if (questions.length === 0) {
        return res.status(404).json({ error: "Question bank is empty! Upload a valid file." });
    }

    res.json(questions);
});

app.get("/generate", (req, res) => {
    const mid = parseInt(req.query.mid);

    if (mid === 1) {
        return res.json(generateQuestionsForMid1());
    } else if (mid === 2) {
        return res.json(generateQuestionsForMid2());
    } else {
        return res.status(400).json({ error: "Invalid mid value! Use mid=1 or mid=2" });
    }
});

function generateQuestionsForMid1() {
    return generateQuestions([1, 2, 3], [1, 2]);
}

function generateQuestionsForMid2() {
    return generateQuestions([3, 4, 5], [4, 5]);
}

function generateQuestions(mainUnits, extraUnits) {
    if (!fs.existsSync(JSON_FILE_PATH)) {
        console.log("⚠️ No questions found in JSON file!");
        return [];
    }
    
    const questions = JSON.parse(fs.readFileSync(JSON_FILE_PATH, "utf8"));
    console.log("📢 Total Questions Available:", questions.length);

    let selected = [];

    for (let unit of mainUnits) {
        let unitQuestions = questions.filter(q => romanToNumber(q.unit) === unit);

        console.log(`📢 Unit ${unit}: Found ${unitQuestions.length} questions`);

        if (unitQuestions.length === 0) continue;

        let chosen = [];
        let uniqueBTLevels = [...new Set(unitQuestions.map(q => q.btLevel))];

        for (let bt of uniqueBTLevels) {
            let filtered = unitQuestions.filter(q => q.btLevel === bt);
            if (filtered.length) {
                chosen.push(filtered[Math.floor(Math.random() * filtered.length)]);
            }
        }

        while (chosen.length > 2 && (unit === mainUnits[0] || unit === mainUnits[1])) {
            chosen.pop();
        }
        while (chosen.length > 1 && unit === mainUnits[2]) {
            chosen.pop();
        }

        selected.push(...chosen);
    }

    let extraUnitQuestions = questions.filter(q => extraUnits.includes(q.unit));
    if (extraUnitQuestions.length > 0) {
        selected.push(extraUnitQuestions[Math.floor(Math.random() * extraUnitQuestions.length)]);
    }

    while (selected.length > 6) {
        selected.pop();
    }
    while (selected.length < 6) {
        let remainingQuestions = questions.filter(q => !selected.includes(q));
        if (remainingQuestions.length > 0) {
            selected.push(remainingQuestions[Math.floor(Math.random() * remainingQuestions.length)]);
        }
    }

    console.log("✅ Generated Questions:", selected);
    return selected;
}

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});
