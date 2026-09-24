export default async function handler(req, res) {
  const API_URL = "https://skmkc.freeshow.fun/api/matches";

  try {
    const response = await fetch(API_URL, {
      method: "GET",
      headers: {
        "Accept": "application/json"
      },
      cache: "no-store"
    });

    const text = await response.text();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Upstream API error",
        status: response.status,
        response: text
      });
    }

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      return res.status(502).json({
        error: "Upstream did not return valid JSON",
        response: text
      });
    }

    res.setHeader(
      "Cache-Control",
      "no-store, max-age=0"
    );

    return res.status(200).json(data);

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: "Proxy request failed",
      message: error.message
    });
  }
}
