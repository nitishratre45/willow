import fs from "fs";
import path from "path";

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
        ).trim();


        // Remove markdown code fences if accidentally pasted
        raw = raw
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();


        // Find the actual JSON object
        const firstBrace = raw.indexOf("{");
        const lastBrace = raw.lastIndexOf("}");

        if (
            firstBrace === -1 ||
            lastBrace === -1 ||
            lastBrace <= firstBrace
        ) {
            throw new Error(
                "Valid JSON object not found in matches.json"
            );
        }


        raw = raw.substring(
            firstBrace,
            lastBrace + 1
        );


        const data = JSON.parse(raw);


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
