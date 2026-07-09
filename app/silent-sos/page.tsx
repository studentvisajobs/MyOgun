import MobilePage from "@/app/components/layout/MobilePage";
import SilentSOSClient from "./SilentSOSClient";

export default function SilentSOSPage() {
  return (
    <MobilePage
      title="Silent SOS"
      subtitle="Discreetly request emergency help without drawing attention."
    >
      <SilentSOSClient />
    </MobilePage>
  );
}