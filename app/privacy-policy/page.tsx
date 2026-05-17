import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'

function LegalLayout({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ivory-cream">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/96 backdrop-blur-md border-b border-sand-light/70 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-[68px] flex items-center justify-between">
          <Logo href="/" height={32} />
          <Link href="/login" className="text-[13px] font-body font-medium text-charcoal-deep hover:text-gold-deep transition-colors">
            Log in →
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="border-b border-sand-light bg-white py-14 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-[11px] font-body uppercase tracking-[0.22em] text-gold-deep font-semibold mb-3">Legal</p>
          <h1 className="font-display text-[42px] sm:text-[52px] text-charcoal-deep leading-tight mb-3">{title}</h1>
          <p className="text-[14px] font-body text-stone">{subtitle}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-14">
        <div className="prose-legal">{children}</div>
      </div>

      {/* Footer */}
      <div className="border-t border-sand-light bg-white py-8 px-6">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row justify-between gap-3 text-[12px] font-body text-greige">
          <p>© {new Date().getFullYear()} Glimmora Technologies Pvt. Ltd. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="/privacy-policy" className="hover:text-charcoal-deep transition-colors">Privacy Policy</Link>
            <Link href="/terms-of-use" className="hover:text-charcoal-deep transition-colors">Terms of Use</Link>
            <Link href="/data-processing" className="hover:text-charcoal-deep transition-colors">Data Processing</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <h2 className="font-display text-[26px] text-charcoal-deep mb-4 pb-2 border-b border-sand-light">{title}</h2>
      <div className="space-y-4 text-[14px] font-body text-stone leading-[1.85]">{children}</div>
    </div>
  )
}

export default function PrivacyPolicy() {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="Last updated: May 2026 · Effective date: May 1, 2026"
    >
      <p className="text-[14px] font-body text-stone leading-[1.85] mb-10">
        Glimmora Technologies Pvt. Ltd. ("GlimmoraCare", "we", "our", or "us") is committed to protecting your
        personal health information. This Privacy Policy explains how we collect, use, store, share, and protect
        your data when you use our platform. By using GlimmoraCare, you agree to the practices described in this policy.
      </p>

      <Section title="1. Who We Are">
        <p>
          GlimmoraCare is a preventive health intelligence platform operated by Glimmora Technologies Pvt. Ltd.,
          incorporated in India. We enable individuals and healthcare organisations to digitise, manage, and derive
          insights from health records in a secure, consent-first environment.
        </p>
        <p>
          For questions about this policy, contact us at{' '}
          <a href="mailto:privacy@glimmora.ai" className="text-gold-deep hover:underline">privacy@glimmora.ai</a>.
        </p>
      </Section>

      <Section title="2. Information We Collect">
        <p><strong className="text-charcoal-deep">Account information:</strong> Name, email address, phone number, date of birth, gender, and location when you register an account.</p>
        <p><strong className="text-charcoal-deep">Health records:</strong> Lab reports, diagnostic documents, and extracted health markers (e.g., haemoglobin, glucose, cholesterol) that you upload or that are entered manually by an authorised healthcare provider.</p>
        <p><strong className="text-charcoal-deep">Family profiles:</strong> If you manage dependents (children, elderly parents), we collect their name, relationship, date of birth, blood group, and gender as provided by you.</p>
        <p><strong className="text-charcoal-deep">Usage data:</strong> Device type, IP address, browser, pages visited, and feature interactions — used solely to improve platform reliability and security.</p>
        <p><strong className="text-charcoal-deep">Communications:</strong> Email correspondence and support requests sent to us.</p>
      </Section>

      <Section title="3. How We Use Your Information">
        <p>We use your personal and health data exclusively to:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Provide, maintain, and improve the GlimmoraCare platform</li>
          <li>Digitise uploaded health records and extract structured health markers via OCR</li>
          <li>Compute your Digital Health Twin — a longitudinal model of your health trends</li>
          <li>Generate preventive AI insights (non-diagnostic) based on your historical data</li>
          <li>Enable consent-based sharing of your records with authorised doctors</li>
          <li>Send transactional emails (OTPs, account verification, consent notifications)</li>
          <li>Maintain an immutable audit trail of all data access events</li>
          <li>Comply with applicable Indian law, including the DPDP Act 2023</li>
        </ul>
        <p>We do not use your health data for advertising, profiling for commercial purposes, or sale to third parties.</p>
      </Section>

      <Section title="4. Data Storage & Residency">
        <p>
          All personal and health data is stored on servers located within India. Health record files
          (lab reports, documents) are stored using encrypted cloud object storage with server-side encryption.
        </p>
        <p>
          We apply AES-256-GCM field-level encryption to all health marker values in the database.
          This means your actual health readings are encrypted at the application layer — separate from
          and in addition to database-at-rest encryption.
        </p>
      </Section>

      <Section title="5. Consent & Data Sharing">
        <p>
          You are always in control of who can access your health records. We operate a strict
          consent-first model:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Doctors must request consent before they can view any of your records</li>
          <li>You can share records proactively with specific doctors at any time</li>
          <li>You can revoke consent at any time, for any reason, with immediate effect</li>
          <li>Every access event is logged with a timestamp, user identity, and action type</li>
        </ul>
        <p>
          Emergency access tokens (activated voluntarily by you) allow unauthenticated access to
          critical health information for a limited time period. These tokens expire automatically
          and can be deactivated by you at any time.
        </p>
      </Section>

      <Section title="6. Third-Party Services">
        <p>We integrate with select third-party service providers to operate the platform. These providers are contractually bound to process data only for the purposes we specify:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong className="text-charcoal-deep">AI processing provider:</strong> Health record OCR and AI chat responses. Uploaded records are processed by our AI provider and are subject to their data usage policies.</li>
          <li><strong className="text-charcoal-deep">Authentication provider:</strong> Google Sign-In authentication only. We do not share health data with this provider.</li>
          <li><strong className="text-charcoal-deep">Cloud storage provider:</strong> Secure encrypted storage for uploaded health record files.</li>
          <li><strong className="text-charcoal-deep">Email delivery provider:</strong> Transactional email delivery (OTPs, verification links, notifications). Only your email address and message content are shared.</li>
          <li><strong className="text-charcoal-deep">Payment processor:</strong> Payment processing. We do not store card or banking information.</li>
        </ul>
      </Section>

      <Section title="7. Your Rights Under DPDP Act 2023">
        <p>As a data principal under India's Digital Personal Data Protection Act 2023, you have the right to:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong className="text-charcoal-deep">Access:</strong> Request a copy of all personal data we hold about you</li>
          <li><strong className="text-charcoal-deep">Correction:</strong> Request correction of inaccurate or incomplete personal data</li>
          <li><strong className="text-charcoal-deep">Erasure:</strong> Request deletion of your account and associated personal data</li>
          <li><strong className="text-charcoal-deep">Grievance redressal:</strong> Lodge a complaint with our Data Protection Officer</li>
          <li><strong className="text-charcoal-deep">Withdraw consent:</strong> Withdraw consent for data processing at any time</li>
        </ul>
        <p>
          To exercise any of these rights, contact us at{' '}
          <a href="mailto:privacy@glimmora.ai" className="text-gold-deep hover:underline">privacy@glimmora.ai</a>.
          We will respond within 30 days.
        </p>
      </Section>

      <Section title="8. Data Retention">
        <p>
          We retain your account and health data for as long as your account is active. If you delete
          your account, we will delete or anonymise your personal data within 30 days, except where
          retention is required by applicable law.
        </p>
        <p>
          Audit trail records may be retained for up to 7 years for legal and regulatory compliance purposes.
        </p>
      </Section>

      <Section title="9. Security">
        <p>
          We implement multiple layers of security to protect your health data: AES-256-GCM
          field-level encryption, bcrypt password hashing, short-lived access tokens,
          server-side session management, time-limited secure file download URLs, and
          strict API input validation. All connections use HTTPS in production.
        </p>
        <p>
          Despite these measures, no system is completely immune to security risks. We will notify
          affected users promptly in the event of a data breach.
        </p>
      </Section>

      <Section title="10. Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. We will notify you of significant
          changes via email or a prominent notice on the platform at least 14 days before the change
          takes effect. Continued use after the effective date constitutes acceptance of the updated policy.
        </p>
      </Section>

      <Section title="11. Contact">
        <p>
          Data Protection Officer · Glimmora Technologies Pvt. Ltd.<br />
          Email: <a href="mailto:privacy@glimmora.ai" className="text-gold-deep hover:underline">privacy@glimmora.ai</a><br />
          Support: <a href="mailto:support@glimmora.ai" className="text-gold-deep hover:underline">support@glimmora.ai</a>
        </p>
      </Section>
    </LegalLayout>
  )
}
