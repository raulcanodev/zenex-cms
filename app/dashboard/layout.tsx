import { redirect } from "next/navigation";
import { getSession } from "@/lib/get-session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  return <>{children}</>;
}


