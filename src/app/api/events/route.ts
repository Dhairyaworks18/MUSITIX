import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import type { Event } from "@/data/events";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const genre = searchParams.get('genre');
    const city = searchParams.get('city');
    const period = searchParams.get('period'); // 'today', 'weekend', 'all'

    const supabase = await getSupabaseServerClient();

    let query = supabase.from('events').select('*');

    if (genre && genre !== 'All') {
      query = query.eq('genre', genre);
    }

    if (city && city !== 'All') {
      // Use ILIKE for case-insensitive matching.
      // We also trim whitespace to be safe.
      query = query.ilike('city', `%${city.trim()}%`);
    }

    if (period) {
      const today = new Date();
      if (period === 'today') {
        const todayStr = today.toISOString().split('T')[0];
        query = query.eq('date', todayStr);
      } else if (period === 'weekend') {
        const dayOfWeek = today.getDay();
        const daysUntilSaturday = (6 - dayOfWeek + 7) % 7;
        const nextSaturday = new Date(today);
        nextSaturday.setDate(today.getDate() + daysUntilSaturday);
        const nextSunday = new Date(nextSaturday);
        nextSunday.setDate(nextSaturday.getDate() + 1);

        const satStr = nextSaturday.toISOString().split('T')[0];
        const sunStr = nextSunday.toISOString().split('T')[0];

        query = query.or(`date.eq.${satStr},date.eq.${sunStr}`);
      }
    }

    const price = searchParams.get('price');
    if (price && price !== 'All') {
      if (price === '100+') {
        query = query.gte('price', 100);
      } else if (price.includes('-')) {
        const [min, max] = price.split('-');
        query = query.gte('price', parseInt(min)).lte('price', parseInt(max));
      } else {
        // Handle "Under X" conceptually if passed as just "max", but UI passes ranges or "100+".
        // The UI passes "0-20", "20-50", "50-100", "100+".
        // So essentially handled by above.
      }
    }

    const { data: dbEvents, error } = await query;

    if (error) {
      console.error('Error fetching events:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map DB fields to Frontend Event type
    const events: Event[] = (dbEvents || []).map((e: any) => ({
      id: e.id,
      name: e.title,         // DB: title -> Frontend: name
      date: e.date,
      time: e.time,
      city: e.city,
      price: e.price,
      image: e.image_url,    // DB: image_url -> Frontend: image
      genre: e.genre,
      isTrending: e.is_trending ?? false,
      description: e.description
    }));

    return NextResponse.json({ events });
  } catch (err: any) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
