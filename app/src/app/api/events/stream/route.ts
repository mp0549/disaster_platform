import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      error: "Server-Sent Events not yet implemented",
      version: "v2",
    },
    { status: 501 }
  );
}
