import { redirect } from "next/navigation";
import MobilePage from "@/app/components/layout/MobilePage";
import { getCurrentUser } from "@/lib/auth";
import AddGuardianForm from "../AddGuardianForm";

export default async function AddGuardianPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <MobilePage
      title="Add Guardian"
      subtitle="Add someone you trust to your Guardian Circle."
    >
      <AddGuardianForm />
    </MobilePage>
  );
}