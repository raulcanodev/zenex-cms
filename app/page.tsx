import { redirect } from "next/navigation";
import { getSession } from "@/lib/get-session";
import { AuthPage } from "@/components/AuthPage/AuthPage";

export default async function Home() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return <AuthPage />;
}
