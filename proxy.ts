import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/coach/login",
  },
});

export const config = {
  matcher: ["/coach/dashboard/:path*", "/api/coach/:path*"],
};
