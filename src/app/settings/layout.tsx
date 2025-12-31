import type { ReactNode } from "react";

import { requireStaffSession } from "@/shared/services/sessionService";

export default async function SettingsLayout({ children }: { children: ReactNode }) {
  await requireStaffSession();
  return children;
}
