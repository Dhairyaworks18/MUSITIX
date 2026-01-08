"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin, Loader2, Minus, Plus, ChevronLeft } from "lucide-react";

declare global {
    interface Window {
        Razorpay: any;
    }
}

type Event = {
    id: string;
    title: string;
    date: string;
    time: string;
    city: string;
    price: number;
    image_url: string;
    genre: string;
    description?: string;
};

export default function CheckoutPage({ params }: { params: { eventId: string } }) {
    const router = useRouter();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [tickets, setTickets] = useState(1);
    const [processing, setProcessing] = useState(false);
    const [session, setSession] = useState<any>(null);
    const eventId = params.eventId;

    useEffect(() => {
        let mounted = true;

        async function init() {
            try {
                // 1. Check Auth Once
                const { data: { user }, error: authError } = await supabase.auth.getUser();

                if (authError || !user) {
                    if (mounted) {
                        router.replace(`/login?redirect=/checkout/${eventId}`);
                    }
                    return;
                }

                if (mounted) setSession({ user });

                // 2. Fetch Event
                if (eventId) {
                    const { data, error } = await supabase
                        .from("events")
                        .select("*")
                        .eq("id", eventId)
                        .single();

                    if (error || !data) {
                        console.error("Event fetch error:", error);
                        if (mounted) router.push("/");
                        return;
                    }

                    if (mounted) setEvent(data);
                }
            } catch (error) {
                console.error("Error in checkout load:", error);
            } finally {
                if (mounted) setLoading(false);
            }
        }

        init();

        return () => {
            mounted = false;
        };
    }, [eventId, router]);

    const handleTicketChange = (delta: number) => {
        const newTickets = tickets + delta;
        if (newTickets >= 1 && newTickets <= 5) {
            setTickets(newTickets);
        }
    };

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePayment = async () => {
        if (!event || !session) return;

        setProcessing(true);

        try {
            // 1. Load Script
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                throw new Error("Failed to load Razorpay SDK");
            }

            // 2. Create Order (Server-side)
            const response = await fetch("/api/razorpay", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "create",
                    eventId: event.id,
                    quantity: tickets
                }),
            });

            if (response.status === 401) {
                router.replace(`/login?redirect=/checkout/${eventId}`);
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to create order");
            }

            // 3. Open Razorpay
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: data.amount,
                currency: data.currency,
                name: "MUSITIX",
                description: `${tickets} ticket(s) for ${data.eventName}`,
                order_id: data.orderId,
                prefill: {
                    email: session.user.email,
                    name: session.user.user_metadata?.full_name || "",
                    ...(session.user.phone ? { contact: session.user.phone } : {}),
                },
                theme: {
                    color: "#A855F7",
                },
                handler: async function (response: any) {
                    try {
                        // 4. Verify Payment (Server-side) and Create Booking
                        const verifyRes = await fetch("/api/razorpay", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                action: "verify",
                                razorpay_measurement_id: response.razorpay_payment_id, // Common typo fix if needed, but standard is below
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature,
                                eventId: event.id,
                                quantity: tickets,
                                userId: session.user.id
                            }),
                        });

                        const verifyData = await verifyRes.json();

                        if (!verifyRes.ok) {
                            throw new Error(verifyData.error || "Payment verification failed");
                        }

                        // Success!
                        alert("Booking confirmed! Redirecting to your profile...");
                        router.push("/profile");

                    } catch (error: any) {
                        console.error("Verification error:", error);
                        console.error("Verification error:", error);
                        alert(`Payment verification failed: ${error.message}`);
                    }
                },
                modal: {
                    ondismiss: function () {
                        setProcessing(false);
                    },
                },
            };

            const razorpay = new window.Razorpay(options);
            razorpay.on('payment.failed', function (response: any) {
                console.error("Payment failed:", response.error);
                alert("Payment Failed: " + response.error.description);
                setProcessing(false);
            });
            razorpay.open();

        } catch (error: any) {
            console.error("Payment flow error:", error);
            alert(error.message || "Something went wrong. Please try again.");
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#0B0B0F] text-[#F4F4F5]">
                <Loader2 className="h-8 w-8 animate-spin text-[#A855F7]" />
            </div>
        );
    }

    if (!event) {
        return null;
    }

    const totalPrice = event.price * tickets;

    return (
        <div className="min-h-screen bg-[#0B0B0F] pt-24 pb-12 px-4 sm:px-8 text-[#F4F4F5]">
            <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,_rgba(168,85,247,0.1),transparent_60%)]" />

            <div className="mx-auto max-w-4xl space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href={`/events/${event.id}`} className="rounded-full bg-[#12121A] p-2 hover:bg-[#27272A] transition-colors">
                        <ChevronLeft className="h-5 w-5" />
                    </Link>
                    <h1 className="text-3xl font-bold">Checkout</h1>
                </div>

                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Event Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="rounded-3xl border border-[#A855F7]/10 bg-[#12121A]/50 p-6 backdrop-blur-xl">
                            <div className="flex gap-6">
                                <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-2xl">
                                    <Image src={event.image_url} alt={event.title} fill className="object-cover" />
                                </div>
                                <div className="flex-1">
                                    <span className="inline-block rounded-md bg-[#A855F7]/20 px-3 py-1 text-xs uppercase font-bold tracking-wider text-[#A855F7] border border-[#A855F7]/30 mb-2">
                                        {event.genre}
                                    </span>
                                    <h2 className="text-2xl font-bold text-white mb-4">{event.title}</h2>
                                    <div className="space-y-2 text-sm text-[#A1A1AA]">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-[#A855F7]" />
                                            <span>{event.date} • {event.time}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-[#A855F7]" />
                                            <span>{event.city}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Ticket Selection */}
                        <div className="rounded-3xl border border-[#A855F7]/10 bg-[#12121A]/50 p-6 backdrop-blur-xl">
                            <h3 className="text-lg font-bold mb-4">Select Tickets</h3>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-[#A1A1AA]">Price per ticket</p>
                                    <p className="text-2xl font-bold text-[#EC4899]">₹{event.price}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => handleTicketChange(-1)}
                                        disabled={tickets <= 1}
                                        className="h-10 w-10 rounded-full border border-[#A855F7]/30 bg-[#0B0B0F] flex items-center justify-center hover:bg-[#A855F7]/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Minus className="h-4 w-4" />
                                    </button>
                                    <span className="text-2xl font-bold w-12 text-center">{tickets}</span>
                                    <button
                                        onClick={() => handleTicketChange(1)}
                                        disabled={tickets >= 5}
                                        className="h-10 w-10 rounded-full border border-[#A855F7]/30 bg-[#0B0B0F] flex items-center justify-center hover:bg-[#A855F7]/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                            <p className="text-xs text-[#A1A1AA] mt-4">Maximum 5 tickets per booking</p>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="rounded-3xl border border-[#A855F7]/10 bg-[#12121A]/50 p-6 backdrop-blur-xl sticky top-24">
                            <h3 className="text-lg font-bold mb-6">Order Summary</h3>
                            <div className="space-y-4 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-[#A1A1AA]">Tickets ({tickets})</span>
                                    <span className="font-semibold">₹{event.price * tickets}</span>
                                </div>
                                <div className="h-px bg-[#A855F7]/10" />
                                <div className="flex justify-between text-lg font-bold">
                                    <span>Total</span>
                                    <span className="text-[#EC4899]">₹{totalPrice}</span>
                                </div>
                            </div>
                            <button
                                onClick={handlePayment}
                                disabled={processing}
                                className="w-full rounded-xl bg-[#A855F7] py-3 text-sm font-bold uppercase tracking-wider text-white shadow-lg transition-all hover:bg-[#9333EA] disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {processing ? (
                                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                                ) : (
                                    "Proceed to Pay"
                                )}
                            </button>
                            <p className="text-xs text-[#A1A1AA] text-center mt-4">
                                Secure payment powered by Razorpay
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
