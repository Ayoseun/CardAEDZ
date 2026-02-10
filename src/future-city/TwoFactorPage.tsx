import { useState, useRef, useEffect } from 'react';

export default function TwoFactorPage({ onVerify }:any) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
        //@ts-ignore
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index:any, value:any) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
        //@ts-ignore
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index:any, e:any) => {
    // Handle backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
        //@ts-ignore
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e:any) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    const newCode = pastedData.split('').filter((char:any) => /^\d$/.test(char));
    
    if (newCode.length === 6) {
      setCode(newCode);
      //@ts-ignore
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e:any) => {
    e.preventDefault();
    const fullCode = code.join('');
    
    if (fullCode.length !== 6) return;
    
    setIsLoading(true);
    await onVerify(fullCode);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-neon-purple/20 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-neon-blue/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      
      <div className="glass-card p-8 md:p-12 max-w-md w-full relative z-10 animate-float">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-neon-blue to-neon-purple rounded-2xl flex items-center justify-center mx-auto mb-4 animate-glow">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="font-display text-3xl font-bold mb-2">
            Two-Factor Authentication
          </h1>
          <p className="text-white/60">
            Enter the 6-digit code from your authenticator app
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex justify-center gap-3" onPaste={handlePaste}>
            {code.map((digit, index) => (
              <input
                key={index}
                //@ts-ignore
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-2xl font-bold bg-white/5 border-2 border-white/10 rounded-xl text-white focus:outline-none focus:border-neon-blue transition-all duration-300"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={isLoading || code.join('').length !== 6}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Verifying...
              </div>
            ) : (
              'Verify Code'
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-white/60 text-sm mb-3">
            Didn't receive a code?
          </p>
          <button className="text-neon-blue hover:text-neon-purple transition-colors font-semibold text-sm">
            Resend Code
          </button>
        </div>
      </div>
    </div>
  );
}