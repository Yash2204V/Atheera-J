import React from 'react';
import AccountLayout from '../components/AccountLayout';

function ReturnsRefund() {
  return (
    <AccountLayout>
      <div className="bg-white shadow rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-8">Returns & Refund Policy</h1>
        
        <div className="prose max-w-none">
          <p>
            We want you to be completely satisfied with your purchase. If you're not entirely happy with your order, we're here to help.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-4">Return Policy</h2>
          
          <p>
            You may return most new, unopened items within 30 days of delivery for a full refund. We'll also pay the return shipping costs if the return is a result of our error (you received an incorrect or defective item, etc.).
          </p>
          
          <p>
            You should expect to receive your refund within four weeks of giving your package to the return shipper; however, in many cases you will receive a refund more quickly. This time period includes the transit time for us to receive your return from the shipper (5 to 10 business days), the time it takes us to process your return once we receive it (3 to 5 business days), and the time it takes your bank to process our refund request (5 to 10 business days).
          </p>
          
          <p>
            If you need to return an item, please Contact Us with your order number and details about the product you would like to return. We will respond quickly with instructions for how to return items from your order.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-4">Conditions for Returns</h2>
          
          <p>
            In order to be eligible for a return, your item must be unused and in the same condition that you received it. It must also be in the original packaging.
          </p>
          
          <p>
            Several types of goods are exempt from being returned. Perishable goods such as food, flowers, newspapers or magazines cannot be returned. We also do not accept products that are intimate or sanitary goods, hazardous materials, or flammable liquids or gases.
          </p>
          
          <p>
            Additional non-returnable items:
          </p>
          
          <ul className="list-disc pl-5 mb-4">
            <li>Gift cards</li>
            <li>Downloadable software products</li>
            <li>Some health and personal care items</li>
          </ul>
          
          <p>
            To complete your return, we require a receipt or proof of purchase.
          </p>
          
          <p>
            Please do not send your purchase back to the manufacturer.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-4">Refunds</h2>
          
          <p>
            Once your return is received and inspected, we will send you an email to notify you that we have received your returned item. We will also notify you of the approval or rejection of your refund.
          </p>
          
          <p>
            If you are approved, then your refund will be processed, and a credit will automatically be applied to your credit card or original method of payment, within a certain amount of days.
          </p>
          
          <h3 className="text-lg font-medium mt-4 mb-2">Late or Missing Refunds</h3>
          
          <p>
            If you haven't received a refund yet, first check your bank account again. Then contact your credit card company, it may take some time before your refund is officially posted. Next contact your bank. There is often some processing time before a refund is posted. If you've done all of this and you still have not received your refund yet, please contact us at returns@atheera.com.
          </p>
          
          <h3 className="text-lg font-medium mt-4 mb-2">Sale Items</h3>
          
          <p>
            Only regular priced items may be refunded, unfortunately sale items cannot be refunded.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-4">Exchanges</h2>
          
          <p>
            We only replace items if they are defective or damaged. If you need to exchange it for the same item, send us an email at returns@atheera.com and we will guide you through the process.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-4">Shipping</h2>
          
          <p>
            To return your product, you should mail your product to: 123 Fashion Street, Design District.
          </p>
          
          <p>
            You will be responsible for paying for your own shipping costs for returning your item. Shipping costs are non-refundable. If you receive a refund, the cost of return shipping will be deducted from your refund.
          </p>
          
          <p>
            Depending on where you live, the time it may take for your exchanged product to reach you, may vary.
          </p>
          
          <p className="mt-8 text-sm text-gray-500">
            Last updated: March 1, 2023
          </p>
        </div>
      </div>
    </AccountLayout>
  );
}

export default ReturnsRefund; 