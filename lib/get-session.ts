import { authOptions } from "./auth";
import NextAuth from "next-auth";

const { auth } = NextAuth(authOptions);

export async function getSession() {
  return auth();
}

