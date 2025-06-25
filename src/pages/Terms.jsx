import React from 'react';
import AccountLayout from '../components/AccountLayout';

function Terms() {
  return (
    <AccountLayout>
      <div className="bg-white shadow rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-8">Terms & Conditions</h1>
        
        <div className="prose max-w-none">
          <p>
            Welcome to Atheera. By accessing our website and using our services, you agree to be bound by these Terms and Conditions. Please read them carefully before proceeding.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-4">1. Acceptance of Terms</h2>
          
          <p>
            By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this website.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-4">2. Use License</h2>
          
          <p>
            Permission is granted to temporarily download one copy of the materials (information or software) on Atheera's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
          </p>
          
          <ul className="list-disc pl-5 mb-4">
            <li>Modify or copy the materials</li>
            <li>Use the materials for any commercial purpose</li>
            <li>Attempt to decompile or reverse engineer any software contained on Atheera's website</li>
            <li>Remove any copyright or other proprietary notations from the materials</li>
            <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
          </ul>
          
          <h2 className="text-xl font-semibold mt-6 mb-4">3. User Account</h2>
          
          <p>
            To access certain features of the website, you may be required to create an account. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-4">4. Product Information</h2>
          
          <p>
            We strive to display as accurately as possible the colors and images of our products. However, we cannot guarantee that your computer monitor's display of any color will be accurate.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-4">5. Pricing and Payment</h2>
          
          <p>
            All prices are subject to change without notice. We reserve the right to modify or discontinue any product without notice at any time. We shall not be liable to you or any third party for any modification, price change, suspension, or discontinuance of the product.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-4">6. Shipping and Delivery</h2>
          
          <p>
            We aim to process and ship orders as quickly as possible. However, we cannot guarantee delivery times as they may be affected by factors beyond our control.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-4">7. Returns and Refunds</h2>
          
          <p>
            Please refer to our Returns & Refund Policy for detailed information about our return process and refund policy.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-4">8. Intellectual Property</h2>
          
          <p>
            The content on this website, including but not limited to text, graphics, logos, images, and software, is the property of Atheera and is protected by copyright laws.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-4">9. Limitation of Liability</h2>
          
          <p>
            In no event shall Atheera or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Atheera's website.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-4">10. Governing Law</h2>
          
          <p>
            These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction in which Atheera operates, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-4">11. Changes to Terms</h2>
          
          <p>
            We reserve the right to update or change these terms and conditions at any time. Your continued use of the website following the posting of any changes constitutes acceptance of those changes.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-4">12. Contact Information</h2>
          
          <p>
            If you have any questions about these Terms and Conditions, please contact us at:
          </p>
          
          <p>
            Email: legal@atheera.com<br />
            Phone: +1 (555) 123-4567<br />
            Address: 123 Fashion Street, Design District
          </p>
          
          <p className="mt-8 text-sm text-gray-500">
            Last updated: March 1, 2023
          </p>
        </div>
      </div>
    </AccountLayout>
  );
}

export default Terms; 