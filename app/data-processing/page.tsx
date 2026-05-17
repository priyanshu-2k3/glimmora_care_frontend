import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'

function LegalLayout({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ivory-cream">
      <header className="sticky top-0 z-50 bg-white/96 backdrop-blur-md border-b border-sand-light/70 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-[68px] flex items-center justify-between">
          <Logo href="/" height={32} />
          <Link href="/login" className="text-[13px] font-body font-medium text-charcoal-deep hover:text-gold-deep transition-colors">
            Log in →
          </Link>
        </div>
      </header>

      <div className="border-b border-sand-light bg-white py-14 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-[11px] font-body uppercase tracking-[0.22em] text-gold-deep font-semibold mb-3">Legal</p>
          <h1 className="font-display text-[42px] sm:text-[52px] text-charcoal-deep leading-tight mb-3">{title}</h1>
          <p className="text-[14px] font-body text-stone">{subtitle}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-14">
        <div>{children}</div>
      </div>

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

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-sand-light my-4">
      <table className="w-full text-[13px] font-body">
        <thead>
          <tr className="bg-ivory-warm border-b border-sand-light">
            {headers.map(h => (
              <th key={h} className="text-left px-4 py-3 font-semibold text-charcoal-deep">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-ivory-cream'}>
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-stone align-top">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function DataProcessing() {
  return (
    <LegalLayout
      title="Data Processing Agreement"
      subtitle="Last updated: May 2026 · Effective date: May 1, 2026"
    >
      <p className="text-[14px] font-body text-stone leading-[1.85] mb-10">
        This Data Processing Agreement ("DPA") describes how Glimmora Technologies Pvt. Ltd.
        ("GlimmoraCare", "Processor") processes personal data on behalf of users and healthcare
        organisations ("Data Principals" / "Controllers") in accordance with the Digital Personal
        Data Protection Act 2023 (DPDP Act) and applicable data protection law.
      </p>

      <Section title="1. Definitions">
        <p><strong className="text-charcoal-deep">Personal Data:</strong> Any data about an identifiable individual — including name, contact details, health records, and health markers.</p>
        <p><strong className="text-charcoal-deep">Health Data:</strong> A subset of personal data relating to the physical or mental health of an individual, including lab results, diagnostic markers, and risk scores. Health data is treated as sensitive personal data.</p>
        <p><strong className="text-charcoal-deep">Data Principal:</strong> The individual to whom the personal data relates (the patient or account holder).</p>
        <p><strong className="text-charcoal-deep">Data Fiduciary:</strong> Glimmora Technologies Pvt. Ltd., which determines the purpose and means of processing personal data.</p>
        <p><strong className="text-charcoal-deep">Sub-processor:</strong> A third party engaged by GlimmoraCare to process personal data on its behalf.</p>
      </Section>

      <Section title="2. Categories of Personal Data Processed">
        <Table
          headers={['Category', 'Data Types', 'Sensitivity']}
          rows={[
            ['Identity', 'Name, email, phone, date of birth, gender, location', 'Standard'],
            ['Authentication', 'Password hash, OTP records, 2FA secrets, session tokens', 'High'],
            ['Health records', 'Lab report files (JPEG/PNG/PDF), extracted health markers, record metadata', 'Sensitive'],
            ['Health intelligence', 'Digital Health Twin data, risk scores, trend insights', 'Sensitive'],
            ['Consent records', 'Consent grants, revocations, scope, timestamps', 'Standard'],
            ['Audit trail', 'Access logs, action timestamps, user and record identifiers', 'Standard'],
            ['Family profiles', 'Dependent name, relation, DOB, blood group, gender', 'Sensitive'],
            ['Usage data', 'IP address, device type, browser, page visits', 'Standard'],
          ]}
        />
      </Section>

      <Section title="3. Purposes & Legal Basis of Processing">
        <Table
          headers={['Purpose', 'Legal Basis']}
          rows={[
            ['Account creation and authentication', 'Performance of contract (Terms of Use)'],
            ['Health record digitisation via OCR', 'Explicit consent of data principal'],
            ['Digital Health Twin computation', 'Explicit consent of data principal'],
            ['AI insight generation', 'Explicit consent of data principal'],
            ['Consent-based record sharing with doctors', 'Explicit consent of data principal'],
            ['Transactional communications (OTPs, notifications)', 'Legitimate interest / contractual necessity'],
            ['Audit logging for security and compliance', 'Legitimate interest / legal obligation'],
            ['Payment processing', 'Performance of contract'],
            ['Legal compliance and fraud prevention', 'Legal obligation'],
          ]}
        />
      </Section>

      <Section title="4. Data Retention Schedule">
        <Table
          headers={['Data Type', 'Retention Period', 'Basis']}
          rows={[
            ['Account & profile data', 'Duration of account + 30 days post-deletion', 'Contractual'],
            ['Health records & markers', 'Duration of account + 30 days post-deletion', 'User consent'],
            ['Digital Health Twin data', 'Duration of account + 30 days post-deletion', 'User consent'],
            ['Audit trail (record access)', 'Up to 7 years', 'Legal/regulatory compliance'],
            ['Platform audit logs (admin actions)', 'Up to 7 years', 'Legal/regulatory compliance'],
            ['Session tokens', 'Until expiry or explicit revocation', 'Security'],
            ['OTP and verification records', '10 minutes to 24 hours (TTL-based)', 'Security'],
            ['Payment records', 'As required by Indian tax law (typically 8 years)', 'Legal obligation'],
          ]}
        />
      </Section>

      <Section title="5. Sub-processors">
        <p>We engage the following categories of sub-processors to operate the platform. All sub-processors are bound by contractual data protection obligations:</p>
        <Table
          headers={['Category', 'Location', 'Purpose', 'Data Shared']}
          rows={[
            ['Database provider', 'India / Cloud', 'Primary database', 'All personal and health data (encrypted at rest)'],
            ['Cloud storage provider', 'Cloud', 'Document storage', 'Health record files (server-side encrypted)'],
            ['AI processing provider', 'International', 'OCR extraction & AI chat', 'Health record images and text; chat context'],
            ['Authentication provider', 'International', 'Google Sign-In authentication', 'Email address, authentication UID only'],
            ['Email delivery provider', 'International', 'Transactional email delivery', 'Email address and message content only'],
            ['Payment processor', 'India', 'Payment processing', 'Payment metadata; no health data'],
            ['Cloud hosting provider', 'India / Global', 'Backend server hosting', 'API traffic; no persistent data storage'],
            ['Frontend hosting provider', 'Global CDN', 'Frontend hosting', 'No personal data stored; static assets only'],
          ]}
        />
        <p>
          We will notify Data Principals of any changes to sub-processors that may affect the
          protection of their personal data, with at least 14 days' advance notice.
        </p>
      </Section>

      <Section title="6. Security Measures">
        <p>We implement the following technical and organisational measures to protect personal data:</p>
        <Table
          headers={['Measure', 'Implementation']}
          rows={[
            ['Encryption in transit', 'TLS 1.2+ enforced on all connections in production'],
            ['Encryption at rest', 'Database-level encryption + AES-256-GCM field-level encryption on all health markers'],
            ['File encryption', 'Server-side encryption on all uploaded documents in cloud storage'],
            ['Access control', 'Role-based access control (RBAC) enforced at every API endpoint'],
            ['Authentication', 'Secure password hashing; JWT with short-lived access tokens'],
            ['Session security', 'Server-side session store; individual and bulk session revocation'],
            ['Input validation', 'Strict schema validation on all API inputs'],
            ['Audit logging', 'Immutable logs on every data access event, consent change, and admin action'],
            ['Vulnerability management', 'Dependency updates and security patches applied regularly'],
            ['Access reviews', 'Quarterly internal review of staff access to production systems'],
          ]}
        />
      </Section>

      <Section title="7. International Data Transfers">
        <p>
          Certain service providers used to operate the platform — including our AI processing
          provider for OCR and chat inference — are located outside India. When health data is
          transferred internationally for processing, it is done under explicit user consent and
          subject to contractual data protection commitments with those providers.
        </p>
        <p>
          We do not transfer health data internationally for any purpose other than AI-assisted
          processing. We are actively evaluating India-hosted infrastructure to minimise
          cross-border transfers in future.
        </p>
      </Section>

      <Section title="8. Data Principal Rights">
        <p>Data Principals may exercise the following rights under the DPDP Act 2023 at any time:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong className="text-charcoal-deep">Right of access:</strong> Request a full export of all personal data held about you</li>
          <li><strong className="text-charcoal-deep">Right to correction:</strong> Request correction of inaccurate personal or health data</li>
          <li><strong className="text-charcoal-deep">Right to erasure:</strong> Request deletion of your account and all associated data</li>
          <li><strong className="text-charcoal-deep">Right to withdraw consent:</strong> Withdraw consent for specific processing activities at any time via the platform or by contacting us</li>
          <li><strong className="text-charcoal-deep">Right to grievance redressal:</strong> Lodge a complaint with our Data Protection Officer</li>
          <li><strong className="text-charcoal-deep">Right to nominate:</strong> Nominate another individual to exercise rights on your behalf in the event of death or incapacity</li>
        </ul>
        <p>
          Requests can be submitted to{' '}
          <a href="mailto:privacy@glimmora.ai" className="text-gold-deep hover:underline">privacy@glimmora.ai</a>.
          We will respond within 30 days. Identity verification may be required before processing requests.
        </p>
      </Section>

      <Section title="9. Data Breach Notification">
        <p>
          In the event of a personal data breach that is likely to result in harm to Data Principals,
          GlimmoraCare will:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Notify affected Data Principals within 72 hours of becoming aware of the breach</li>
          <li>Report the breach to the Data Protection Board of India as required under the DPDP Act</li>
          <li>Provide details of the nature of the breach, data affected, likely consequences, and remediation steps</li>
        </ul>
      </Section>

      <Section title="10. Organisational Data Processing">
        <p>
          Healthcare organisations (clinics, hospitals, diagnostic centres) that use GlimmoraCare
          as Data Fiduciaries are required to maintain their own records of processing activities
          for data they access through the platform. GlimmoraCare acts as a Processor for
          organisation-initiated data access governed by patient consent.
        </p>
        <p>
          Organisations must ensure they have a lawful basis for requesting access to patient records
          and must comply with applicable Indian healthcare law, including the Clinical Establishments
          Act and any applicable state-level regulations.
        </p>
      </Section>

      <Section title="11. Contact & Grievance">
        <p>
          Data Protection Officer · Glimmora Technologies Pvt. Ltd.<br />
          Email: <a href="mailto:privacy@glimmora.ai" className="text-gold-deep hover:underline">privacy@glimmora.ai</a><br />
          Support: <a href="mailto:support@glimmora.ai" className="text-gold-deep hover:underline">support@glimmora.ai</a>
        </p>
        <p>
          If you believe your data protection rights have not been adequately addressed, you may
          lodge a complaint with the Data Protection Board of India.
        </p>
      </Section>
    </LegalLayout>
  )
}
