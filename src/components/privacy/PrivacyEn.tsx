import type { Settings } from "@/lib/settings";

/** English version of the privacy policy. Describes exactly what the site collects. Should be reviewed by a lawyer. */
export function PrivacyEn({ settings: s }: { settings: Settings }) {
  const operator = s.legalName || "the owner of the Novy Adres website";
  const contact = s.email || s.phone || "the details on our Contact page";

  return (
    <div className="container-page max-w-3xl py-10">
      <h1 className="text-3xl font-extrabold tracking-tight">Privacy policy</h1>
      <p className="mt-2 text-sm text-muted">Last updated: 15 October 2026</p>

      <div className="mt-8 space-y-7 leading-relaxed text-ink/90 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1">
        <section>
          <h2>1. Who processes your data</h2>
          <p>
            Personal data of visitors to the Novy Adres website is processed by {operator}. For any questions about your data,
            please contact: {contact}.
          </p>
        </section>

        <section>
          <h2>2. What data we receive</h2>
          <ul>
            <li>Your name, phone number and message when you request a viewing or ask us to find a property.</li>
            <li>Your email, name and password when you create an account. The password is stored only in encrypted form; we cannot see it.</li>
            <li>The list of properties you have saved.</li>
            <li>Your IP address, used only to protect against password guessing and spam and kept for no longer than one hour.</li>
          </ul>
        </section>

        <section>
          <h2>3. How we use it</h2>
          <ul>
            <li>To contact you about your request, shortlist properties and arrange viewings.</li>
            <li>To run your account: signing in, saved properties and password reset.</li>
            <li>To protect the website from abuse.</li>
          </ul>
          <p className="mt-2">We do not sell your data and do not use it for marketing emails without your separate consent.</p>
        </section>

        <section>
          <h2>4. Legal basis</h2>
          <p>
            Your consent, which you give by ticking the box in the request or registration form. You can withdraw it at any time by
            writing to us. We will then delete your data unless the law requires us to keep it.
          </p>
        </section>

        <section>
          <h2>5. Who receives your data</h2>
          <ul>
            <li>Requests are forwarded to our staff via Telegram and email so that we can reply faster.</li>
            <li>Maps on the website are provided by Yandex Maps. When you view a map, your browser connects to Yandex servers.</li>
            <li>The hosting provider whose servers run the website.</li>
          </ul>
        </section>

        <section>
          <h2>6. How long we keep it</h2>
          <p>
            Requests are kept for as long as we need them to work with you, and no longer than three years. Account data is kept
            while you use the account. You can ask us to delete your account at any time.
          </p>
        </section>

        <section>
          <h2>7. Cookies</h2>
          <p>
            The website uses only essential cookies: to keep you signed in, to remember your saved properties without an account,
            and to remember your chosen currency. There are no advertising or analytics cookies.
          </p>
        </section>

        <section>
          <h2>8. Your rights</h2>
          <p>
            You can find out what data we hold about you, correct or delete it, and withdraw your consent. To do so, please contact
            us: {contact}.
          </p>
        </section>
      </div>
    </div>
  );
}
