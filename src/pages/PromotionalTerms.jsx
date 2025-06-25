import React from 'react';
import AccountLayout from '../components/AccountLayout';

function PromotionalTerms() {
  return (
    <AccountLayout>
      <div className="bg-white shadow rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="prose max-w-none">
          <p>
            This Privacy Policy describes how your personal information is collected, used, and shared when you visit or make a purchase from Atheera.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-4">Information We Collect</h2>
          
          <p>
            When you visit the Site, we automatically collect certain information about your device, including information about your web browser, IP address, time zone, and some of the cookies that are installed on your device.
          </p>
          
          <p>
            Additionally, as you browse the Site, we collect information about the individual web pages or products that you view, what websites or search terms referred you to the Site, and information about how you interact with the Site. We refer to this automatically-collected information as "Device Information."
          </p>
          
          <p>
            When you make a purchase or attempt to make a purchase through the Site, we collect certain information from you, including your name, billing address, shipping address, payment information, email address, and phone number. We refer to this information as "Order Information."
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-4">How We Use Your Information</h2>
          
          <p>
            We use the Order Information that we collect generally to fulfill any orders placed through the Site (including processing your payment information, arranging for shipping, and providing you with invoices and/or order confirmations).
          </p>
          
          <p>
            Additionally, we use this Order Information to:
          </p>
          
          <ul className="list-disc pl-5 mb-4">
            <li>Communicate with you;</li>
            <li>Screen our orders for potential risk or fraud;</li>
            <li>When in line with the preferences you have shared with us, provide you with information or advertising relating to our products or services;</li>
            <li>Improve and optimize our Site (for example, by generating analytics about how our customers browse and interact with the Site);</li>
            <li>Assess the success of our marketing and advertising campaigns.</li>
          </ul>
          
          <h2 className="text-xl font-semibold mt-6 mb-4">Sharing Your Information</h2>
          
          <p>
            We share your Personal Information with third parties to help us use your Personal Information, as described above. For example, we use Shopify to power our online store. We also use Google Analytics to help us understand how our customers use the Site.
          </p>
          
          <p>
            Finally, we may also share your Personal Information to comply with applicable laws and regulations, to respond to a subpoena, search warrant or other lawful request for information we receive, or to otherwise protect our rights.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-4">Your Rights</h2>
          
          <p>
            If you are a European resident, you have the right to access personal information we hold about you and to ask that your personal information be corrected, updated, or deleted. If you would like to exercise this right, please contact us.
          </p>
          
          <p>
            Additionally, if you are a European resident, we note that we are processing your information in order to fulfill contracts we might have with you, or otherwise to pursue our legitimate business interests listed above.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-4">Data Retention</h2>
          
          <p>
            When you place an order through the Site, we will maintain your Order Information for our records unless and until you ask us to delete this information.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-4">Changes</h2>
          
          <p>
            We may update this privacy policy from time to time in order to reflect, for example, changes to our practices or for other operational, legal or regulatory reasons.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-4">Contact Us</h2>
          
          <p>
            For more information about our privacy practices, if you have questions, or if you would like to make a complaint, please contact us by e-mail at privacy@atheera.com or by mail using the details provided below:
          </p>
          
          <p>
            123 Fashion Street, Design District
          </p>
          
          <p className="mt-8 text-sm text-gray-500">
            Last updated: March 1, 2023
          </p>
        </div>
      </div>
    </AccountLayout>
  );
}

export default PromotionalTerms; 