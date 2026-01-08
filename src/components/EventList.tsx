"use client";

import { useEffect, useState, useCallback } from "react";
import type { Event } from "@/data/events";
import { FilterBar } from "./FilterBar";
import { EventCard } from "./EventCard";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

// Accept initialEvents from server
type Props = {
    initialEvents?: Event[];
};

export function EventList({ initialEvents = [] }: Props) {
    const searchParams = useSearchParams();
    const router = useRouter();

    // Initialize with server data if available
    const [events, setEvents] = useState<Event[]>(initialEvents);
    const [isLoading, setIsLoading] = useState(false); // No loading initially if we have data
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const [filters, setFilters] = useState({
        genre: "All",
        price: "All",
        distance: "All",
        period: "all",
        city: "All", // Still kept for URL sync, but not passed to FilterBar
    });

    const [options, setOptions] = useState<{ genres: string[] }>({
        genres: [],
    });

    // Sync filters with URL
    useEffect(() => {
        const cityParam = searchParams.get("city");
        const genreParam = searchParams.get("genre");
        const periodParam = searchParams.get("period");

        setFilters(prev => {
            const newCity = cityParam || "All";
            if (prev.city !== newCity) {
                return { ...prev, city: newCity };
            }
            return prev;
        });
    }, [searchParams]);

    // Fetch filter options once
    useEffect(() => {
        async function loadFilters() {
            try {
                const res = await fetch('/api/filters');
                if (res.ok) {
                    const data = await res.json();
                    setOptions(data);
                }
            } catch (err) {
                console.error("Failed to load filters", err);
            }
        }
        loadFilters();
    }, []);

    // Fetch events when filters change
    const loadEvents = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            // If filters are defaults, we might be able to skip fetch if initialEvents matches defaults?
            // But initialEvents is just "All". If user changes filters, we MUST fetch.
            // If filters are "All", maybe we just reset to initialEvents? 
            // Actually, easier to just fetch from API for consistency on filter change.
            // BUT for valid "All" state on mount, we should NOT fetch if we have initialEvents.

            if (filters.genre !== "All") params.append("genre", filters.genre);
            if (filters.city !== "All") params.append("city", filters.city);
            if (filters.price !== "All") params.append("price", filters.price);
            if (filters.distance !== "All") params.append("distance", filters.distance);
            if (filters.period !== "all") params.append("period", filters.period);

            // Optimization: If no filters are active (default state) and we have initialEvents,
            // we could revert to initialEvents.
            const isDefault = filters.genre === "All" && filters.city === "All" && filters.price === "All" && filters.distance === "All" && filters.period === "all";

            if (isDefault && initialEvents.length > 0) {
                // Even better: API might return more up-to-date data than server render if long time passed?
                // But for "Single Source of Truth" consistency with page load, we should prefer initialEvents on first load.
                // Subsequent "Reset" clicks -> maybe fetch to be safe?
                // Let's stick to API for resets to ensure refreshing.
                // Wait, user wants "Real Time".
                // Let's fetch always on filter change, BUT skip the *mounting* fetch if filters are default.
            }

            const response = await fetch(`/api/events?${params.toString()}`, { cache: 'no-store' });
            if (!response.ok) throw new Error('Failed to fetch events');

            const data = await response.json();
            setEvents(data.events);
        } catch (e) {
            console.error("Error fetching events:", e);
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    // Only load events if filters change from default OR if we didn't have initial data.
    // Actually, we need to detect if this is the *first* render.
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        // If it's the first mount and we have initial data, DO NOT fetch.
        // If filters change (dependency), we fetch.
        // We need to distinguish between "mount with default filters" and "user changed filters / url params".
        // The filters state is initialized from URL in another effect.

        // Let's rely on a simple check: if we just mounted and have events, skip.
        // Effect runs after render.

        // Better: Check if filters separate from URL logic.
        // Actually, URL logic runs and sets filters.
        // If URL has params, we usually want to fetch tailored data (unless initialEvents was already filtered? No, initialEvents is generic "All" from page).

        const hasUrlFilters = searchParams.toString().length > 0;

        if (!isMounted && initialEvents.length > 0 && !hasUrlFilters) {
            // Initial server load with no filters -> Use initialEvents, do nothing.
            return;
        }

        // Otherwise fetch (e.g. user navigation, filter change, or direct deep link)
        if (isMounted) {
            void loadEvents();
        } else if (hasUrlFilters) {
            // Deep link case: we have initialEvents (all) but URL says filter. We must fetch.
            void loadEvents();
        }

    }, [loadEvents, isMounted, initialEvents.length, searchParams]);

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters(prev => ({ ...prev, genre: "All", price: "All", distance: "All", period: "all" }));
    };

    return (
        <section className="mt-8 px-5 pb-8 sm:mt-12 sm:px-8 sm:pb-24">
            <div className="mb-8 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
                <h2 className="text-3xl font-bold tracking-tight text-[#F4F4F5] sm:text-4xl">
                    Discover Events
                </h2>
                <FilterBar
                    genres={options.genres}
                    filters={filters as any} // Cast because 'city' is in state but not in FilterBar props
                    onFilterChange={handleFilterChange}
                    onClear={clearFilters}
                />
            </div>

            {isLoading ? (
                <div className="flex h-64 w-full items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-[#A855F7]" />
                </div>
            ) : events.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8">
                    {events.map((event) => (
                        <EventCard
                            key={event.id}
                            event={event}
                            layoutId={`card-${event.id}`}
                            onClick={() => setSelectedId(event.id)}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="mb-4 rounded-full bg-[#12121A] p-4 text-[#A1A1AA]">
                        <FilterBarIconStub />
                    </div>
                    <h3 className="text-xl font-semibold text-[#F4F4F5]">No events found</h3>
                    <p className="mt-2 text-sm text-[#A1A1AA]">Try adjusting your filters to find what you're looking for.</p>
                    <button
                        onClick={clearFilters}
                        className="mt-6 rounded-full bg-[#A855F7]/10 px-6 py-2 text-sm font-medium text-[#A855F7] transition-colors hover:bg-[#A855F7]/20"
                    >
                        Clear all filters
                    </button>
                </div>
            )}

            {/* Expanded Modal Transition */}
            <AnimatePresence>
                {selectedId && (
                    <>
                        {/* Backdrop - High z-index, blured */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedId(null)}
                            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md"
                        />
                        {/* Full-screen wrapper */}
                        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none p-0 sm:p-6">
                            {events.filter(e => e.id === selectedId).map(event => (
                                <motion.div
                                    layoutId={`card-${event.id}`}
                                    key={event.id}
                                    className="pointer-events-auto relative w-full h-full sm:h-[85vh] sm:max-w-2xl bg-[#0B0B0F] sm:rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-[#A855F7]/20"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                >
                                    {/* Close Button - Sticky/Absolute */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedId(null);
                                        }}
                                        className="absolute right-4 top-4 z-20 rounded-full bg-black/40 p-2 text-white/80 backdrop-blur-md hover:bg-white/20 transition-all"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </button>

                                    {/* Scrollable Content Area */}
                                    <div className="flex-1 overflow-y-auto no-scrollbar">
                                        {/* Hero Image */}
                                        <div className="relative h-64 sm:h-80 w-full shrink-0">
                                            <motion.div layoutId={`image-${event.id}`} className="absolute inset-0 h-full w-full">
                                                <Image
                                                    src={event.image}
                                                    alt={event.name}
                                                    fill
                                                    className="object-cover"
                                                    priority
                                                />
                                            </motion.div>
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0F] via-transparent to-transparent opacity-90" />
                                            {/* Title on Image */}
                                            <div className="absolute bottom-0 left-0 p-6 w-full">
                                                <motion.span
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.1 }}
                                                    className="inline-block rounded-md bg-[#A855F7]/80 backdrop-blur-sm px-3 py-1 text-xs uppercase font-bold tracking-wider text-white mb-2"
                                                >
                                                    {event.genre}
                                                </motion.span>
                                                <motion.h2
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.2 }}
                                                    className="text-3xl sm:text-4xl font-bold text-white shadow-black drop-shadow-md"
                                                >
                                                    {event.name}
                                                </motion.h2>
                                            </div>
                                        </div>

                                        {/* Details Body */}
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.2 }}
                                            className="p-6 space-y-8"
                                        >
                                            {/* Info Grid */}
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#12121A] border border-[#A855F7]/10">
                                                    <div className="p-2 bg-[#A855F7]/10 rounded-full text-[#A855F7] mt-1">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-[#A1A1AA] uppercase font-bold tracking-wider">Date & Time</p>
                                                        <p className="font-semibold text-[#F4F4F5] mt-0.5">{event.date}</p>
                                                        <p className="text-sm text-[#A1A1AA]">{event.time}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between p-4 rounded-2xl bg-[#12121A] border border-[#A855F7]/10">
                                                    <div className="flex items-start gap-4">
                                                        <div className="p-2 bg-[#A855F7]/10 rounded-full text-[#A855F7] mt-1">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs text-[#A1A1AA] uppercase font-bold tracking-wider">Location</p>
                                                            <p className="font-semibold text-[#F4F4F5] mt-0.5">{event.city}</p>
                                                        </div>
                                                    </div>
                                                    <a
                                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.city)}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 text-[#A855F7] bg-[#A855F7]/10 rounded-full hover:bg-[#A855F7]/20 transition-colors"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                                                    </a>
                                                </div>
                                            </div>


                                            {/* About Section */}
                                            <div className="space-y-3">
                                                <h3 className="text-lg font-bold text-white">About the Event</h3>
                                                <p className="text-[#A1A1AA] leading-relaxed text-sm sm:text-base">
                                                    {event.description || "Join us for an unforgettable experience. This event brings together the best of music and atmosphere in a premium venue."}
                                                </p>
                                            </div>

                                            {/* Venue Section (Using City as Venue if data missing) */}
                                            <div className="space-y-3">
                                                <h3 className="text-lg font-bold text-white">Venue Information</h3>
                                                <div className="flex items-start gap-4 text-[#A1A1AA]">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-1 shrink-0"><path d="M3 21h18M5 21V7l8-4 8 4v14M8 21v-4h8v4"></path></svg>
                                                    <div>
                                                        <p className="font-semibold text-[#F4F4F5]">{event.city} Arena</p>
                                                        <p className="text-sm mt-1">123 Music Ave, {event.city}</p>
                                                        <a
                                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.city)}`}
                                                            target="_blank"
                                                            className="inline-block mt-2 text-xs font-bold text-[#A855F7] hover:underline"
                                                        >
                                                            GET DIRECTIONS
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Spacer for sticky footer */}
                                            <div className="h-20" />
                                        </motion.div>
                                    </div>

                                    {/* Sticky Action Bar */}
                                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#0B0B0F]/90 backdrop-blur-xl border-t border-[#A855F7]/10 flex items-center justify-between z-30">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase font-bold text-[#A1A1AA] tracking-wider">Total</span>
                                            <span className="text-xl font-bold text-white">${event.price}</span>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/checkout/${event.id}`);
                                            }}
                                            className="rounded-full bg-[#A855F7] px-8 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:bg-[#9333EA] transition-all active:scale-95"
                                        >
                                            Get Tickets
                                        </button>
                                    </div>

                                </motion.div>
                            ))}
                        </div>
                    </>
                )}
            </AnimatePresence>
        </section>
    );
}

function FilterBarIconStub() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
    );
}
