"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, User, Mail, Phone, Calendar, LogOut, ChevronLeft, Ticket, MapPin } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function ProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [bookings, setBookings] = useState<any[]>([]);

    // Form state
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");

    useEffect(() => {
        async function getProfile() {
            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError || !session) {
                    router.push("/login?redirect=/profile");
                    return;
                }

                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (error) throw error;

                if (data) {
                    setProfile(data);
                    setFullName(data.full_name || "");
                    setPhone(data.phone || "");
                    setAvatarUrl(data.avatar_url || session.user.user_metadata.avatar_url || "");
                }

                // Fetch bookings with event details
                const { data: bookingsData, error: bookingsError } = await supabase
                    .from('bookings')
                    .select(`
                        *,
                        events (
                            title,
                            date,
                            time,
                            city,
                            image_url
                        )
                    `)
                    .eq('user_id', session.user.id)
                    .order('created_at', { ascending: false });

                if (!bookingsError && bookingsData) {
                    setBookings(bookingsData);
                }
            } catch (error) {
                console.error("Error loading profile", error);
            } finally {
                setLoading(false);
            }
        }

        getProfile();
    }, [router]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdating(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No session");

            const updates = {
                id: session.user.id,
                full_name: fullName,
                phone: phone,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase.from('profiles').upsert(updates);
            if (error) throw error;

            alert("Profile updated successfully!");
        } catch (error: any) {
            alert(error.message);
        } finally {
            setUpdating(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/");
        router.refresh();
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#0B0B0F] text-[#F4F4F5]">
                <Loader2 className="h-8 w-8 animate-spin text-[#A855F7]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0B0B0F] pt-24 pb-12 px-4 sm:px-8 text-[#F4F4F5]">
            <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,_rgba(168,85,247,0.1),transparent_60%)]" />

            <div className="mx-auto max-w-2xl space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href="/" className="rounded-full bg-[#12121A] p-2 hover:bg-[#27272A] transition-colors">
                        <ChevronLeft className="h-5 w-5" />
                    </Link>
                    <h1 className="text-3xl font-bold">My Profile</h1>
                </div>

                <div className="grid gap-8 rounded-3xl border border-[#A855F7]/10 bg-[#12121A]/50 p-6 sm:p-10 backdrop-blur-xl">
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-8">
                        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-[#A855F7]/30 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                            {avatarUrl ? (
                                <Image src={avatarUrl} alt="Avatar" fill className="object-cover" referrerPolicy="no-referrer" />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center bg-[#181825] text-2xl font-bold text-[#A855F7]">
                                    {fullName?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="text-center sm:text-left">
                            <h2 className="text-xl font-bold text-white">{fullName || "User"}</h2>
                            <p className="text-sm text-[#A1A1AA]">{profile?.email}</p>
                            <span className="mt-2 inline-block rounded-full bg-[#A855F7]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#A855F7]">
                                Member
                            </span>
                        </div>
                    </div>

                    <div className="h-px w-full bg-[#A855F7]/10" />

                    {/* Edit Form */}
                    <form onSubmit={handleUpdate} className="space-y-6">
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#A1A1AA]">
                                    <User className="h-3 w-3" /> Full Name
                                </label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full rounded-xl border border-[#A855F7]/20 bg-[#0B0B0F] px-4 py-3 text-sm text-white focus:border-[#A855F7] focus:outline-none focus:ring-1 focus:ring-[#A855F7]"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#A1A1AA]">
                                    <Phone className="h-3 w-3" /> Phone
                                </label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="w-full rounded-xl border border-[#A855F7]/20 bg-[#0B0B0F] px-4 py-3 text-sm text-white focus:border-[#A855F7] focus:outline-none focus:ring-1 focus:ring-[#A855F7]"
                                />
                            </div>

                            <div className="space-y-2 sm:col-span-2">
                                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#A1A1AA] opacity-50">
                                    <Mail className="h-3 w-3" /> Email (Read-only)
                                </label>
                                <input
                                    type="email"
                                    value={profile?.email || ""}
                                    disabled
                                    className="w-full cursor-not-allowed rounded-xl border border-[#27272A] bg-[#18181B] px-4 py-3 text-sm text-[#71717A]"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-4 pt-4 sm:flex-row">
                            <button
                                type="submit"
                                disabled={updating}
                                className="flex-1 rounded-xl bg-[#A855F7] py-3 text-sm font-bold uppercase tracking-wider text-white shadow-lg transition-all hover:bg-[#9333EA] disabled:opacity-70"
                            >
                                {updating ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Save Changes"}
                            </button>

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 py-3 text-sm font-bold uppercase tracking-wider text-red-500 hover:bg-red-500/20 transition-all"
                            >
                                <LogOut className="h-4 w-4" /> Logout
                            </button>
                        </div>
                    </form>
                </div>

                {/* My Bookings Section */}
                <div className="rounded-3xl border border-[#A855F7]/10 bg-[#12121A]/50 p-6 sm:p-10 backdrop-blur-xl">
                    <h2 className="text-2xl font-bold mb-6">My Bookings</h2>
                    {bookings.length === 0 ? (
                        <div className="text-center py-12">
                            <Ticket className="h-12 w-12 text-[#A1A1AA] mx-auto mb-4 opacity-50" />
                            <p className="text-[#A1A1AA]">No bookings yet</p>
                            <Link href="/" className="inline-block mt-4 text-sm text-[#A855F7] hover:underline">
                                Browse events
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {bookings.map((booking: any) => (
                                <div
                                    key={booking.id}
                                    className="flex gap-4 rounded-2xl border border-[#A855F7]/10 bg-[#0B0B0F] p-4 hover:border-[#A855F7]/20 transition-colors"
                                >
                                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                                        <Image
                                            src={booking.events.image_url}
                                            alt={booking.events.title}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-white truncate">{booking.events.title}</h3>
                                        <div className="mt-2 space-y-1 text-xs text-[#A1A1AA]">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-3 w-3" />
                                                <span>{booking.events.date} • {booking.events.time}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-3 w-3" />
                                                <span>{booking.events.city}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-sm font-bold text-[#EC4899]">₹{booking.amount}</div>
                                        <div className="text-xs text-[#A1A1AA] mt-1">{booking.tickets} ticket(s)</div>
                                        <span className={`inline-block mt-2 rounded-full px-2 py-1 text-[10px] font-bold uppercase ${booking.status === 'paid'
                                            ? 'bg-green-500/10 text-green-500'
                                            : 'bg-red-500/10 text-red-500'
                                            }`}>
                                            {booking.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
