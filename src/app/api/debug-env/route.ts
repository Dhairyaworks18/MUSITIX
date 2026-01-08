import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({
        razorpayKeyIdVisible: !!process.env.RAZORPAY_KEY_ID,
        razorpayKeyIdPrefix: process.env.RAZORPAY_KEY_ID?.substring(0, 4) || "MISSING",
        supabaseUrlVisible: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        timestamp: new Date().toISOString(),
    });
}
