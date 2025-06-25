import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AlertMessage from '../components/AlertMessage';
import PhoneAuth from '../components/PhoneAuth';
import EmailAuth from '../components/EmailAuth';

function Signup() {
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('email'); // 'email' or 'phone'
  const { setUser } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="container py-16">
      <div className="max-w-lg mx-auto shadow px-6 py-7 rounded overflow-hidden">
        <h2 className="text-2xl uppercase font-medium mb-1">
          SIGN UP
        </h2>
        <p className="text-gray-600 mb-6 text-sm">
          Register for a new account
        </p>

        {error && <AlertMessage type="error" message={error} onClose={() => setError('')} />}

        {/* Signup method tabs */}
        <div className="border-b border-gray-200 mb-5">
          <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
            <li className="mr-2">
              <button 
                className={`inline-block p-4 border-b-2 rounded-t-lg ${
                  activeTab === 'email' 
                    ? 'text-primary border-primary' 
                    : 'border-transparent hover:text-gray-600 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('email')}
              >
                Email Signup
              </button>
            </li>
            <li className="mr-2">
              <button 
                className={`inline-block p-4 border-b-2 rounded-t-lg ${
                  activeTab === 'phone' 
                    ? 'text-primary border-primary' 
                    : 'border-transparent hover:text-gray-600 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('phone')}
              >
                Phone Signup
              </button>
            </li>
          </ul>
        </div>

        {activeTab === 'email' ? (
          <EmailAuth mode="signup" />
        ) : (
          <div className="mb-4">
            <PhoneAuth mode="signup" />
          </div>
        )}

        <div className="mt-6 flex justify-center relative">
          <div className="text-gray-600 uppercase px-3 bg-white z-10 relative">Or sign up with</div>
          <div className="absolute left-0 top-3 w-full border-b-2 border-gray-200"></div>
        </div>

        <div className="mt-4 flex gap-4 justify-center">
          <a 
            href="/user/auth/google"
            className="block w-3/4 sm:w-1/2 py-3 text-center text-black rounded-lg uppercase font-roboto font-medium text-sm transition duration-300 ease-in-out transform hover:bg-zinc-100 hover:scale-105"
          >
            <div className="flex items-center justify-center gap-2">
              <img src="https://img.icons8.com/?size=25&id=17949&format=png&color=000000" alt="Google" className="w-5 h-5" />
              <span>Sign up with Google</span>
            </div>
          </a>
        </div>

        <p className="mt-4 text-gray-600 text-center">
          Already have an account? <Link to="/user/login" className="text-primary">Login Now</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup; 