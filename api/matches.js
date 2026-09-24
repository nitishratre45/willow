import fs from "fs";
import path from "path";

function extractFirstJsonObject(text) {
    const start = text.indexOf("{");

    if (start === -1) {
        throw new Error("JSON object not found");
    }

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = start; i < text.length; i++) {

        const char = text[i];

        if (escaped) {
            escaped = false;
            continue;
        }

        if (char === "\\") {
            if (inString) {
                escaped = true;
            }
            continue;
        }

        if (char === '"') {
            inString = !inString;
            continue;
        }

        if (inString) {
            continue;
        }

        if (char === "{") {
            depth++;
        }

        if (char === "}") {
            depth--;

            if (depth === 0) {
                return text.slice(start, i + 1);
            }
        }
    }

    throw new Error("Incomplete JSON object");
}


export default function handler(req, res) {

    if (req.method !== "GET") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {

        const filePath = path.join(
            process.cwd(),
            "data",
            "matches.json"
        );

        let raw = fs.readFileSync(
            filePath,
            "utf8"
        );

        // Remove BOM
        raw = raw.replace(/^\uFEFF/, "");

        // Remove markdown fences if present
        raw = raw
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .trim();


        // Extract ONLY the first complete JSON object
        const jsonText =
            extractFirstJsonObject(raw);


        const data =
            JSON.parse(jsonText);


        res.setHeader(
            "Access-Control-Allow-Origin",
            "*"
        );

        res.setHeader(
            "Cache-Control",
            "no-store"
        );

        res.setHeader(
            "Content-Type",
            "application/json"
        );


        return res.status(200).json(data);

    } catch (error) {

        console.error(
            "MATCH JSON ERROR:",
            error
        );

        return res.status(500).json({
            error: "Failed to load matches",
            message: error.message
        });
    }
}
