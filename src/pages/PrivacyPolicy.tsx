import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <h1 className="text-4xl font-bold text-foreground mb-8">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: December 2024</p>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Introduction</h2>
            <p className="text-muted-foreground">
              This Privacy Policy describes how IPO AI Assistant ("we", "our", or "us") collects, uses, 
              and protects your personal information when you use our Microsoft Word Add-in and related services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. Information We Collect</h2>
            <h3 className="text-xl font-medium text-foreground mb-2">2.1 Document Content</h3>
            <p className="text-muted-foreground mb-4">
              When you use the IPO AI Assistant, we process the document content you submit for analysis. 
              This content is used solely to provide compliance checking and suggestions.
            </p>
            
            <h3 className="text-xl font-medium text-foreground mb-2">2.2 Account Information</h3>
            <p className="text-muted-foreground mb-4">
              We collect your email address and authentication credentials when you create an account 
              to use our services.
            </p>
            
            <h3 className="text-xl font-medium text-foreground mb-2">2.3 Usage Data</h3>
            <p className="text-muted-foreground">
              We collect anonymized usage statistics to improve our service, including features used, 
              analysis requests, and amendment acceptance rates.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>To provide AI-powered compliance analysis of your IPO prospectus documents</li>
              <li>To generate regulatory compliance suggestions based on HKEX listing rules</li>
              <li>To improve our AI models and service quality (using anonymized data only)</li>
              <li>To communicate with you about service updates and support</li>
              <li>To ensure the security and integrity of our services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Data Storage and Security</h2>
            <p className="text-muted-foreground mb-4">
              Your data is stored securely using industry-standard encryption. We use Supabase as our 
              backend infrastructure, which provides enterprise-grade security measures including:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>AES-256 encryption for data at rest</li>
              <li>TLS 1.3 encryption for data in transit</li>
              <li>Row Level Security (RLS) for database access control</li>
              <li>Regular security audits and penetration testing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Data Retention</h2>
            <p className="text-muted-foreground">
              We retain your document analysis data for 90 days to support your workflow. 
              You can request deletion of your data at any time by contacting our support team. 
              Account information is retained until you delete your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Third-Party Services</h2>
            <p className="text-muted-foreground mb-4">
              We use the following third-party services to operate our platform:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Supabase</strong> - Database and authentication services</li>
              <li><strong>AI Language Models</strong> - For document analysis and compliance checking</li>
              <li><strong>Microsoft Office</strong> - Word Add-in integration</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. Your Rights</h2>
            <p className="text-muted-foreground mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your data in a portable format</li>
              <li>Withdraw consent for data processing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have questions about this Privacy Policy or our data practices, please contact us at:{" "}
              <a href="mailto:privacy@ipo-ai-assistant.com" className="text-primary hover:underline">
                privacy@ipo-ai-assistant.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
