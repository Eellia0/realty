/** Обязательная галочка согласия на обработку персональных данных. */
export function ConsentCheckbox({ id = "consent" }: { id?: string }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-muted">
      <input id={id} name="consent" type="checkbox" required className="mt-0.5 h-4 w-4 shrink-0 accent-accent" />
      <span>
        Я согласен на обработку персональных данных в соответствии с{" "}
        <a href="/privacy" target="_blank" className="font-medium text-accent-dark underline underline-offset-2">
          политикой конфиденциальности
        </a>
      </span>
    </label>
  );
}
