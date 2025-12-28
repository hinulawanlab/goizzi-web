"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { ActionState } from "@/components/borrowers/borrowerApplicationTypes";
import type { BorrowerLoanAction } from "@/components/borrowers/borrowerLoanTypes";

interface UseBorrowerLoanActionsParams {
  borrowerId: string;
  loanId: string;
}

const NOTE_SUCCESS_MESSAGE = "Note saved.";
const ACTION_SUCCESS_MESSAGE = "Request queued.";

export function useBorrowerLoanActions({ borrowerId, loanId }: UseBorrowerLoanActionsParams) {
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

  const handleAddNote = useCallback(() => {
    if (!borrowerId || !loanId) {
      setNoteActionState("error");
      setNoteActionMessage("Borrower or loan id is missing.");
      return;
    }
    if (!noteText.trim()) {
      setNoteActionState("error");
      setNoteActionMessage("Add a note before sending.");
      return;
    }

    runWithFeedback(
      setNoteActionState,
      setNoteActionMessage,
      noteTimeoutRef,
      "Saving note...",
      NOTE_SUCCESS_MESSAGE
    );
  }, [borrowerId, loanId, noteText, runWithFeedback]);

  const handleAction = useCallback(
    (action: BorrowerLoanAction) => {
      if (!borrowerId || !loanId) {
        setActionState("error");
        setActionMessage("Borrower or loan id is missing.");
        return;
      }

      if (action === "Send notes" && !noteText.trim()) {
        setActionState("error");
        setActionMessage("Add a note before sending.");
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
    [borrowerId, loanId, noteText, runWithFeedback]
  );

  return {
    noteText,
    noteActionState,
    noteActionMessage,
    actionState,
    actionMessage,
    handleNoteTextChange,
    handleAddNote,
    handleAction
  };
}
