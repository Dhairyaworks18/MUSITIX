"use client";

import { useState } from "react";
import { Filter, X, ChevronDown } from "lucide-react";

type Props = {
    genres: string[];
    // cities removed as requested
    filters: {
        genre: string;
        price: string;
        distance: string;
        period: string;
        // city might still be in parent state but not passed here for display if we remove it,
        // but user asked to REMOVE it from here.
    };
    onFilterChange: (key: string, value: string) => void;
    onClear: () => void;
};

export function FilterBar({ genres, filters, onFilterChange, onClear }: Props) {
    const [isOpen, setIsOpen] = useState(false);

    const periods = [
        { label: "All Dates", value: "all" },
        { label: "Today", value: "today" },
        { label: "This Weekend", value: "weekend" },
    ];

    return (
        <div className="relative z-20 mb-8">
            {/* Mobile Toggle */}
            <div className="flex items-center justify-between sm:hidden">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 rounded-full border border-[#A855F7]/30 bg-[#12121A]/80 px-4 py-2 text-sm font-medium text-[#F4F4F5] backdrop-blur-md"
                >
                    <Filter className="h-4 w-4 text-[#A855F7]" />
                    Filters {(filters.genre !== 'All' || filters.price !== 'All' || filters.distance !== 'All' || filters.period !== 'all') && <span className="flex h-2 w-2 rounded-full bg-[#EC4899]" />}
                </button>
                {(filters.genre !== 'All' || filters.price !== 'All' || filters.distance !== 'All' || filters.period !== 'all') && (
                    <button onClick={onClear} className="text-xs text-[#A1A1AA] underline">
                        Reset
                    </button>
                )}
            </div>

            {/* Filter Content */}
            <div
                className={`${isOpen ? "flex" : "hidden"
                    } absolute top-12 left-0 right-0 flex-col gap-4 rounded-3xl border border-[#A855F7]/20 bg-[#0B0B0F]/95 p-5 shadow-2xl backdrop-blur-xl sm:static sm:flex sm:flex-row sm:items-center sm:gap-3 sm:rounded-full sm:border sm:bg-[#12121A]/60 sm:p-2 sm:px-3 sm:shadow-none sm:backdrop-blur-sm`}
            >

                {/* Genre Select */}
                <div className="relative group">
                    <select
                        value={filters.genre}
                        onChange={(e) => onFilterChange("genre", e.target.value)}
                        className="w-full appearance-none rounded-xl bg-[#12121A] px-4 py-2.5 pr-10 text-sm font-medium text-[#F4F4F5] outline-none ring-1 ring-[#A855F7]/20 transition-all focus:ring-[#A855F7] sm:w-auto sm:rounded-full sm:bg-transparent sm:py-2 sm:pl-4 sm:pr-8 sm:ring-0 sm:hover:bg-[#A855F7]/10"
                    >
                        <option value="All">All Genres</option>
                        {genres.map((g) => (
                            <option key={g} value={g}>{g}</option>
                        ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A855F7] sm:right-2" />
                </div>

                <div className="hidden h-6 w-px bg-[#A855F7]/20 sm:block" />

                {/* Price Select */}
                <div className="relative group">
                    <select
                        value={filters.price}
                        onChange={(e) => onFilterChange("price", e.target.value)}
                        className="w-full appearance-none rounded-xl bg-[#12121A] px-4 py-2.5 pr-10 text-sm font-medium text-[#F4F4F5] outline-none ring-1 ring-[#A855F7]/20 transition-all focus:ring-[#A855F7] sm:w-auto sm:rounded-full sm:bg-transparent sm:py-2 sm:pl-4 sm:pr-8 sm:ring-0 sm:hover:bg-[#A855F7]/10"
                    >
                        <option value="All">Any Price</option>
                        <option value="0-20">Under $20</option>
                        <option value="20-50">$20 - $50</option>
                        <option value="50-100">$50 - $100</option>
                        <option value="100+">$100+</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A855F7] sm:right-2" />
                </div>

                <div className="hidden h-6 w-px bg-[#A855F7]/20 sm:block" />

                {/* Distance Select */}
                <div className="relative group">
                    <select
                        value={filters.distance}
                        onChange={(e) => onFilterChange("distance", e.target.value)}
                        className="w-full appearance-none rounded-xl bg-[#12121A] px-4 py-2.5 pr-10 text-sm font-medium text-[#F4F4F5] outline-none ring-1 ring-[#A855F7]/20 transition-all focus:ring-[#A855F7] sm:w-auto sm:rounded-full sm:bg-transparent sm:py-2 sm:pl-4 sm:pr-8 sm:ring-0 sm:hover:bg-[#A855F7]/10"
                    >
                        <option value="All">Any Distance</option>
                        <option value="5">Under 5km</option>
                        <option value="10">Under 10km</option>
                        <option value="25">Under 25km</option>
                        <option value="50">Under 50km</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A855F7] sm:right-2" />
                </div>

                <div className="hidden h-6 w-px bg-[#A855F7]/20 sm:block" />

                {/* Period Tabs (Desktop) / Select (Mobile) */}
                <div className="flex flex-col sm:hidden">
                    <label className="mb-2 text-xs text-[#A1A1AA] uppercase tracking-wider font-bold">Time</label>
                    <div className="flex gap-2">
                        {periods.map((p) => (
                            <button
                                key={p.value}
                                onClick={() => onFilterChange("period", p.value)}
                                className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${filters.period === p.value
                                    ? "border-[#A855F7] bg-[#A855F7]/20 text-[#A855F7]"
                                    : "border-[#A855F7]/10 bg-[#12121A] text-[#A1A1AA]"
                                    }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Period (Desktop) */}
                <div className="hidden items-center gap-1 sm:flex bg-[#12121A] rounded-full p-1 border border-[#A855F7]/10">
                    {periods.map((p) => (
                        <button
                            key={p.value}
                            onClick={() => onFilterChange("period", p.value)}
                            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${filters.period === p.value
                                ? "bg-[#A855F7] text-white shadow-md shadow-purple-500/20"
                                : "text-[#A1A1AA] hover:text-[#F4F4F5]"
                                }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>

                {/* Clear Button (Desktop) */}
                {(filters.genre !== 'All' || filters.price !== 'All' || filters.distance !== 'All' || filters.period !== 'all') && (
                    <button
                        onClick={onClear}
                        className="hidden items-center justify-center rounded-full h-8 w-8 text-[#A1A1AA] hover:bg-[#A855F7]/10 hover:text-[#F4F4F5] transition-all sm:flex ml-auto"
                        title="Clear filters"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>
        </div>
    );
}
