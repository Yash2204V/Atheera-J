import React from 'react';
import AccountLayout from '../components/AccountLayout';

function CustomerCare() {
  return (
    <AccountLayout>
      <div className="bg-white shadow rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-8">Customer Care</h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-medium mb-3">Contact Information</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <i className="fas fa-envelope text-primary"></i>
                <span>support@atheera.com</span>
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-phone text-primary"></i>
                <span>+1 234 567 8900</span>
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-map-marker-alt text-primary"></i>
                <span>123 Fashion Street, Design District</span>
              </li>
            </ul>
            
            <h3 className="font-medium mt-6 mb-3">Business Hours</h3>
            <p className="text-gray-600">
              Monday - Friday: 9:00 AM - 6:00 PM<br />
              Saturday: 10:00 AM - 4:00 PM<br />
              Sunday: Closed
            </p>
          </div>
          
          <div>
            <h3 className="font-medium mb-3">Send us a Message</h3>
            <form className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Your Name
                </label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border rounded-lg focus:ring-primary focus:border-primary"
                  placeholder="John Doe"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Email Address
                </label>
                <input 
                  type="email" 
                  className="w-full px-4 py-2 border rounded-lg focus:ring-primary focus:border-primary"
                  placeholder="john@example.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Message
                </label>
                <textarea 
                  className="w-full px-4 py-2 border rounded-lg focus:ring-primary focus:border-primary"
                  rows="4"
                  placeholder="How can we help you?"
                  required
                ></textarea>
              </div>
              
              <button 
                type="submit"
                className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary-dark transition"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
        
        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-6">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">What are your shipping options?</h3>
              <p className="text-gray-600">
                We offer standard shipping (5-7 business days) and express shipping (2-3 business days) options. Free shipping is available on orders over ₹999.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">How can I track my order?</h3>
              <p className="text-gray-600">
                Once your order is shipped, you will receive an email with tracking information. You can also track your order in your account dashboard.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">What is your return policy?</h3>
              <p className="text-gray-600">
                We accept returns within 30 days of purchase. Items must be unworn, unwashed, and with original tags attached. Please visit our Returns & Refunds page for more information.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">How do I care for my garments?</h3>
              <p className="text-gray-600">
                Care instructions vary by product. Please refer to the care label on each garment for specific instructions. Generally, we recommend gentle washing and air drying for most items.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AccountLayout>
  );
}

export default CustomerCare; 