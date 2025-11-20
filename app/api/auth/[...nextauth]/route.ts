import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import type { NextRequest } from "next/server";

const { handlers } = NextAuth(authOptions);

export const GET = handlers.GET;
export const POST = handlers.POST;

