import { NextRequest, NextResponse } from "next/server";

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || "your-strong-secret";

// This should fetch the latest access token from your session store, DB, or cache.
// For demonstration, we use an env variable. Replace with your real logic.
export async function GET(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (apiKey !== INTERNAL_API_KEY) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // TODO: Replace this with your actual logic to get the latest access token
  const accessToken = process.env.LATEST_ACCESS_TOKEN || "";

  if (!accessToken) {
    return NextResponse.json({ error: "No token found" }, { status: 404 });
  }

  return NextResponse.json({ accessToken });
}