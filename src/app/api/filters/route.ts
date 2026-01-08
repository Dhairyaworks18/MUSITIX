import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = await getSupabaseServerClient();

        // Fetch unique genres and cities.
        // Supabase doesn't have a simple .distinct() on a column in one query easily without rpc or some tricks.
        // We will fetch all (lightweight if just columns) or use .range() if huge, but for now fetch all 
        // and distinct on server side is okay for small scale.
        // Better: use .csv() or something? No.
        // Let's just fetch all events (lightweight select) and extract unique.

        // Selecting only needed columns
        const { data, error } = await supabase
            .from('events')
            .select('genre, city');

        if (error) {
            throw error;
        }

        const uniqueGenres = Array.from(new Set(data?.map((e: any) => e.genre).filter(Boolean))).sort() as string[];
        const uniqueCities = Array.from(new Set(data?.map((e: any) => e.city).filter(Boolean))).sort() as string[];

        return NextResponse.json({
            genres: uniqueGenres,
            cities: uniqueCities
        });
    } catch (err: any) {
        console.error('Error fetching filters:', err);
        return NextResponse.json({ genres: [], cities: [] }); // Fallback empty
    }
}
