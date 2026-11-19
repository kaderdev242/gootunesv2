"use client";

import { useActionState, useState } from "react";
import {
  ContractSignFields,
  EMPTY_SIGN_STATE,
  signStateError,
  type ContractSignState,
} from "@/components/contracts/ContractSignFields";
import { useActionToast } from "@/hooks/useActionToast";
import { signCreatorContract } from "@/lib/actions/contracts";
import type { ActionState } from "@/lib/actions/profile";
import type { ContractParty, ContractRole } from "@/lib/contracts/template";

const initial: ActionState = {};

/** Signature du contrat depuis le dashboard. */
export function ContractSignForm({
  role,
  party,
}: {
  role: ContractRole;
  party: Omit<ContractParty, "legalName" | "city">;
}) {
  const [value, setValue] = useState<ContractSignState>(EMPTY_SIGN_STATE);
  const [state, action, pending] = useActionState(signCreatorContract, initial);
  useActionToast(state);
  const blocking = signStateError(value);

  return (
    <form action={action} className="space-y-5">
      <ContractSignFields role={role} party={party} value={value} onChange={setValue} />
      <button
        type="submit"
        disabled={pending || Boolean(blocking)}
        className="flex h-12 w-full items-center justify-center rounded-full bg-white text-[15px] font-semibold text-black transition-[background-color,transform] duration-150 hover:bg-white/90 active:scale-[0.98] disabled:opacity-50 sm:w-auto sm:px-8"
      >
        {pending ? "Signature…" : "Signer le contrat"}
      </button>
      {blocking ? <p className="text-[13px] text-white/40">{blocking}</p> : null}
    </form>
  );
}
