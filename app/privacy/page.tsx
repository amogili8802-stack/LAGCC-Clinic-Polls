export const metadata = {
  title: "Privacy Policy",
};

const clubName = process.env.CLUB_NAME || "LAGCC";

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-court-navy">Privacy Policy</h1>
        <p className="mt-1 text-sm text-court-navy/50">{clubName} Tennis Clinics</p>
      </div>

      <div className="space-y-5 rounded-2xl border border-court-navy/10 bg-white p-6 text-sm leading-relaxed text-court-navy/80 shadow-card">
        <p>
          This Privacy Policy explains what information {clubName} Tennis Clinics collects through
          this website and how it&apos;s used.
        </p>

        <div>
          <h2 className="font-display text-base font-semibold text-court-navy">Information we collect</h2>
          <p className="mt-1.5">
            When a parent creates an account, we collect their name, phone number, an optional email
            address, and a password. When signing a child up for a clinic, we also collect the
            child&apos;s name, age, and club member number (if applicable). Coaches who log in provide
            a name, email, and password.
          </p>
        </div>

        <div>
          <h2 className="font-display text-base font-semibold text-court-navy">How we use it</h2>
          <p className="mt-1.5">
            We use this information to create and manage accounts, process clinic sign-ups, and send
            SMS text messages and, where an email is provided, emails about clinic activity —
            including sign-up confirmations, waitlist status, and cancellation notices (for example, if
            a clinic is cancelled due to weather or low enrollment). We do not send marketing texts, and
            we do not sell or share your SMS opt-in data or personal information with third parties
            for marketing purposes.
          </p>
        </div>

        <div>
          <h2 className="font-display text-base font-semibold text-court-navy">Data retention and security</h2>
          <p className="mt-1.5">
            Account and sign-up information is retained for as long as the account is active, so
            parents can view their clinic history. Passwords are stored as one-way hashes, never in
            plain text. We don&apos;t use third-party advertising or analytics trackers on this site.
          </p>
        </div>

        <div>
          <h2 className="font-display text-base font-semibold text-court-navy">Contact</h2>
          <p className="mt-1.5">
            Questions about this policy or your data? Contact the pro shop at {clubName}.
          </p>
        </div>
      </div>
    </div>
  );
}
