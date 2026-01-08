import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import crypto from "crypto";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export async function POST(req: NextRequest) {
    try {
        const supabase = await getSupabaseServerClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: "Unauthorized: Please log in" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { action } = body;

        // Initialize Razorpay
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            return NextResponse.json(
                { error: "Server configuration error: Missing Keys" },
                { status: 500 }
            );
        }

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        // ---------------------------------------------------------
        // ACTION: CREATE ORDER
        // ---------------------------------------------------------
        if (action === "create") {
            const { eventId, quantity } = body;

            if (!eventId || !quantity || quantity < 1 || quantity > 5) {
                return NextResponse.json(
                    { error: "Invalid event ID or quantity" },
                    { status: 400 }
                );
            }

            // Fetch event from Supabase
            const { data: event, error: eventError } = await supabase
                .from("events")
                .select("price, title")
                .eq("id", eventId)
                .single();

            if (eventError || !event) {
                return NextResponse.json({ error: "Event not found" }, { status: 404 });
            }

            const amount = Math.round(event.price * quantity * 100); // in paise

            const receiptId = `rcpt_${Date.now().toString().slice(-10)}_${Math.floor(
                Math.random() * 1000
            )}`;

            const order = await razorpay.orders.create({
                amount,
                currency: "INR",
                receipt: receiptId,
                notes: {
                    eventId,
                    quantity,
                    userId: user.id,
                },
            });

            return NextResponse.json({
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                eventName: event.title,
            });
        }

        // ---------------------------------------------------------
        // ACTION: VERIFY PAYMENT
        // ---------------------------------------------------------
        if (action === "verify") {
            const {
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
                eventId,
                quantity,
                userId
            } = body;

            if (
                !razorpay_order_id ||
                !razorpay_payment_id ||
                !razorpay_signature ||
                !eventId ||
                !quantity ||
                !userId
            ) {
                return NextResponse.json(
                    { error: "Missing payment details" },
                    { status: 400 }
                );
            }

            // Verify signature
            const generated_signature = crypto
                .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
                .update(razorpay_order_id + "|" + razorpay_payment_id)
                .digest("hex");

            if (generated_signature !== razorpay_signature) {
                return NextResponse.json(
                    { error: "Payment verification failed" },
                    { status: 400 }
                );
            }

            // Fetch event for amount details (optional check) or just insert
            const { data: event } = await supabase
                .from("events")
                .select("price")
                .eq("id", eventId)
                .single();

            if (!event) {
                return NextResponse.json({ error: "Event not found" }, { status: 404 });
            }

            const amount = event.price * quantity;

            // Insert booking - using passed userId
            // CRITICAL: Supabase RLS requires auth.uid() to match user_id in the row.
            // Since we use createServerClient with cookies, 'user' (from getSupabaseServerClient)
            // MUST be the same as 'userId' passed from frontend.
            if (user.id !== userId) {
                return NextResponse.json(
                    { error: "Session mismatch: Unauthorized" },
                    { status: 401 }
                );
            }

            const { error: bookingError } = await supabase.from("bookings").insert({
                user_id: userId,
                event_id: eventId,
                quantity: quantity,
                price_per_ticket: event.price,
                amount: amount,
                status: "paid",
                razorpay_payment_id: razorpay_payment_id,
                razorpay_order_id: razorpay_order_id,
                razorpay_signature: razorpay_signature
            });

            if (bookingError) {
                console.error("Booking Error:", bookingError);
                return NextResponse.json(
                    {
                        error: "Payment successful but booking failed.",
                        details: bookingError.message,
                        hint: bookingError.hint,
                        code: bookingError.code
                    },
                    { status: 500 }
                );
            }

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error: any) {
        console.error("Razorpay API Error:", error);
        return NextResponse.json(
            { error: `Payment Failed: ${error.message}` },
            { status: 500 }
        );
    }
}
