import NextAuth from 'next-auth';
import { authOptions } from "../../../../lib/auth-simple";

export const GET = NextAuth(authOptions);
export const POST = NextAuth(authOptions);