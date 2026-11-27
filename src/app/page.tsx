import { Suspense } from "react";
import { BriefingLoader } from "@/components/briefing/BriefingLoader";

export default function Page() {
  return (
    <Suspense>
      <BriefingLoader />
    </Suspense>
  );
}
