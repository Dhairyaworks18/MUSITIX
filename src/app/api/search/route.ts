import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import type { Event } from "@/data/events";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const queryTerm = searchParams.get('q');

        if (!queryTerm) {
            return NextResponse.json({ events: [] });
        }

        const supabase = await getSupabaseServerClient();

        // Perform multi-column search
        // Supabase .or() expects a comma-separated lists of conditions: "column.operator.value, column.operator.value"
        // We want ILIKE matching on multiple fields.
        const term = `%${queryTerm}%`;
        const orCondition = `title.ilike.${term},description.ilike.${term},genre.ilike.${term},city.ilike.${term}`;

        const { data: dbEvents, error } = await supabase
            .from('events')
            .select('*')
            .or(orCondition)
            .limit(6); // Limit results for performance/UI space

        if (error) {
            console.error('Error fetching search results:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Map DB fields to Frontend Event type
        const events: Event[] = (dbEvents || []).map((e: any) => ({
            id: e.id,
            name: e.title,
            date: e.date,
            time: e.time,
            city: e.city,
            price: e.price,
            image: e.image_url,
            genre: e.genre,
            isTrending: e.is_trending ?? false,
            description: e.description
        }));

        return NextResponse.json({ events });
    } catch (err: any) {
        console.error('Unexpected error in search:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
