"use client";

import { deleteProperty } from "@/actions/admin";

export function DeletePropertyButton({ id, title }: { id: number; title: string }) {
  return (
    <form
      action={deleteProperty}
      onSubmit={(e) => {
        if (!confirm(`Удалить объект «${title}»? Это действие нельзя отменить.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button className="btn btn-danger px-3 py-1.5">Удалить</button>
    </form>
  );
}
