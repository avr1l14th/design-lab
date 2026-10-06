"use client";

import { useRouter } from "next/navigation";
import { ListBanner, TopBanner } from "../_shared/banners";
import { DevPanel } from "../_shared/DevPanel";
import { MeetingsPage } from "../_shared/MeetingsPage";

// Точки входа в реферальную программу (Figma 48497:9653): растяжка над страницей и баннер в списке
// встреч. Клик по любому — переход на страницу программы. Крестики закрывают каждый элемент отдельно.

export default function ReferralEntryPointsPage() {
  const router = useRouter();
  const open = () => router.push("/referral");
  return (
    <MeetingsPage topBanner={<TopBanner onOpen={open} />} listBanner={<ListBanner onOpen={open} />}>
      <DevPanel />
    </MeetingsPage>
  );
}
