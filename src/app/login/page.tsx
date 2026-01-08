"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get("redirect") || "/";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            router.replace(redirectUrl);
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };



    return (
        <div className="flex min-h-screen items-center justify-center bg-[#0B0B0F] px-4 text-[#F4F4F5]">
            {/* Background Gradient */}
            <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_center,_rgba(168,85,247,0.1),transparent_60%)]" />

            <div className="w-full max-w-md rounded-3xl border border-[#A855F7]/20 bg-[#12121A]/80 p-8 shadow-[0_0_40px_rgba(168,85,247,0.15)] backdrop-blur-xl">
                <div className="mb-8 text-center">
                    <Link href="/" className="mb-6 inline-block text-3xl font-black uppercase tracking-[0.05em] text-transparent bg-clip-text bg-gradient-to-r from-[#A855F7] via-[#db2777] to-[#EC4899]">
                        MUSITIX
                    </Link>
                    <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
                    <p className="mt-2 text-sm text-[#A1A1AA]">
                        Sign in to continue your booking
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
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
                        <label className="block text-xs font-medium uppercase tracking-wider text-[#A1A1AA]">Password</label>
                        <input
                            type="password"
                            required
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
                        className="group relative w-full overflow-hidden rounded-xl bg-[#A855F7] py-3 text-sm font-bold uppercase tracking-wider text-white shadow-lg transition-all hover:bg-[#9333EA] hover:shadow-[#A855F7]/30 disabled:opacity-70"
                    >
                        {isLoading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Sign In"}

                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                    </button>
                </form>

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#A855F7]/20"></div></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#12121A] px-2 text-[#A1A1AA]">Or continue with</span></div>
                </div>

                <button
                    onClick={async () => {
                        setIsLoading(true);
                        try {
                            await supabase.auth.signInWithOAuth({
                                provider: 'google',
                                options: {
                                    redirectTo: window.location.origin + redirectUrl,
                                }
                            });
                        } catch (err: any) {
                            setError(err.message);
                            setIsLoading(false);
                        }
                    }}
                    disabled={isLoading}
                    className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#A855F7]/20 bg-[#0B0B0F] py-3 text-sm font-medium text-white transition-all hover:border-[#A855F7]/50 hover:bg-[#A855F7]/5"
                >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26c.01-.19.01-.38.01-.58z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Google
                </button>

                <div className="mt-6 text-center text-xs text-[#A1A1AA]">
                    Don't have an account?{" "}
                    <Link href="/signup" className="text-[#A855F7] hover:underline hover:text-[#EC4899] transition-colors">
                        Sign up
                    </Link>
                </div>
            </div>
        </div>
    );
}
