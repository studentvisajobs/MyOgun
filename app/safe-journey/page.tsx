import MobilePage from "@/app/components/layout/MobilePage";
import JourneyClient from "./JourneyClient";

export default function SafeJourneyPage() {
  return (
    <MobilePage
      title="Safe Journey"
      subtitle="We'll monitor your trip until you arrive safely."
    >
      <JourneyClient />
    </MobilePage>
  );
}