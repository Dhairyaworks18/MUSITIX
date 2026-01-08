"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import type { Event } from "@/data/events";
import { motion } from "framer-motion";

type Props = {
    event: Event;
    onClick?: () => void;
    layoutId?: string;
};

export function EventCard({ event, onClick, layoutId }: Props) {
    const router = useRouter();

    const content = (
        <>
            {/* Image Section */}
            <div className="relative h-48 w-full overflow-hidden sm:h-56">
                <motion.div layoutId={layoutId ? `image-${layoutId}` : undefined} className="h-full w-full">
                    <Image
                        src={event.image}
                        alt={event.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                </motion.div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#12121A] to-transparent opacity-80" />

                {/* Genre Badge */}
                <div className="absolute top-4 left-4">
                    <span className="rounded-full bg-black/60 backdrop-blur-md border border-[#A855F7]/30 px-3 py-1 text-[10px] uppercase font-bold tracking-wider text-[#A855F7] shadow-lg">
                        {event.genre}
                    </span>
                </div>
            </div>

            {/* Content Section */}
            <div className="relative flex flex-1 flex-col p-5 sm:p-6">

                {/* Title & Price */}
                <div className="mb-4 flex items-start justify-between gap-4">
                    <h3 className="line-clamp-2 text-xl font-bold leading-tight text-white group-hover:text-[#A855F7] transition-colors duration-300">
                        {event.name}
                    </h3>
                    <span className="flex-shrink-0 text-xl font-bold text-[#EC4899]">${event.price}</span>
                </div>

                {/* Details */}
                <div className="space-y-2.5 mb-6 text-sm text-[#A1A1AA]">
                    <div className="flex items-center gap-2 group-hover:text-[#F4F4F5] transition-colors">
                        <Calendar className="h-4 w-4 text-[#A855F7]" />
                        <span>{event.date} • {event.time}</span>
                    </div>
                    <div className="flex items-center gap-2 group-hover:text-[#F4F4F5] transition-colors">
                        <MapPin className="h-4 w-4 text-[#A855F7]" />
                        <span className="truncate">{event.city}</span>
                    </div>
                </div>

                {/* Footer / Action */}
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/checkout/${event.id}`);
                    }}
                    className="mt-auto flex items-center justify-between border-t border-[#A855F7]/10 pt-4 cursor-pointer group/btn"
                >
                    <span className="text-xs font-medium text-[#A1A1AA] uppercase tracking-wider group-hover/btn:text-[#A855F7] transition-colors">
                        Get Tickets
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#A855F7]/10 text-[#A855F7] group-hover/btn:bg-[#A855F7] group-hover/btn:text-white transition-all duration-300 group-hover/btn:shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                        <ArrowRight className="h-4 w-4" />
                    </div>
                </div>
            </div>
        </>
    );

    if (onClick) {
        return (
            <motion.div
                layoutId={layoutId}
                onClick={onClick}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-[#A855F7]/20 bg-[#12121A]/60 backdrop-blur-sm cursor-pointer transition-all duration-500 hover:bg-[#12121A]/80 hover:border-[#A855F7]/50 hover:shadow-[0_0_40px_rgba(168,85,247,0.15)] hover:-translate-y-2"
            >
                {content}
            </motion.div>
        );
    }

    return (
        <Link href={`/events/${event.id}`} className="group relative flex flex-col overflow-hidden rounded-3xl border border-[#A855F7]/20 bg-[#12121A]/60 backdrop-blur-sm transition-all duration-500 hover:bg-[#12121A]/80 hover:border-[#A855F7]/50 hover:shadow-[0_0_40px_rgba(168,85,247,0.15)] hover:-translate-y-2">
            {content}
        </Link>
    );
}
