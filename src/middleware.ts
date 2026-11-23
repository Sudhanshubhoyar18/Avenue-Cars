import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Admin-only route guard
    if (path.startsWith("/admin")) {
      if (token?.role !== "ADMIN") {
        // Redirect unauthorized non-admins to vendor portal if they have a vendor profile
        if (token?.role === "VENDOR") {
          return NextResponse.redirect(new URL("/vendor", req.url));
        }
        return NextResponse.redirect(new URL("/login?error=Unauthorized", req.url));
      }
    }

    // Vendor portal guard
    if (path.startsWith("/vendor")) {
      // Admins can also inspect vendor views if needed, but vendors must have role VENDOR or ADMIN
      if (!token?.role) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/vendor/:path*", "/api/admin/:path*", "/api/vendor/:path*"],
};

