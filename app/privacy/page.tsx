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
            When signing a child up for a clinic, we collect a parent or guardian&apos;s cell phone
            number and the child&apos;s first and last name, plus whether the child is a club member.
            No account or password is required to sign up. Coaches who log in to manage clinics
            provide a name, email, and password.
          </p>
        </div>

        <div>
          <h2 className="font-display text-base font-semibold text-court-navy">How we use it</h2>
          <p className="mt-1.5">
            We use this information to process clinic sign-ups. The sign-up form has a separate,
            optional checkbox for text updates about clinic activity — sign-up confirmations, waitlist
            status, and cancellation notices (for example, if a clinic is cancelled due to weather or
            low enrollment). Checking it is never required to sign up; the phone number itself is only
            used to run and manage your sign-up. Coaches are notified about clinic activity separately
            and aren&apos;t affected by this choice. We do not send marketing texts, and we do not sell
            or share your SMS opt-in data or personal information with third parties for marketing
            purposes.
          </p>
        </div>

        <div>
          <h2 className="font-display text-base font-semibold text-court-navy">Data retention and security</h2>
          <p className="mt-1.5">
            Sign-up information is retained so a parent can look up and manage their own sign-ups by
            phone number, and so coaches can maintain accurate clinic rosters. Coach passwords are
            stored as one-way hashes, never in plain text. We don&apos;t use third-party advertising
            or analytics trackers on this site.
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
