import MobilePage from "@/app/components/layout/MobilePage";
import ReportClient from "./ReportClient";

export default function ReportPage() {
  return (
    <MobilePage
      title="Report an Incident"
      subtitle="Help protect your community by reporting suspicious activity or emergencies."
    >
      <ReportClient />
    </MobilePage>
  );
}