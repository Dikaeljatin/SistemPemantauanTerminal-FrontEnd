import { NextRequest, NextResponse } from "next/server";

/**
 * Keep-alive endpoint untuk mencegah Supabase Free Plan pause karena inactivity.
 *
 * Cara kerja:
 * - Dipanggil oleh GitHub Actions cron 1x/hari
 * - Melakukan SELECT ringan ke table konfigurasi (read-only)
 * - Diproteksi dengan secret token
 *
 * Endpoint: GET /api/keep-alive?secret=CRON_SECRET
 */
export async function GET(request: NextRequest) {
  // Validasi secret
  const secret = request.nextUrl.searchParams.get("secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { success: false, error: "Supabase env vars not configured" },
      { status: 500 }
    );
  }

  try {
    // Query ringan: SELECT konfigurasi_id FROM konfigurasi LIMIT 1 via REST API
    const res = await fetch(
      `${supabaseUrl}/rest/v1/konfigurasi?select=key&limit=1`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        {
          success: false,
          error: "Supabase query failed",
          status: res.status,
          detail: errorText,
        },
        { status: 500 }
      );
    }

    const data = await res.json();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      table: "konfigurasi",
      rowsReturned: Array.isArray(data) ? data.length : 0,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to ping Supabase",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
