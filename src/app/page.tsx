import { Header } from "@/components/Header";
import { HeroCarousel } from "@/components/HeroCarousel";
import { EventList } from "@/components/EventList";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import type { Event } from "@/data/events";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
  isTrending: e.is_trending ?? true, // Default to true if column missing so carousel isn't empty initially
  description: e.description
});

export default async function Home() {
  const supabase = await getSupabaseServerClient();

  const today = new Date();
  const nextMonth = new Date(today);
  nextMonth.setDate(today.getDate() + 30);

  const todayStr = today.toISOString().split('T')[0];
  const nextMonthStr = nextMonth.toISOString().split('T')[0];

  // SINGLE SOURCE OF TRUTH: Fetch all upcoming events (e.g. next 6 months or year)
  // This ensures Discover All Events and HeroCarousel use the exact same data.
  const farFuture = new Date(today);
  farFuture.setDate(today.getDate() + 365); // 1 year out
  const farFutureStr = farFuture.toISOString().split('T')[0];

  const { data: dbEvents } = await supabase
    .from('events')
    .select('*')
    .gte('date', todayStr)
    .lte('date', farFutureStr)
    .order('date', { ascending: true });

  const events = (dbEvents || []).map(mapEvent);

  // Derive trending events (Next 30 days + is_trending)
  const trendingEvents = events.filter(e => {
    const eventDate = new Date(e.date);
    return eventDate <= nextMonth && (e.isTrending);
  });

  return (
    <div className="min-h-screen bg-[#0B0B0F] text-[#F4F4F5]">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(168,85,247,0.12),transparent_55%),radial-gradient(circle_at_bottom,_rgba(236,72,153,0.1),transparent_55%)]" />
      <main className="flex min-h-screen flex-col bg-gradient-to-b from-[#0B0B0F] via-[#0B0B0F] to-[#0B0B0F]">
        <Header />
        <HeroCarousel events={trendingEvents} />
        <div className="mx-auto w-full max-w-5xl">
          <EventList initialEvents={events} />
        </div>
      </main>
    </div>
  );
}
