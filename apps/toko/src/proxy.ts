import { NextResponse, type NextRequest } from "next/server";
import { isValidRefCode, REF_COOKIE, REF_MAX_AGE_SECONDS } from "@/lib/referral";

/**
 * Menangkap kode referral dari alamat seperti `/?ref=KODE` dan menyimpannya di cookie 30 hari.
 * Kode pertama yang tersimpan tidak ditimpa kode berikutnya.
 */
export function proxy(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("ref");
  const response = NextResponse.next();
  if (isValidRefCode(code) && !request.cookies.has(REF_COOKIE)) {
    response.cookies.set(REF_COOKIE, code, {
      maxAge: REF_MAX_AGE_SECONDS,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|icon.svg).*)"],
};
