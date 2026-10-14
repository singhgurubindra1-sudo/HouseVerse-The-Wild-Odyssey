import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Supabase sends people here after Google login or an email confirmation link. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/login/house`);
  }
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("That login link did not work. Please try again.")}`);
}
