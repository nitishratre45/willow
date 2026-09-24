import fs from "fs";
import path from "path";

export default function handler(req, res) {

    try {

        // JSON file location
        const filePath = path.join(
            process.cwd(),
            "data",
            "matches.json"
        );

        // Read JSON
        const file = fs.readFileSync(
            filePath,
            "utf8"
        );

        const data = JSON.parse(file);


        // CORS
        res.setHeader(
            "Access-Control-Allow-Origin",
            "*"
        );

        res.setHeader(
            "Access-Control-Allow-Methods",
            "GET, OPTIONS"
        );

        res.setHeader(
            "Content-Type",
            "application/json"
        );

        // OPTIONS request
        if (req.method === "OPTIONS") {

            return res.status(200).end();

        }


        // Only GET
        if (req.method !== "GET") {

            return res.status(405).json({
                error: "Method not allowed"
            });

        }


        // Return matches JSON
        return res.status(200).json(data);

    } catch (error) {

        console.error(
            "MATCH API ERROR:",
            error
        );

        return res.status(500).json({
            error: "Failed to load matches",
            message: error.message
        });

    }
}
