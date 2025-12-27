import { useState } from "react";

import { auth } from "@/shared/singletons/firebase";
import type { BorrowerNote } from "@/shared/types/borrowerNote";
import type { ActionState, LoanAction } from "@/components/borrowers/borrowerApplicationTypes";

interface UseBorrowerApplicationActionsParams {
  borrowerId: string;
  applicationId: string;
  initialStatus: string;
  initialUpdatedAt?: string;
  initialStatusUpdatedByName?: string;
  initialNotes: BorrowerNote[];
}

interface ActorProfile {
  name: string;
  userId?: string;
}

export function useBorrowerApplicationActions({
  borrowerId,
  applicationId,
  initialStatus,
  initialUpdatedAt,
  initialStatusUpdatedByName,
  initialNotes
}: UseBorrowerApplicationActionsParams) {
  const [auditStatus, setAuditStatus] = useState(initialStatus);
  const [auditUpdatedAt, setAuditUpdatedAt] = useState(initialUpdatedAt);
  const [statusUpdatedByName, setStatusUpdatedByName] = useState(initialStatusUpdatedByName);
  const [noteEntries, setNoteEntries] = useState(initialNotes);
  const [noteText, setNoteText] = useState("");
  const [noteActionState, setNoteActionState] = useState<ActionState>("idle");
  const [noteActionMessage, setNoteActionMessage] = useState("");
  const [statusActionState, setStatusActionState] = useState<ActionState>("idle");
  const [statusActionMessage, setStatusActionMessage] = useState("");

  const getActorProfile = (): ActorProfile => {
    const currentUser = auth.currentUser;
    return {
      name: currentUser?.displayName ?? "Unknown staff",
      userId: currentUser?.uid
    };
  };

  const handleKycDecisionNote = (note: BorrowerNote) => {
    setNoteEntries((prev) => [note, ...prev]);
    if (note.createdAt) {
      setAuditUpdatedAt(note.createdAt);
    }
  };

  const handleNoteTextChange = (value: string) => {
    setNoteText(value);
    if (noteActionState !== "idle") {
      setNoteActionState("idle");
      setNoteActionMessage("");
    }
  };

  const handleAddNote = async () => {
    const trimmedNote = noteText.trim();
    if (!trimmedNote) {
      setNoteActionState("error");
      setNoteActionMessage("Please enter a note before saving.");
      return;
    }

    if (!borrowerId) {
      setNoteActionState("error");
      setNoteActionMessage("Borrower id is missing. Refresh and try again.");
      return;
    }

    setNoteActionState("working");
    setNoteActionMessage("Saving note...");

    const actor = getActorProfile();

    try {
      const response = await fetch(`/api/borrowers/${borrowerId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId,
          note: trimmedNote,
          createdByName: actor.name,
          createdByUserId: actor.userId
        })
      });

      if (!response.ok) {
        throw new Error("Note update failed.");
      }

      const payload = (await response.json()) as { note?: BorrowerNote };
      if (!payload.note) {
        throw new Error("Missing note payload.");
      }

      setNoteEntries((prev) => [payload.note as BorrowerNote, ...prev]);
      setAuditUpdatedAt(payload.note.createdAt);
      setNoteText("");
      setNoteActionState("success");
      setNoteActionMessage("Note added.");
    } catch (error) {
      console.warn("Unable to add note:", error);
      setNoteActionState("error");
      setNoteActionMessage("Unable to add note. Please retry.");
    }
  };

  const handleStatusChange = async (status: LoanAction) => {
    if (!borrowerId) {
      setStatusActionState("error");
      setStatusActionMessage("Borrower id is missing. Refresh and try again.");
      return;
    }

    setStatusActionState("working");
    setStatusActionMessage(`Updating status to ${status}...`);

    const actor = getActorProfile();

    try {
      const response = await fetch(
        `/api/borrowers/${borrowerId}/application/${applicationId}/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status,
            actorName: actor.name,
            actorUserId: actor.userId
          })
        }
      );

      if (!response.ok) {
        throw new Error("Status update failed.");
      }

      const payload = (await response.json()) as {
        updatedAt?: string;
        status?: LoanAction;
        statusUpdatedByName?: string;
        note?: BorrowerNote;
      };

      setAuditStatus(payload.status ?? status);
      setAuditUpdatedAt(payload.updatedAt ?? auditUpdatedAt);
      setStatusUpdatedByName(payload.statusUpdatedByName ?? actor.name);

      if (payload.note) {
        setNoteEntries((prev) => [payload.note as BorrowerNote, ...prev]);
      }

      setStatusActionState("success");
      setStatusActionMessage(`Status updated to ${status}.`);
    } catch (error) {
      console.warn("Unable to update application status:", error);
      setStatusActionState("error");
      setStatusActionMessage("Unable to update status. Please retry.");
    }
  };

  return {
    auditStatus,
    auditUpdatedAt,
    statusUpdatedByName,
    noteEntries,
    noteText,
    noteActionState,
    noteActionMessage,
    statusActionState,
    statusActionMessage,
    handleAddNote,
    handleNoteTextChange,
    handleKycDecisionNote,
    handleStatusChange
  };
}
