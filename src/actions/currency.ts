"use server";

import { cookies } from "next/headers";
import { CURRENCY_COOKIE } from "@/lib/currency";
import { isCurrency } from "@/lib/money";

/** Запоминает выбранную валюту на год. */
export async function setCurrency(code: string) {
  if (!isCurrency(code)) return;
  (await cookies()).set(CURRENCY_COOKIE, code, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: true,
  });
}
