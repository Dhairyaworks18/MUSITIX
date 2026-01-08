import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

export async function GET() {
    const supabase = await getSupabaseServerClient();

    try {
        // Perform a simple query. Since we don't know the table structure,
        // we'll try to select from a non-existent table or just check the URL.
        // Ideally, we'd query a known table. 
        // The user said: "If no tables exist, still validate the connection without crashing."
        // A query to a non-existent table returns an error but confirms connection headers were sent.
        // Better: Querying 'pg_catalog' tables might not be allowed for anon.
        // We'll try to query a 'health' check or just verify the client is configured.
        // But the user specially asked for: `Connects to Supabase`, `Performs a simple .from(...).select('*').limit(1)`

        // We'll try querying a likely table or just 'test'.
        const { data, error } = await supabase.from('events').select('*').limit(1);

        // If error is "relation does not exist", that means we connected but the table isn't there. That counts as success connection-wise.
        // If error is network related/auth related, that's a failure.

        const isConnectionSuccessful = !error || error.code === '42P01';

        return NextResponse.json({
            success: isConnectionSuccessful,
            message: isConnectionSuccessful ? 'Supabase connected successfully' : 'Failed to connect',
            details: error ? error.message : 'Query successful or table missing (connection verified)',
            data: data
        });

    } catch (err: any) {
        return NextResponse.json({
            success: false,
            message: 'Unexpected error verifying connection',
            error: err.message
        }, { status: 500 });
    }
}
