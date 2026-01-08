import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from './supabaseServer';

/**
 * Helper function to authenticate API route requests
 * Returns the authenticated user or null if unauthorized
 * 
 * Usage in API routes:
 * ```
 * const user = await authenticateRequest();
 * if (!user) {
 *   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 * }
 * ```
 */
export async function authenticateRequest() {
    try {
        const supabase = await getSupabaseServerClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return null;
        }

        return user;
    } catch (error) {
        console.error('Authentication error:', error);
        return null;
    }
}

/**
 * Higher-order function to protect API routes
 * Automatically handles authentication and returns 401 if unauthorized
 * 
 * Usage:
 * ```
 * export const POST = withAuth(async (req, user) => {
 *   // user is guaranteed to be authenticated here
 *   return NextResponse.json({ userId: user.id });
 * });
 * ```
 */
export function withAuth<T extends any[]>(
    handler: (req: Request, user: any, ...args: T) => Promise<NextResponse>
) {
    return async (req: Request, ...args: T) => {
        const user = await authenticateRequest();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        return handler(req, user, ...args);
    };
}
