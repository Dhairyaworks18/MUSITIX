"use client";

import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import type { Event } from "@/data/events";
import "swiper/css";
import "swiper/css/pagination";

type Props = {
  events: Event[];
};

export function HeroCarousel({ events }: Props) {
  const trending = events.filter((e) => e.isTrending);

  if (!trending.length) return null;

  return (
    <section className="mt-8 space-y-6 px-5 sm:mt-12 sm:px-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[#F4F4F5] sm:text-2xl">
          Trending Events
        </h2>
        <button className="text-sm text-[#A1A1AA] hover:text-[#F4F4F5] transition-colors">
          See all
        </button>
      </div>

      <div className="relative">
        <Swiper
          modules={[Pagination, Autoplay]}
          slidesPerView={1.1}
          spaceBetween={20}
          centeredSlides={true}
          loop={trending.length > 1}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
          }}
          pagination={{
            clickable: true,
            bulletActiveClass: "swiper-pagination-bullet-active-purple",
          }}
          className="trending-carousel"
        >
          {trending.map((event) => (
            <SwiperSlide key={event.id}>
              <div className="group relative h-[400px] w-full overflow-hidden rounded-3xl border border-[#A855F7]/20 bg-[#12121A] shadow-[0_0_60px_rgba(168,85,247,0.15)] transition-all duration-300 hover:shadow-[0_0_80px_rgba(168,85,247,0.25)] sm:h-[480px]">
                {/* Full-bleed background image */}
                <div className="absolute inset-0">
                  <Image
                    src={event.image}
                    alt={event.name}
                    fill
                    priority
                    className="object-cover"
                  />
                </div>

                {/* Dark gradient overlay left → right */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/50" />

                {/* Purple/pink glow overlay with blend-screen effect */}
                <div
                  className="absolute inset-0 opacity-30"
                  style={{
                    background:
                      "radial-gradient(circle at 30% 50%, rgba(168,85,247,0.4) 0%, transparent 60%), radial-gradient(circle at 70% 50%, rgba(236,72,153,0.3) 0%, transparent 60%)",
                    mixBlendMode: "screen",
                  }}
                />

                {/* Content */}
                <div className="relative flex h-full flex-col justify-between p-6 sm:p-8">
                  {/* Top section */}
                  <div className="space-y-4 max-w-[85%]">
                    <p className="text-xs uppercase tracking-[0.25em] text-[#A855F7] font-bold">
                      Trending • Live Event
                    </p>
                    <h3 className="text-5xl font-extrabold leading-none tracking-tight text-white sm:text-6xl md:text-7xl">
                      {event.name.toUpperCase()}
                    </h3>
                  </div>

                  {/* Bottom section */}
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div className="space-y-3">
                      {/* ... existing details ... */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-[#F4F4F5] sm:text-base">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-[#A855F7]" />
                          <span>{event.date}</span>
                        </div>
                        <span className="text-[#A855F7]/40 text-xs hidden sm:block">●</span>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-[#A855F7]" />
                          <span>{event.city}</span>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-[#EC4899] sm:text-3xl">
                        ${event.price}
                      </p>
                    </div>

                    <button
                      onClick={async () => {
                        const { data: { session } } = await supabase.auth.getSession();
                        if (!session) {
                          window.location.href = `/login?redirect=/events/${event.id}`;
                        } else {
                          window.location.href = `/events/${event.id}`;
                        }
                      }}
                      className="group/btn relative overflow-hidden rounded-full bg-[#A855F7] px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] text-white shadow-[0_0_30px_rgba(168,85,247,0.6)] transition-all duration-300 hover:bg-[#8B5CF6] hover:shadow-[0_0_50px_rgba(168,85,247,0.9)] hover:-translate-y-0.5 active:translate-y-0 sm:px-12 sm:py-5 sm:text-base"
                    >
                      <span className="relative z-10">Book Tickets</span>
                      <div
                        className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(236,72,153,0.3) 0%, rgba(168,85,247,0.3) 100%)",
                        }}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* Custom pagination styles */}
        <style jsx global>{`
          .trending-carousel :global(.swiper-pagination) {
            bottom: 24px !important;
            left: 50% !important;
            transform: translateX(-50%);
            width: auto !important;
          }

          .trending-carousel :global(.swiper-pagination-bullet) {
            width: 8px;
            height: 8px;
            background: rgba(161, 161, 170, 0.4);
            opacity: 1;
            margin: 0 4px;
            transition: all 0.3s ease;
          }

          .trending-carousel :global(.swiper-pagination-bullet-active-purple) {
            width: 32px;
            background: #a855f7;
            box-shadow: 0 0 20px rgba(168, 85, 247, 0.8);
          }
        `}</style>
      </div>
    </section>
  );
}
