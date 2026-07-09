import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import EditProfileForm from "./EditProfileForm";

export default async function EditProfilePage() {
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  return <EditProfileForm user={user} />;
}