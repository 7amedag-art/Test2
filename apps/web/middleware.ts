export { default } from "next-auth/middleware";

export const config = {
  // Protect every route except auth endpoints, static assets, and sign-in page.
  matcher: [
    "/((?!api/auth|_next|favicon.ico|sign-in).*)",
  ],
};
