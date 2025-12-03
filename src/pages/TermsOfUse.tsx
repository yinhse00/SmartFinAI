import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const TermsOfUse = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <h1 className="text-4xl font-bold text-foreground mb-8">Terms of Use</h1>
        <p className="text-muted-foreground mb-8">Last updated: December 2024</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By installing, accessing, or using the IPO AI Assistant Microsoft Word Add-in ("Add-in") 
              and related services ("Services"), you agree to be bound by these Terms of Use. 
              If you do not agree to these terms, do not use the Services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. Description of Service</h2>
            <p className="text-muted-foreground">
              IPO AI Assistant provides AI-powered compliance analysis for IPO prospectus documents, 
              specifically focusing on Hong Kong Stock Exchange (HKEX) listing rules and regulations. 
              The Service analyzes document content and provides suggestions for regulatory compliance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. User Accounts</h2>
            <p className="text-muted-foreground mb-4">
              To use the Services, you must create an account. You agree to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Permitted Use</h2>
            <p className="text-muted-foreground mb-4">You may use the Services to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Analyze IPO prospectus documents for regulatory compliance</li>
              <li>Receive AI-generated suggestions for document improvements</li>
              <li>Apply suggested amendments to your documents</li>
              <li>Export analyzed documents with track changes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Prohibited Use</h2>
            <p className="text-muted-foreground mb-4">You may not:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Use the Services for any illegal purpose</li>
              <li>Attempt to reverse engineer or decompile the Add-in</li>
              <li>Share your account credentials with third parties</li>
              <li>Upload malicious content or attempt to compromise the Services</li>
              <li>Use the Services to process documents you do not have rights to</li>
              <li>Resell or redistribute the Services without authorization</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Disclaimer of Warranties</h2>
            <p className="text-muted-foreground mb-4">
              <strong>IMPORTANT:</strong> The IPO AI Assistant is a tool to assist with document analysis. 
              It does NOT provide legal, financial, or professional advice.
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>AI suggestions are provided "as is" without warranty of accuracy or completeness</li>
              <li>You should always verify suggestions with qualified legal and financial professionals</li>
              <li>We do not guarantee that using the Service will ensure regulatory approval</li>
              <li>The Service may not identify all compliance issues in your documents</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              To the maximum extent permitted by law, IPO AI Assistant and its operators shall not be 
              liable for any indirect, incidental, special, consequential, or punitive damages arising 
              from your use of the Services. Our total liability shall not exceed the fees paid by you 
              in the twelve months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Intellectual Property</h2>
            <p className="text-muted-foreground mb-4">
              The Add-in, including all code, designs, and content, is owned by us and protected by 
              intellectual property laws. You retain ownership of all documents you submit for analysis.
            </p>
            <p className="text-muted-foreground">
              You grant us a limited license to process your documents solely for the purpose of 
              providing the Services. We do not claim ownership of your content.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">9. Modifications to Terms</h2>
            <p className="text-muted-foreground">
              We may modify these Terms at any time. We will notify you of significant changes via 
              email or through the Add-in interface. Continued use of the Services after changes 
              constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">10. Termination</h2>
            <p className="text-muted-foreground">
              We may suspend or terminate your access to the Services at any time for violation of 
              these Terms or for any other reason at our sole discretion. You may terminate your 
              account at any time by contacting support.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">11. Governing Law</h2>
            <p className="text-muted-foreground">
              These Terms shall be governed by the laws of Hong Kong SAR. Any disputes shall be 
              resolved in the courts of Hong Kong.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">12. Contact</h2>
            <p className="text-muted-foreground">
              For questions about these Terms, please contact us at:{" "}
              <a href="mailto:legal@ipo-ai-assistant.com" className="text-primary hover:underline">
                legal@ipo-ai-assistant.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfUse;
