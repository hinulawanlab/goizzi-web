import { sanitizeName } from "@/shared/services/borrowerNoteUtils";
import { getUserDisplayNameById } from "@/shared/services/userService";

export async function resolveActorName(actorUserId?: string, fallbackName?: string): Promise<string> {
  const resolvedName = actorUserId ? await getUserDisplayNameById(actorUserId) : undefined;
  return sanitizeName(resolvedName ?? fallbackName);
}
