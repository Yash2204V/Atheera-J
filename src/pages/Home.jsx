import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <>
      {/* banner */}
      <div 
        className="bg-cover bg-no-repeat bg-center py-28 md:py-40 relative" 
        style={{
          backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url('/images/landing/first.avif')"
        }}
      >
        <div className="container relative z-20">
          {/* banner content */}
          <div className="max-w-xl">
            <h1 className="text-5xl md:text-7xl text-white font-bold mb-6 leading-tight">
              Sparkle & <br className="hidden sm:block" /><span className="text-yellow-400">Shine</span>
            </h1>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed mb-8 font-light">
              Discover our exquisite collection of luxury jewellery that celebrates your unique beauty.
            </p>
            {/* banner button */}
            <div className="flex gap-4">
              <Link
                to="/products/shop?category=jewellery" 
                className="bg-white text-primary px-8 py-4 font-semibold rounded-lg uppercase hover:bg-primary hover:text-white transition duration-300 transform hover:scale-105"
              >
                Explore Collection
              </Link>
            </div>
          </div>
        </div>
      </div>
      {/* banner end */}

      {/* categories */}
      <div className="container py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Our Collections</h2>
          <div className="w-20 h-1 bg-primary mx-auto"></div>
        </div>
        <div className="grid lg:grid-cols-3 sm:grid-cols-2 gap-6">
          {/* Diamond Jewellery */}
          <div className="relative group overflow-hidden rounded-xl shadow-lg">
            <img 
              src="/images/landing/second.avif" 
              alt="Diamond Jewellery" 
              className="w-full h-[400px] object-top object-cover transform group-hover:scale-110 transition duration-500" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end">
              <div className="p-6">
                <h3 className="text-2xl font-bold text-white mb-2">Diamond Jewellery</h3>
                <Link 
                  to="/products/shop?subCategory=diamond&subSubCategory=necklace" 
                  className="inline-block bg-white/20 text-white px-4 py-2 rounded-lg backdrop-blur-sm hover:bg-white hover:text-primary transition"
                >
                  Explore Collection
                </Link>
              </div>
            </div>
          </div>
          {/* Gold Jewellery */}
          <div className="relative group overflow-hidden rounded-xl shadow-lg">
            <img 
              src="/images/landing/third.avif" 
              alt="Gold Jewellery" 
              className="w-full h-[400px] object-top object-cover transform group-hover:scale-110 transition duration-500" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end">
              <div className="p-6">
                <h3 className="text-2xl font-bold text-white mb-2">Gold Collection</h3>
                <Link 
                  to="/products/shop?subCategory=gold&subSubCategory=bracelet" 
                  className="inline-block bg-white/20 text-white px-4 py-2 rounded-lg backdrop-blur-sm hover:bg-white hover:text-primary transition"
                >
                  View Collection
                </Link>
              </div>
            </div>
          </div>
          {/* Silver Jewellery */}
          <div className="relative group overflow-hidden rounded-xl shadow-lg">
            <img 
              src="/images/landing/first.avif" 
              alt="Silver Jewellery" 
              className="w-full h-[400px] object-top object-cover transform scale-110 group-hover:scale-125 transition duration-500" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end">
              <div className="p-6">
                <h3 className="text-2xl font-bold text-white mb-2">Diamond Elegance</h3>
                <Link 
                  to="/products/shop?subCategory=diamond&subSubCategory=ring" 
                  className="inline-block bg-white/20 text-white px-4 py-2 rounded-lg backdrop-blur-sm hover:bg-white hover:text-primary transition"
                >
                  Shop Now
                </Link>
              </div>
            </div>
          </div>
          {/* Bridal Collection */}
          <div className="relative group overflow-hidden rounded-xl shadow-lg">
            <img 
              src="/images/landing/four.jpg" 
              alt="Bridal Jewellery" 
              className="w-full h-[400px] object-top object-cover transform group-hover:scale-110 transition duration-500" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end">
              <div className="p-6">
                <h3 className="text-2xl font-bold text-white mb-2">Bridal Collection</h3>
                <Link 
                  to="/products/shop?subCategory=gold&subSubCategory=necklace" 
                  className="inline-block bg-white/20 text-white px-4 py-2 rounded-lg backdrop-blur-sm hover:bg-white hover:text-primary transition"
                >
                  Discover More
                </Link>
              </div>
            </div>
          </div>
          {/* Pearl Jewellery */}
          <div className="relative group overflow-hidden rounded-xl shadow-lg">
            <img 
              src="/images/landing/five.jpg"
              alt="Pearl Jewellery" 
              className="w-full h-[400px] object-top object-cover transform group-hover:scale-110 transition duration-500" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end">
              <div className="p-6">
                <h3 className="text-2xl font-bold text-white mb-2">Pearl Jewellery</h3>
                <Link 
                  to="/products/shop" 
                  className="inline-block bg-white/20 text-white px-4 py-2 rounded-lg backdrop-blur-sm hover:bg-white hover:text-primary transition"
                >
                  Browse Collection
                </Link>
              </div>
            </div>
          </div>
          {/* Fashion Jewellery */}
          <div className="relative group overflow-hidden rounded-xl shadow-lg">
            <img 
              src="/images/landing/six.jpg" 
              alt="Fashion Jewellery" 
              className="w-full h-[400px] object-center object-cover transform group-hover:scale-110 transition duration-500" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end">
              <div className="p-6">
                <h3 className="text-2xl font-bold text-white mb-2">Fashion Jewellery</h3>
                <Link 
                  to="/products/shop?subCategory=gold&subSubCategory=earrings" 
                  className="inline-block bg-white/20 text-white px-4 py-2 rounded-lg backdrop-blur-sm hover:bg-white hover:text-primary transition"
                >
                  Explore
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* categories end */}

      {/* jewellery types */}
      <div className="container py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Jewellery Types</h2>
          <div className="w-20 h-1 bg-primary mx-auto"></div>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          {/* Necklaces */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <img src="/images/products/necklace.jpg" alt="Necklaces" className="w-full h-48 object-cover" />
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Necklaces</h3>
              <Link to="/products/shop?subCategory=gold&subSubCategory=necklace" className="text-primary font-medium hover:underline">
                Shop Now →
              </Link>
            </div>
          </div>
          {/* Earrings */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <img src="/images/landing/six.jpg" alt="Earrings" className="w-full h-48 object-cover" />
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Earrings</h3>
              <Link to="/products/shop?subCategory=gold&subSubCategory=earrings" className="text-primary font-medium hover:underline">
                Shop Now →
              </Link>
            </div>
          </div>
          {/* Rings */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <img src="/images/landing/first.avif" alt="Rings" className="w-full h-48 object-cover" />
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Rings</h3>
              <Link to="/products/shop?subCategory=diamond&subSubCategory=ring" className="text-primary font-medium hover:underline">
                Shop Now →
              </Link>
            </div>
          </div>
          {/* Bracelets */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <img src="/images/landing/third.avif" alt="Bracelets" className="w-full h-48 object-cover" />
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Bracelets</h3>
              <Link to="/products/shop?subCategory=gold&subSubCategory=bracelet" className="text-primary font-medium hover:underline">
                Shop Now →
              </Link>
            </div>
          </div>
        </div>
      </div>
      {/* jewellery types end */}

      {/* features */}
      <div className="container py-10">
        <div className="lg:w-10/12 grid md:grid-cols-3 gap-6 lg:gap-8 mx-auto">
          {/* single feature */}
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <img src="/images/icons/icon1.png" className="w-8 h-8" alt="Hallmarked Jewellery" />
              </div>
              <div>
                <h4 className="font-bold text-base text-gray-800">Hallmarked Jewellery</h4>
                <p className="text-gray-600">Authenticity Guaranteed</p>
              </div>
            </div>
          </div>
          {/* single feature */}
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <img src="/images/icons/icon2.png" className="w-8 h-8" alt="30-Day Returns" />
              </div>
              <div>
                <h4 className="font-bold text-xl text-gray-800">30-Day Returns</h4>
                <p className="text-gray-600">No Questions Asked</p>
              </div>
            </div>
          </div>
          {/* single feature */}
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <img src="/images/icons/icon3.png" className="w-8 h-8" alt="Lifetime Warranty" />
              </div>
              <div>
                <h4 className="font-bold text-xl text-gray-800">Lifetime Warranty</h4>
                <p className="text-gray-600">On Gold & Diamond</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* features end */}
    </>
  );
}

export default Home;