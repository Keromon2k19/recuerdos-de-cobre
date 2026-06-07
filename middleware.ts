import type { NextRequest } from "next/server";

const LOCAL_ROUTES = ["/procesar", "/review", "/importar"];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isLocalRoute = LOCAL_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (
    isLocalRoute &&
    process.env.VERCEL === "1" &&
    process.env.ENABLE_LOCAL_PANEL !== "true"
  ) {
    return new Response("Not found", { status: 404 });
  }
}

export const config = {
  matcher: ["/procesar/:path*", "/review/:path*", "/importar/:path*"],
};
