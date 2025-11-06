import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "wouter";
import { Brain, ArrowLeft, Shield, Lock, Eye, Users, FileText, AlertCircle } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-100 via-teal-50 to-blue-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Adaptalyfe</h1>
                <p className="text-xs text-gray-500">Privacy Policy</p>
              </div>
            </div>
            <Link href="/landing">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <Card className="mb-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
          <CardHeader className="text-center pb-8 pt-12">
            <div className="flex justify-center mb-4">
              <div className="bg-white/20 p-4 rounded-full">
                <Shield className="w-12 h-12" />
              </div>
            </div>
            <CardTitle className="text-4xl font-bold mb-2">Privacy Policy</CardTitle>
            <CardDescription className="text-white/90 text-lg">
              Effective Date: July 12, 2025
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Introduction */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              Introduction
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700">
            <p>
              Adaptalyfe ("we," "our," or "us") is committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and related services.
            </p>
            <p>
              Our mission is to empower individuals with neurodevelopmental disabilities to build independence while maintaining the highest standards of data privacy and security.
            </p>
          </CardContent>
        </Card>

        {/* Information We Collect */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Eye className="w-6 h-6 text-blue-600" />
              Information We Collect
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-blue-600 mb-3">Personal Information</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex gap-2">
                  <span className="font-semibold min-w-fit">Account Information:</span>
                  <span>Name, email address, username, password</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold min-w-fit">Profile Data:</span>
                  <span>Age, disability type (optional), accessibility preferences</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold min-w-fit">Contact Information:</span>
                  <span>Emergency contacts, healthcare providers, family members</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-blue-600 mb-3">Health Information (HIPAA Protected)</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex gap-2">
                  <span className="font-semibold min-w-fit">Medical Data:</span>
                  <span>Medications, allergies, medical conditions, symptoms</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold min-w-fit">Wellness Tracking:</span>
                  <span>Daily mood entries, task completion, achievement progress</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold min-w-fit">Healthcare Records:</span>
                  <span>Appointment schedules, provider information, medical notes</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-blue-600 mb-3">Usage Information</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex gap-2">
                  <span className="font-semibold min-w-fit">App Activity:</span>
                  <span>Feature usage, task completion rates, time spent in app</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold min-w-fit">Device Information:</span>
                  <span>Device type, operating system, app version</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold min-w-fit">Location Data:</span>
                  <span>Only when explicitly enabled for safety features</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-blue-600 mb-3">Communication Data</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex gap-2">
                  <span className="font-semibold min-w-fit">Messages:</span>
                  <span>Communications with caregivers, AI assistant interactions</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold min-w-fit">Support Communications:</span>
                  <span>Customer service inquiries and responses</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* How We Use Your Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Lock className="w-6 h-6 text-blue-600" />
              How We Use Your Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-blue-600 mb-3">Primary Uses</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex gap-2">
                  <span className="font-semibold min-w-fit">Independence Building:</span>
                  <span>Personalized task management and progress tracking</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold min-w-fit">Health Management:</span>
                  <span>Medication reminders, symptom tracking, appointment scheduling</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold min-w-fit">Safety Features:</span>
                  <span>Emergency contact access, location sharing (when enabled)</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold min-w-fit">Family Coordination:</span>
                  <span>Caregiver dashboard access with your permission</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold min-w-fit">AI Support:</span>
                  <span>Contextual assistance from our AdaptAI feature</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-blue-600 mb-3">Secondary Uses</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex gap-2">
                  <span className="font-semibold min-w-fit">App Improvement:</span>
                  <span>Analytics to enhance user experience and accessibility</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold min-w-fit">Security:</span>
                  <span>Fraud prevention and account security</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold min-w-fit">Legal Compliance:</span>
                  <span>Meeting regulatory requirements and legal obligations</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Information Sharing */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" />
              Information Sharing and Disclosure
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-blue-600 mb-3">Authorized Sharing</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex gap-2">
                  <span className="font-semibold min-w-fit">Caregivers:</span>
                  <span>Only with your explicit permission and control</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold min-w-fit">Healthcare Providers:</span>
                  <span>When you choose to share medical summaries</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold min-w-fit">Emergency Contacts:</span>
                  <span>During safety emergencies or when you request assistance</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-blue-600 mb-3">Required Disclosures</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex gap-2">
                  <span className="font-semibold min-w-fit">Legal Requirements:</span>
                  <span>When required by law or legal process</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold min-w-fit">Safety Situations:</span>
                  <span>To prevent harm to you or others</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold min-w-fit">Service Providers:</span>
                  <span>Third-party vendors who help operate our service (under strict confidentiality)</span>
                </li>
              </ul>
            </div>

            {/* Never Shared Highlight */}
            <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-lg">
              <h3 className="text-lg font-semibold text-blue-700 mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Never Shared
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex gap-2">
                  <span className="font-semibold min-w-fit">Marketing:</span>
                  <span>We never sell your personal information to marketers</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold min-w-fit">Advertising:</span>
                  <span>We don't use your health information for advertising</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold min-w-fit">Unauthorized Third Parties:</span>
                  <span>No sharing without your explicit consent</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Data Security */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Shield className="w-6 h-6 text-blue-600" />
              Data Security and Protection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-blue-600 mb-3">Technical Safeguards</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex gap-2">
                  <span className="font-semibold min-w-fit">Encryption:</span>
                  <span>All data encrypted in transit and at rest</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold min-w-fit">Access Controls:</span>
                  <span>Multi-factor authentication and role-based access</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold min-w-fit">Regular Audits:</span>
                  <span>Security assessments and vulnerability testing</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold min-w-fit">Secure Infrastructure:</span>
                  <span>Industry-standard cloud security practices</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-blue-600 mb-3">HIPAA Compliance</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex gap-2">
                  <span className="font-semibold min-w-fit">Protected Health Information:</span>
                  <span>Treated according to HIPAA standards</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold min-w-fit">Business Associate Agreements:</span>
                  <span>With all relevant service providers</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold min-w-fit">Breach Notification:</span>
                  <span>Immediate notification procedures in place</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold min-w-fit">Audit Logs:</span>
                  <span>Comprehensive tracking of all data access</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Your Privacy Rights */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Lock className="w-6 h-6 text-blue-600" />
              Your Privacy Rights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-blue-600 mb-3">Access and Control</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex gap-2">
                  <span className="font-semibold min-w-fit">View Your Data:</span>
                  <span>Access all information we have about you</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold min-w-fit">Correct Information:</span>
                  <span>Update or correct inaccurate data</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold min-w-fit">Delete Data:</span>
                  <span>Request deletion of your personal information</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold min-w-fit">Export Data:</span>
                  <span>Download your information in a portable format</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-blue-600 mb-3">Sharing Controls</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex gap-2">
                  <span className="font-semibold min-w-fit">Caregiver Access:</span>
                  <span>Grant or revoke caregiver permissions anytime</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold min-w-fit">Data Sharing:</span>
                  <span>Control what information is shared with whom</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold min-w-fit">Communication Preferences:</span>
                  <span>Manage how and when we contact you</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Children's Privacy */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">Children's Privacy (Under 13)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-600">Parental Consent</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex gap-2">
                <span className="font-semibold min-w-fit">Required:</span>
                <span>We require verifiable parental consent for users under 13</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold min-w-fit">Limited Collection:</span>
                <span>We collect only information necessary for the service</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold min-w-fit">Parental Control:</span>
                <span>Parents can review, modify, or delete their child's information</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold min-w-fit">No Marketing:</span>
                <span>We don't market to children or collect information for marketing</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Data Retention */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">Data Retention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-600">Retention Periods</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex gap-2">
                <span className="font-semibold min-w-fit">Account Data:</span>
                <span>Retained while your account is active</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold min-w-fit">Health Information:</span>
                <span>Retained for 7 years as required by law</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold min-w-fit">Usage Data:</span>
                <span>Anonymized after 2 years</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold min-w-fit">Communication Records:</span>
                <span>Retained for 3 years for support purposes</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Changes to Policy */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">Changes to This Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-600">Notification Process</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex gap-2">
                <span className="font-semibold min-w-fit">30-Day Notice:</span>
                <span>Advance notice of significant changes</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold min-w-fit">Email Notification:</span>
                <span>Direct notification to your registered email</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold min-w-fit">App Notice:</span>
                <span>In-app notification of privacy policy updates</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold min-w-fit">Continued Use:</span>
                <span>Constitutes acceptance of updated policy</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="mb-6 bg-gray-50">
          <CardHeader>
            <CardTitle className="text-2xl">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-blue-600 mb-3">Privacy Questions</h3>
              <ul className="space-y-2 text-gray-700">
                <li><span className="font-semibold">Email:</span> privacy@adaptalyfe.com</li>
                <li><span className="font-semibold">Phone:</span> 1-800-ADAPTALYFE</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-blue-600 mb-3">HIPAA Inquiries</h3>
              <ul className="space-y-2 text-gray-700">
                <li><span className="font-semibold">Privacy Officer:</span> hipaa@adaptalyfe.com</li>
                <li><span className="font-semibold">Breach Reporting:</span> security@adaptalyfe.com</li>
                <li><span className="font-semibold">Patient Rights:</span> rights@adaptalyfe.com</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-blue-600 mb-3">General Support</h3>
              <ul className="space-y-2 text-gray-700">
                <li><span className="font-semibold">App Support:</span> support@adaptalyfe.com</li>
                <li><span className="font-semibold">Technical Issues:</span> tech@adaptalyfe.com</li>
                <li><span className="font-semibold">Accessibility:</span> accessibility@adaptalyfe.com</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Special Protections */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">Special Protections for Vulnerable Users</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <h3 className="text-lg font-semibold text-blue-600">Neurodevelopmental Disabilities</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex gap-2">
                <span className="font-semibold min-w-fit">Enhanced Protections:</span>
                <span>Additional safeguards for cognitive disabilities</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold min-w-fit">Simplified Consent:</span>
                <span>Clear, understandable consent processes</span>
              </li>
              <li className="flex gap-2">
                <span className="font-semibold min-w-fit">Caregiver Oversight:</span>
                <span>Appropriate family involvement while respecting autonomy</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Last Updated Footer */}
        <Card className="bg-gray-900 text-white">
          <CardContent className="text-center py-8 space-y-2">
            <p className="font-semibold text-lg">Last Updated: July 12, 2025</p>
            <p>Version: 1.0 | Language: English (US)</p>
            <p className="text-sm text-gray-300 mt-4 max-w-2xl mx-auto">
              <em>
                This Privacy Policy is designed to be accessible and understandable. If you need this information in a different format or have questions about any section, please contact our accessibility team at accessibility@adaptalyfe.com.
              </em>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
