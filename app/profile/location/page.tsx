import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import MobilePage from "@/app/components/layout/MobilePage";
import PreferredLocationForm from "./PreferredLocationForm";

export default async function PreferredLocationPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <MobilePage
      title="Preferred Location"
      subtitle="Choose the area MyOgun should prioritise for community reports and nearby alerts."
    >
      <PreferredLocationForm
        initialArea={user.preferredArea ?? ""}
        initialLocalGovernment={
          user.preferredLocalGovernment ?? ""
        }
      />
    </MobilePage>
  );
}