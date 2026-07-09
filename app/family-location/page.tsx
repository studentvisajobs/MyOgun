import MobilePage from "@/app/components/layout/MobilePage";
import FamilyLocationClient from "./FamilyLocationClient";

export default function FamilyLocationPage() {
  return (
    <MobilePage
      title="Family Location"
      subtitle="Share your live location with trusted guardians."
    >
      <FamilyLocationClient />
    </MobilePage>
  );
}