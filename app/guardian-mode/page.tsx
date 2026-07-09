import MobilePage from "@/app/components/layout/MobilePage";
import GuardianModeClient from "./GuardianModeClient";

export default function GuardianModePage() {
  return (
    <MobilePage
      title="Guardian Mode"
      subtitle="Share your live location with trusted people while MyOgun monitors your safety."
    >
      <GuardianModeClient />
    </MobilePage>
  );
}