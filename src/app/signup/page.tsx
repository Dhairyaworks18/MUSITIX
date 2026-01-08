"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function SignupPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: window.location.origin,
                    data: {
                        full_name: fullName,
                        phone: phone,
                    },
                },
            });

            if (signUpError) throw signUpError;

            // Profile is automatically created by database trigger
            // Check if user has a session (email confirmation disabled)
            if (data.session) {
                // User is auto-signed in, redirect to home
                router.push("/");
                router.refresh();
            } else {
                // Email confirmation required
                alert("Account created! Please check your email to confirm your account, then sign in.");
                router.push("/login");
            }

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#0B0B0F] px-4 text-[#F4F4F5]">
            <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_center,_rgba(236,72,153,0.1),transparent_60%)]" />

            <div className="w-full max-w-md rounded-3xl border border-[#A855F7]/20 bg-[#12121A]/80 p-8 shadow-[0_0_40px_rgba(236,72,153,0.15)] backdrop-blur-xl">
                <div className="mb-8 text-center">
                    <Link href="/" className="mb-6 inline-block text-3xl font-black uppercase tracking-[0.05em] text-transparent bg-clip-text bg-gradient-to-r from-[#A855F7] via-[#db2777] to-[#EC4899]">
                        MUSITIX
                    </Link>
                    <h1 className="text-2xl font-bold text-white">Create Account</h1>
                    <p className="mt-2 text-sm text-[#A1A1AA]">
                        Join us to book exclusive events
                    </p>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium uppercase tracking-wider text-[#A1A1AA]">Full Name</label>
                        <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="mt-1.5 w-full rounded-xl border border-[#A855F7]/20 bg-[#0B0B0F] px-4 py-3 text-sm text-white placeholder:text-[#52525B] focus:border-[#A855F7] focus:outline-none focus:ring-1 focus:ring-[#A855F7]"
                            placeholder="John Doe"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium uppercase tracking-wider text-[#A1A1AA]">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1.5 w-full rounded-xl border border-[#A855F7]/20 bg-[#0B0B0F] px-4 py-3 text-sm text-white placeholder:text-[#52525B] focus:border-[#A855F7] focus:outline-none focus:ring-1 focus:ring-[#A855F7]"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium uppercase tracking-wider text-[#A1A1AA]">Phone (Optional)</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="mt-1.5 w-full rounded-xl border border-[#A855F7]/20 bg-[#0B0B0F] px-4 py-3 text-sm text-white placeholder:text-[#52525B] focus:border-[#A855F7] focus:outline-none focus:ring-1 focus:ring-[#A855F7]"
                            placeholder="+1 (555) 000-0000"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium uppercase tracking-wider text-[#A1A1AA]">Password</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1.5 w-full rounded-xl border border-[#A855F7]/20 bg-[#0B0B0F] px-4 py-3 text-sm text-white placeholder:text-[#52525B] focus:border-[#A855F7] focus:outline-none focus:ring-1 focus:ring-[#A855F7]"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="rounded-lg bg-red-500/10 p-3 text-xs text-red-500">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="group relative w-full overflow-hidden rounded-xl bg-[#EC4899] py-3 text-sm font-bold uppercase tracking-wider text-white shadow-lg transition-all hover:bg-[#db2777] hover:shadow-[#EC4899]/30 disabled:opacity-70"
                    >
                        {isLoading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Sign Up"}

                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                    </button>
                </form>

                <div className="mt-6 text-center text-xs text-[#A1A1AA]">
                    Already have an account?{" "}
                    <Link href="/login" className="text-[#EC4899] hover:underline hover:text-[#A855F7] transition-colors">
                        Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
}
