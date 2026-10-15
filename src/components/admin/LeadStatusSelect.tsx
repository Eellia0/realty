"use client";

import { setLeadStatus } from "@/actions/admin";
import { LEAD_STATUSES } from "@/lib/constants";

export function LeadStatusSelect({ id, status }: { id: number; status: string }) {
  return (
    <form key={status} action={setLeadStatus}>
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        defaultValue={status}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="input py-1.5"
        aria-label="Статус заявки"
      >
        {Object.entries(LEAD_STATUSES).map(([k, l]) => (
          <option key={k} value={k}>{l}</option>
        ))}
      </select>
    </form>
  );
}
