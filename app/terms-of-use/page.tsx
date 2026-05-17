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

export default function TermsOfUse() {
  return (
    <LegalLayout
      title="Terms of Use"
      subtitle="Last updated: May 2026 · Effective date: May 1, 2026"
    >
      <p className="text-[14px] font-body text-stone leading-[1.85] mb-10">
        These Terms of Use ("Terms") govern your access to and use of the GlimmoraCare platform,
        operated by Glimmora Technologies Pvt. Ltd. ("GlimmoraCare", "we", "our", or "us").
        By creating an account or using any part of the platform, you agree to these Terms.
        If you do not agree, do not use the platform.
      </p>

      <Section title="1. Platform Description">
        <p>
          GlimmoraCare is a preventive health intelligence platform that enables users to upload,
          digitise, and manage personal health records; view longitudinal health trends via a Digital
          Health Twin; share records with healthcare providers under explicit consent; and receive
          AI-generated preventive health insights.
        </p>
        <p>
          GlimmoraCare is a health information management tool. It is <strong className="text-charcoal-deep">not a medical device,
          clinical service, or diagnostic tool.</strong> Nothing on the platform constitutes medical
          advice, diagnosis, or treatment. Always consult a qualified healthcare professional for
          medical decisions.
        </p>
      </Section>

      <Section title="2. Eligibility">
        <p>You must be at least 18 years old to create an account. By registering, you confirm that:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>You are 18 years of age or older</li>
          <li>You have the legal capacity to enter into a binding agreement</li>
          <li>The information you provide during registration is accurate and complete</li>
          <li>You will maintain the accuracy of your account information</li>
        </ul>
        <p>
          If you are registering on behalf of a minor dependent, you confirm that you are their
          legal guardian and consent to these Terms on their behalf.
        </p>
      </Section>

      <Section title="3. User Accounts">
        <p>
          You are responsible for maintaining the confidentiality of your account credentials.
          You must notify us immediately at{' '}
          <a href="mailto:support@glimmora.ai" className="text-gold-deep hover:underline">support@glimmora.ai</a>{' '}
          if you suspect unauthorised access to your account.
        </p>
        <p>
          You are responsible for all activity that occurs under your account. We are not liable
          for any loss resulting from unauthorised use of your account where you have failed to
          keep your credentials secure.
        </p>
      </Section>

      <Section title="4. Acceptable Use">
        <p>You agree to use GlimmoraCare only for lawful purposes. You must not:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Upload fraudulent, falsified, or misleading health records</li>
          <li>Impersonate another person or misrepresent your role</li>
          <li>Attempt to access accounts, data, or systems you are not authorised to access</li>
          <li>Use automated scripts, bots, or scrapers to access the platform</li>
          <li>Interfere with, disrupt, or attack the platform or its infrastructure</li>
          <li>Use the platform in any way that violates applicable Indian law</li>
          <li>Share your account credentials with any third party</li>
          <li>Reverse-engineer, decompile, or attempt to extract source code from the platform</li>
        </ul>
      </Section>

      <Section title="5. Health Data & AI Disclaimer">
        <p>
          GlimmoraCare uses artificial intelligence to extract health markers from
          uploaded documents and to generate health insights. You acknowledge that:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>AI-extracted markers may contain errors and should be reviewed before acting on them</li>
          <li>AI-generated insights are informational only and are not a substitute for professional medical advice</li>
          <li>GlimmoraCare does not provide diagnosis, prognosis, or treatment recommendations</li>
          <li>The Digital Health Twin is a statistical model based on your uploaded data — it does not predict future health with certainty</li>
        </ul>
        <p>
          Always consult a qualified and registered medical professional before making any health decisions.
        </p>
      </Section>

      <Section title="6. Consent & Data Sharing">
        <p>
          When you grant a doctor or healthcare provider access to your records, you represent that
          you are doing so voluntarily and with full understanding of what is being shared. You may
          revoke consent at any time via the platform. Revocation is immediate and prospective —
          it does not erase any actions already taken by the provider before revocation.
        </p>
        <p>
          Emergency access tokens are activated entirely at your discretion. You are responsible
          for the security and use of any emergency share link you generate.
        </p>
      </Section>

      <Section title="7. Subscriptions & Payments">
        <p>
          Access to certain features requires an active subscription. Subscription fees are listed
          on the platform and may change with 30 days' notice to active subscribers.
        </p>
        <p>
          Payments are processed by a third-party payment processor. We do not store your payment card or banking details.
          Subscription fees are non-refundable except where required by applicable law or at our
          sole discretion.
        </p>
        <p>
          If your subscription lapses, your data remains stored and accessible for 90 days.
          After 90 days without renewal, your account may be suspended and data scheduled for deletion.
        </p>
      </Section>

      <Section title="8. Intellectual Property">
        <p>
          All software, design, content, and trademarks associated with GlimmoraCare are the
          exclusive property of Glimmora Technologies Pvt. Ltd. You are granted a limited,
          non-exclusive, non-transferable licence to use the platform for its intended purpose.
          This licence does not include the right to copy, modify, distribute, or create derivative
          works from any part of the platform.
        </p>
        <p>
          You retain ownership of the health data you upload. By uploading data, you grant us
          a limited licence to process it for the purpose of providing the platform's services.
        </p>
      </Section>

      <Section title="9. Limitation of Liability">
        <p>
          To the maximum extent permitted by Indian law, GlimmoraCare shall not be liable for
          any indirect, incidental, special, or consequential damages arising from your use of
          the platform, including but not limited to health decisions made based on AI-generated
          insights, data loss, or platform unavailability.
        </p>
        <p>
          Our total liability to you for any claim shall not exceed the amount you paid us in
          the 3 months preceding the claim.
        </p>
      </Section>

      <Section title="10. Termination">
        <p>
          We reserve the right to suspend or terminate your account at any time, with notice,
          if you violate these Terms. You may delete your account at any time from the Settings page.
          Upon termination, your data will be handled in accordance with our Privacy Policy.
        </p>
      </Section>

      <Section title="11. Governing Law">
        <p>
          These Terms are governed by and construed in accordance with the laws of India.
          Any disputes arising from these Terms shall be subject to the exclusive jurisdiction
          of the courts in Mumbai, Maharashtra, India.
        </p>
      </Section>

      <Section title="12. Changes to These Terms">
        <p>
          We may update these Terms from time to time. We will notify you of material changes
          via email at least 14 days before they take effect. Continued use of the platform
          after the effective date constitutes your acceptance of the revised Terms.
        </p>
      </Section>

      <Section title="13. Contact">
        <p>
          Glimmora Technologies Pvt. Ltd.<br />
          Email: <a href="mailto:legal@glimmora.ai" className="text-gold-deep hover:underline">legal@glimmora.ai</a><br />
          Support: <a href="mailto:support@glimmora.ai" className="text-gold-deep hover:underline">support@glimmora.ai</a>
        </p>
      </Section>
    </LegalLayout>
  )
}
