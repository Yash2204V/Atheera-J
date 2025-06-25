import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import AlertMessage from './AlertMessage';

const PhoneAuth = ({ mode = 'login', adminMode = false, onVerificationSuccess, initialPhone }) => {
  const [step, setStep] = useState(initialPhone ? 2 : 1); // Start at step 2 if initialPhone is provided
  const [phoneNumber, setPhoneNumber] = useState(initialPhone || '');
  const [verificationCode, setVerificationCode] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('prefer not to say');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const { setUser } = useAuth();
  const navigate = useNavigate();

  // Formats phone number to E.164 format
  const formatPhoneNumber = (phone) => {
    // Remove any non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // If number starts with 91, remove it as we'll add it back
    if (cleaned.startsWith('91')) {
      cleaned = cleaned.substring(2);
    }
    
    // If number starts with 0, remove it
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    
    // Ensure number is 10 digits (standard Indian mobile number length)
    if (cleaned.length !== 10) {
      throw new Error('Please enter a valid 10-digit Indian mobile number');
    }
    
    // Add +91 prefix
    return `+91${cleaned}`;
  };

  // Handle phone submission
  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      // Use admin endpoint if in admin mode
      const endpoint = adminMode 
        ? `/admin/auth/phone/send-code?action=${mode}` 
        : `/user/auth/phone/send-code?action=${mode}`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phoneNumber: formattedPhone })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send verification code');
      }
      
      setPhoneNumber(formattedPhone);
      setSuccessMsg('Verification code sent! Please check your phone.');
      setTimeout(() => setSuccessMsg(''), 5000);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle code verification
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Use admin endpoint if in admin mode
      const endpoint = adminMode 
        ? `/admin/auth/phone/verify-code?action=${mode}` 
        : `/user/auth/phone/verify-code?action=${mode}`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          phoneNumber, 
          code: verificationCode 
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to verify code');
      }
      
      // If verification mode, only handle verification and return
      if (mode === 'verify') {
        if (onVerificationSuccess) {
          onVerificationSuccess(phoneNumber, verificationCode);
        }
        setLoading(false);
        return;
      }
      
      // Only handle navigation for non-verify modes
      if (mode === 'login' && data.user) {
        setUser(data.user);
        
        // Redirect to admin panel if admin user and in admin mode
        if (adminMode && data.user.role === 'admin') {
          navigate('/admin-haha');
        } else if (adminMode) {
          throw new Error('You do not have admin privileges');
        } else {
          navigate('/');
        }
      } else if (mode === 'signup') {
        setSuccessMsg('Phone number verified! Please complete your profile.');
        setTimeout(() => setSuccessMsg(''), 5000);
        setStep(3);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      if (mode !== 'verify') {
        setLoading(false);
      }
    }
  };

  // Handle signup completion
  const handleCompleteSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Use admin endpoint if in admin mode
      const endpoint = adminMode 
        ? '/admin/auth/phone/register' 
        : '/user/auth/phone/register';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          email,
          phoneNumber,
          gender
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to complete registration');
      }
      
      setUser(data.user);
      
      // Redirect to admin panel if admin user and in admin mode
      if (adminMode && data.user.role === 'admin') {
        navigate('/admin-haha');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Go back to previous step
  const handleBack = () => {
    setStep(step - 1);
    setError('');
  };

  return (
    <div className="w-full">
      {error && <AlertMessage type="error" message={error} onClose={() => setError('')} />}
      {successMsg && <AlertMessage type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}
      
      {step === 1 && !initialPhone && (
        <form onSubmit={handleSendCode} className="space-y-4">
          <div>
            <label className="text-gray-600 mb-2 block">
              Phone Number <span className="text-primary">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">+91</span>
              <input
                type="tel"
                className="block w-full border border-gray-300 pl-12 pr-4 py-3 text-gray-600 text-sm rounded focus:ring-0 focus:border-primary placeholder-gray-400"
                placeholder="9876543210"
                value={phoneNumber.replace('+91', '')}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                maxLength={10}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Enter your 10-digit Indian mobile number
            </p>
          </div>
          
          <button
            type="submit"
            className="block w-full py-2 text-center text-white bg-primary border border-primary rounded hover:bg-transparent hover:text-primary transition uppercase font-roboto font-medium"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Verification Code'}
          </button>
        </form>
      )}
      
      {step === 2 && (
        <form onSubmit={handleVerifyCode} className="space-y-4">
          <div>
            <label className="text-gray-600 mb-2 block">
              Verification Code <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              className="block w-full border border-gray-300 px-4 py-3 text-gray-600 text-sm rounded focus:ring-0 focus:border-primary placeholder-gray-400"
              placeholder="Enter 6-digit code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the verification code sent to {phoneNumber}
            </p>
          </div>
          
          <div className="flex gap-3">
            {!initialPhone && (
              <button
                type="button"
                onClick={handleBack}
                className="block w-1/3 py-2 text-center text-primary bg-white border border-primary rounded hover:bg-gray-50 transition uppercase font-roboto font-medium"
              >
                Back
              </button>
            )}
            
            <button
              type="submit"
              className={`block ${initialPhone ? 'w-full' : 'w-2/3'} py-2 text-center text-white bg-primary border border-primary rounded hover:bg-transparent hover:text-primary transition uppercase font-roboto font-medium`}
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
          </div>
        </form>
      )}
      
      {step === 3 && mode === 'signup' && (
        <form onSubmit={handleCompleteSignup} className="space-y-4">
          <div>
            <label className="text-gray-600 mb-2 block">
              Full Name <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              className="block w-full border border-gray-300 px-4 py-3 text-gray-600 text-sm rounded focus:ring-0 focus:border-primary placeholder-gray-400"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label className="text-gray-600 mb-2 block">
              Email Address <span className="text-primary">*</span>
            </label>
            <input
              type="email"
              className="block w-full border border-gray-300 px-4 py-3 text-gray-600 text-sm rounded focus:ring-0 focus:border-primary placeholder-gray-400"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div>
            <label className="text-gray-600 mb-2 block">
              Gender
            </label>
            <select
              className="block w-full border border-gray-300 px-4 py-3 text-gray-600 text-sm rounded focus:ring-0 focus:border-primary"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer not to say">Prefer not to say</option>
            </select>
          </div>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="block w-1/3 py-2 text-center text-primary bg-white border border-primary rounded hover:bg-gray-50 transition uppercase font-roboto font-medium"
            >
              Back
            </button>
            
            <button
              type="submit"
              className="block w-2/3 py-2 text-center text-white bg-primary border border-primary rounded hover:bg-transparent hover:text-primary transition uppercase font-roboto font-medium"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default PhoneAuth; 