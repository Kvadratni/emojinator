import { NextResponse } from "next/server";
import { scanEmojis } from "@/lib/scan-emojis";

export async function GET() {
  const index = scanEmojis();
  return NextResponse.json(index);
}
