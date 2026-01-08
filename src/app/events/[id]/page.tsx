import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import type { Event } from "@/data/events";
import { Calendar, MapPin, ExternalLink } from "lucide-react";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Props = {
  params: Promise<{
    id: string;
  }>;
};

// Helper to map DB result to Event type
const mapEvent = (e: any): Event => ({
  id: e.id,
  name: e.title,
  date: e.date,
  time: e.time,
  city: e.city,
  price: e.price,
  image: e.image_url,
  genre: e.genre,
  isTrending: e.is_trending ?? true,
  description: e.description
});

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;

  const supabase = await getSupabaseServerClient();
  const { data: dbEvent, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !dbEvent) {
    notFound();
  }

  const event = mapEvent(dbEvent);

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-[#F4F4F5]">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.12),transparent_55%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.1),transparent_55%)]" />

      <main className="mx-auto flex min-h-screen max-w-3xl flex-col overflow-hidden rounded-none bg-gradient-to-b from-[#0B0B0F] via-[#0B0B0F] to-[#0B0B0F] sm:rounded-[32px] sm:border sm:border-[#A855F7]/20 sm:my-10">
        <header className="flex items-center justify-between px-5 py-4 sm:px-8">
          <Link
            href="/"
            className="text-xs text-[#A1A1AA] transition-colors hover:text-[#F4F4F5] sm:text-sm"
          >
            ← Back to events
          </Link>
          <span className="text-xs font-semibold tracking-[0.24em] text-[#A855F7] sm:text-sm">
            MUSITIX
          </span>
        </header>

        <section className="px-5 pb-8 sm:px-8 sm:pb-12">
          {/* Image Header */}
          <div className="relative mb-8 h-[300px] w-full overflow-hidden rounded-3xl border border-[#A855F7]/30 bg-[#12121A] shadow-[0_25px_80px_rgba(168,85,247,0.2)] sm:h-[400px]">
            <Image
              src={event.image}
              alt={event.name}
              fill
              className="object-cover opacity-90"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0F] via-transparent to-transparent opacity-90" />

            <div className="absolute bottom-0 left-0 w-full p-6 sm:p-8">
              <span className="inline-block rounded-md bg-[#A855F7]/20 px-3 py-1 text-xs uppercase font-bold tracking-wider text-[#A855F7] border border-[#A855F7]/30 backdrop-blur-md mb-4">
                {event.genre}
              </span>
              <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl shadow-black drop-shadow-lg">
                {event.name}
              </h1>
            </div>
          </div>

          <div className="space-y-8">
            {/* Description */}
            <p className="text-base text-[#D4D4D8] leading-relaxed sm:text-lg">{event.description}</p>

            {/* Details Grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-4 rounded-2xl bg-[#A855F7]/5 p-5 border border-[#A855F7]/10">
                <div className="p-3 bg-[#A855F7]/10 rounded-full text-[#A855F7]">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs text-[#A1A1AA] uppercase tracking-wider font-bold">Date & Time</p>
                  <p className="text-base font-semibold text-[#F4F4F5]">{event.date} • {event.time}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 rounded-2xl bg-[#A855F7]/5 p-5 border border-[#A855F7]/10">
                <div className="p-3 bg-[#A855F7]/10 rounded-full text-[#A855F7]">
                  <MapPin className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#A1A1AA] uppercase tracking-wider font-bold">Location</p>
                  <p className="text-base font-semibold text-[#F4F4F5] truncate">{event.city}</p>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.city)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-[#A855F7] hover:bg-[#A855F7]/10 rounded-full transition-colors"
                  title="Get Directions"
                >
                  <ExternalLink className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Footer Action */}
            <div className="flex items-center justify-between border-t border-[#A855F7]/10 pt-6 mt-8">
              <div>
                <p className="text-xs text-[#A1A1AA] uppercase tracking-wider font-bold mb-1">Total Price</p>
                <p className="text-3xl font-bold text-[#EC4899]">${event.price}</p>
              </div>
              <Link href={`/checkout/${event.id}`} className="rounded-full bg-[#A855F7] px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-purple-500/20 hover:bg-[#9333EA] hover:shadow-purple-500/40 transition-all hover:-translate-y-0.5">
                Get Tickets
              </Link>
            </div>
          </div>

        </section>
      </main>
    </div>
  );
}
