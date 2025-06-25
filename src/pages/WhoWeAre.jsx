import React from 'react';
import AccountLayout from '../components/AccountLayout';

function WhoWeAre() {
  return (
    <AccountLayout>
      <div className="bg-white shadow rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-8">Who We Are</h1>
        
        <div className="prose max-w-none">
          <p>
            Welcome to Atheera, your premier destination for fashion and lifestyle products. We are passionate about bringing you the latest trends and timeless classics, all while maintaining the highest standards of quality and customer service.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-4">Our Story</h2>
          
          <p>
            Founded in 2020, Atheera began with a simple mission: to make high-quality fashion accessible to everyone. What started as a small online store has grown into a beloved fashion destination, serving customers worldwide with our curated selection of clothing, accessories, and lifestyle products.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-4">Our Values</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium mb-2">Quality First</h3>
              <p>
                We believe in offering products that stand the test of time. Every item in our collection is carefully selected for its quality, durability, and style.
              </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium mb-2">Customer Satisfaction</h3>
              <p>
                Your happiness is our priority. We're committed to providing exceptional customer service and ensuring a seamless shopping experience.
              </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium mb-2">Sustainability</h3>
              <p>
                We're dedicated to reducing our environmental impact through responsible sourcing, eco-friendly packaging, and sustainable business practices.
              </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium mb-2">Innovation</h3>
              <p>
                We constantly evolve and adapt to bring you the latest trends and technologies in fashion retail.
              </p>
            </div>
          </div>
          
          <h2 className="text-xl font-semibold mt-8 mb-4">Our Team</h2>
          
          <p>
            Behind Atheera is a team of passionate individuals who work tirelessly to bring you the best shopping experience. From our fashion experts who curate our collections to our customer service representatives who ensure your satisfaction, every member of our team is dedicated to making your experience with us exceptional.
          </p>
          
          <h2 className="text-xl font-semibold mt-6 mb-4">Our Commitment</h2>
          
          <p>
            We're committed to:
          </p>
          
          <ul className="list-disc pl-5 mb-4">
            <li>Providing high-quality products at competitive prices</li>
            <li>Offering exceptional customer service</li>
            <li>Maintaining ethical business practices</li>
            <li>Supporting sustainable fashion initiatives</li>
            <li>Creating an inclusive and welcoming shopping environment</li>
          </ul>
          
          <h2 className="text-xl font-semibold mt-6 mb-4">Contact Us</h2>
          
          <p>
            We'd love to hear from you! Whether you have questions about our products, need assistance with an order, or want to share your feedback, our team is here to help.
          </p>
          
          <p>
            Email: contact@atheera.com<br />
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

export default WhoWeAre; 