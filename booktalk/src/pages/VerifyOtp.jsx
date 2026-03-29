import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { resendOtp } from '@/api/auth';
import { toast } from 'sonner';

export default function VerifyOtp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOtp } = useAuth();

  // Email passed from Register or Login page via router state
  const email = location.state?.email || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // digits only
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    // Auto-submit when all 6 digits filled
    if (newOtp.every(Boolean) && value) {
      handleSubmit(newOtp.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      const newOtp = text.split('');
      setOtp(newOtp);
      handleSubmit(text);
    }
  };

  const handleSubmit = async (code = otp.join('')) => {
    if (code.length !== 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }
    setIsLoading(true);
    try {
      await verifyOtp({ email, otp: code });
      toast.success('Email verified! Please sign in to continue 🎉');
      navigate('/login', { state: { email } });
    } catch (err) {
      // Global errorHandler handles the toast; just clear inputs and focus
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isResending) return;
    setIsResending(true);
    try {
      await resendOtp({ email });
      toast.success('A new code has been sent to your email');
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      // Global errorHandler handles the toast
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <BookOpen className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="font-heading text-3xl font-bold text-foreground">PageTalk</h1>
          </div>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✉️</span>
          </div>
          <h2 className="font-heading text-2xl font-bold mb-2">Verify your email</h2>
          <p className="text-muted-foreground text-sm mb-2">
            We sent a 6-digit code to
          </p>
          <p className="font-medium text-sm text-primary mb-8">{email || 'your email'}</p>

          {/* OTP Input */}
          <div className="flex items-center justify-center gap-3 mb-8" onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-12 h-14 text-center text-xl font-bold bg-background border-2 border-border rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                id={`otp-${i}`}
                autoFocus={i === 0}
              />
            ))}
          </div>

          {/* Submit */}
          <button
            onClick={() => handleSubmit()}
            disabled={isLoading || otp.some((d) => !d)}
            className="w-full py-2.5 px-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-4"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? 'Verifying...' : 'Verify Email'}
          </button>

          {/* Resend */}
          <button
            onClick={handleResend}
            disabled={countdown > 0 || isResending}
            className="text-sm text-muted-foreground hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 mx-auto"
          >
            {isResending
              ? <><Loader2 className="w-3 h-3 animate-spin" /> Sending...</>
              : countdown > 0
                ? `Resend in ${countdown}s`
                : <><RefreshCw className="w-3 h-3" /> Resend code</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
