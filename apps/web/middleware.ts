export { default } from "next-auth/middleware";

export const config = {
  // Protect every route except:
  //   - NextAuth endpoints (sign-in flow needs to be reachable)
  //   - /api/v1/health (liveness probe, intentionally public)
  //   - /sign-in page itself
  //   - static assets (_next, favicon)
  matcher: [
    "/((?!api/auth|api/v1/health|_next|favicon.ico|sign-in).*)",
  ],
};
