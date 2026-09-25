export const metadata = {
  title: "Terms & Conditions",
};

const clubName = process.env.CLUB_NAME || "LAGCC";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-court-navy">Terms &amp; Conditions</h1>
        <p className="mt-1 text-sm text-court-navy/50">{clubName} Tennis Clinics</p>
      </div>

      <div className="space-y-5 rounded-2xl border border-court-navy/10 bg-white p-6 text-sm leading-relaxed text-court-navy/80 shadow-card">
        <p>
          These terms cover use of the {clubName} Tennis Clinics website to sign kids up for clinics
          and manage those sign-ups.
        </p>

        <div>
          <h2 className="font-display text-base font-semibold text-court-navy">Using this site</h2>
          <p className="mt-1.5">
            This site is provided for {clubName} members and their families to sign up for clinics.
            Information you provide (a parent or guardian&apos;s cell phone number and each child&apos;s
            name) is used to run clinic sign-ups as described in our{" "}
            <a href="/privacy" className="font-semibold text-court-green hover:underline">
              Privacy Policy
            </a>
            . Cancelling a sign-up less than 24 hours before a clinic&apos;s start time may still incur
            a charge, per club policy.
          </p>
        </div>

        <div>
          <h2 className="font-display text-base font-semibold text-court-navy">SMS Terms</h2>
          <p className="mt-1.5">
            The sign-up form has a separate, optional checkbox for text updates about your clinic
            sign-ups — confirmations, waitlist status, and cancellation notices. Checking it is never
            required to sign up or manage a sign-up. These are transactional messages tied to your own
            sign-up activity, not marketing. Message frequency varies with how often you sign up for or
            manage clinics. Message and data rates may apply. Reply STOP at any time to opt out of
            texts, or HELP for help.
          </p>
        </div>

        <div>
          <h2 className="font-display text-base font-semibold text-court-navy">Contact</h2>
          <p className="mt-1.5">Questions about these terms? Contact the pro shop at {clubName}.</p>
        </div>
      </div>
    </div>
  );
}
