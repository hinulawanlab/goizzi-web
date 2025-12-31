// src/components/borrowers/useBorrowerLoanActions.ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { ActionState } from "@/components/borrowers/borrowerApplicationTypes";
import type { BorrowerLoanAction } from "@/components/borrowers/borrowerLoanTypes";
import { auth } from "@/shared/singletons/firebase";

interface UseBorrowerLoanActionsParams {
  borrowerId: string;
  loanId: string;
  applicationId?: string;
}

const NOTE_SUCCESS_MESSAGE = "Note saved.";
const ACTION_SUCCESS_MESSAGE = "Request queued.";

interface ActorProfile {
  name: string;
  userId?: string;
}

export function useBorrowerLoanActions({ borrowerId, loanId, applicationId }: UseBorrowerLoanActionsParams) {
  const [noteText, setNoteText] = useState("");
  const [noteActionState, setNoteActionState] = useState<ActionState>("idle");
  const [noteActionMessage, setNoteActionMessage] = useState("");
  const [actionState, setActionState] = useState<ActionState>("idle");
  const [actionMessage, setActionMessage] = useState("");
  const noteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const actionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const noteTimeout = noteTimeoutRef.current;
    const actionTimeout = actionTimeoutRef.current;
    return () => {
      if (noteTimeout) {
        clearTimeout(noteTimeout);
      }
      if (actionTimeout) {
        clearTimeout(actionTimeout);
      }
    };
  }, []);

  const getActorProfile = (): ActorProfile => {
    const currentUser = auth.currentUser;
    return {
      name: currentUser?.displayName ?? "Unknown staff",
      userId: currentUser?.uid
    };
  };

  const runWithFeedback = useCallback(
    (
      setState: (value: ActionState) => void,
      setMessage: (value: string) => void,
      timeoutRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
      workingMessage: string,
      successMessage: string
    ) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setState("working");
      setMessage(workingMessage);
      timeoutRef.current = setTimeout(() => {
        setState("success");
        setMessage(successMessage);
      }, 600);
    },
    []
  );

  const handleNoteTextChange = useCallback(
    (value: string) => {
      setNoteText(value);
      if (noteActionState !== "idle") {
        setNoteActionState("idle");
        setNoteActionMessage("");
      }
    },
    [noteActionState]
  );

  const persistNote = useCallback(
    async (
      noteType: string,
      setState: (value: ActionState) => void,
      setMessage: (value: string) => void,
      workingMessage: string,
      successMessage: string
    ) => {
      if (!borrowerId || !loanId) {
        setState("error");
        setMessage("Borrower or loan id is missing.");
        return;
      }
      const trimmedNote = noteText.trim();
      if (!trimmedNote) {
        setState("error");
        setMessage("Add a note before sending.");
        return;
      }

      setState("working");
      setMessage(workingMessage);

      const actor = getActorProfile();
      try {
        const response = await fetch(`/api/loans/${loanId}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            borrowerId,
            applicationId,
            type: noteType,
            note: trimmedNote,
            createdByName: actor.name,
            createdByUserId: actor.userId
          })
        });

        if (!response.ok) {
          const errorPayload = (await response.json()) as { error?: string };
          throw new Error(errorPayload.error ?? "Unable to save note.");
        }

        setNoteText("");
        setState("success");
        setMessage(successMessage);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to save note.";
        setState("error");
        setMessage(message);
      }
    },
    [applicationId, borrowerId, loanId, noteText]
  );

  const handleAddNote = useCallback(() => {
    void persistNote(
      "loanNotes",
      setNoteActionState,
      setNoteActionMessage,
      "Saving note...",
      NOTE_SUCCESS_MESSAGE
    );
  }, [persistNote]);

  const handleSendNote = () => {
    void persistNote("borrower", setNoteActionState, setNoteActionMessage, "Sending note...", "Note sent.");
  };

  const handleAction = useCallback(
    (action: BorrowerLoanAction) => {
      if (!borrowerId || !loanId) {
        setActionState("error");
        setActionMessage("Borrower or loan id is missing.");
        return;
      }

      if (action === "Print loan form") {
        if (!applicationId) {
          setActionState("error");
          setActionMessage("Application id is missing for this loan.");
          return;
        }

        window.open(`/borrowers/${borrowerId}/loan/${loanId}/application-form`, "_blank", "noopener,noreferrer");
        runWithFeedback(
          setActionState,
          setActionMessage,
          actionTimeoutRef,
          "Opening application form...",
          "Application form opened."
        );
        return;
      }

      runWithFeedback(
        setActionState,
        setActionMessage,
        actionTimeoutRef,
        `${action} in progress...`,
        ACTION_SUCCESS_MESSAGE
      );
    },
    [borrowerId, loanId, applicationId, runWithFeedback]
  );

  return {
    noteText,
    noteActionState,
    noteActionMessage,
    actionState,
    actionMessage,
    handleNoteTextChange,
    handleAddNote,
    handleSendNote,
    handleAction
  };
}
