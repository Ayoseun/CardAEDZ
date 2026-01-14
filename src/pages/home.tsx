import  { useState, type ComponentType, type ReactNode } from 'react';
import { Wallet, CreditCard, ArrowRightLeft, Globe, Download, Shield, Lock, CheckCircle, ChevronRight, Play, ArrowDown, DollarSign, Zap, WalletCards, LucideWallet, LucideWallet2, LogIn } from 'lucide-react';
import {  useNavigate } from 'react-router-dom';

type FeatureColor = 'indigo' | 'purple' | 'pink';

export default function LandingPage() {

  const navigate = useNavigate(); // For navigating back or to explore
  const [activeSection, setActiveSection] = useState('overview');
  //@ts-ignore
  const [animating, setAnimating] = useState(false);

  const sections = [
    { id: 'overview', label: 'Overview', icon: Shield },
    { id: 'how-it-works', label: 'How It Works', icon: Wallet },
    { id: 'escrow', label: 'Escrow Model', icon: Lock },
    { id: 'providers', label: 'Services', icon: CreditCard }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

          {/* Left side */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              AEDZ Pay
            </h1>
            <p className="text-gray-600 mt-1">
              Self-custodial crypto spending made simple
            </p>
          </div>

          {/* Right side */}
          <button
            onClick={() => {
              setAnimating(true);
              setTimeout(() => setAnimating(false), 1000);
                navigate('/dashboard');
            }}
            className="bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
          >
            <LogIn className="w-5 h-5" />
          </button>

        </div>
      </header>



      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-8 overflow-x-auto">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center space-x-2 py-4 border-b-2 transition-colors whitespace-nowrap ${activeSection === section.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
              >
                <section.icon className="w-4 h-4" />
                <span className="font-medium">{section.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {activeSection === 'overview' && <OverviewSection />}
        {activeSection === 'how-it-works' && <HowItWorksSection />}
        {activeSection === 'escrow' && <EscrowSection />}
        {activeSection === 'providers' && <ProvidersSection />}
      </main>

      {/* Add custom CSS for animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}

function OverviewSection() {
  const [hoveredFeature, setHoveredFeature]: any = useState(null);

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-white opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '30px 30px'
          }}></div>
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-4">Use Your Crypto Like Cash</h2>
          <p className="text-lg text-indigo-100">
            Our platform allows anyone to use their crypto in the real world just like money in a normal card.
            Users keep full control of their funds (self-custody), but can still spend globally using Visa/Mastercard.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <FeatureCard
          icon={Shield}
          title="Self-Custodial"
          description="You own and control your funds at all times. No third-party custody."
          color="indigo"
          isHovered={hoveredFeature === 0}
          onHover={() => setHoveredFeature(0)}
          onLeave={() => setHoveredFeature(null)}
        />
        <FeatureCard
          icon={Globe}
          title="Global Spending"
          description="Spend anywhere Visa/Mastercard is accepted worldwide."
          color="purple"
          isHovered={hoveredFeature === 1}
          onHover={() => setHoveredFeature(1)}
          onLeave={() => setHoveredFeature(null)}
        />
        <FeatureCard
          icon={Lock}
          title="Secure & Simple"
          description="No seed phrases or complex keys. Use FaceID and passkeys."
          color="pink"
          isHovered={hoveredFeature === 2}
          onHover={() => setHoveredFeature(2)}
          onLeave={() => setHoveredFeature(null)}
        />
      </div>

      {/* Supported Networks Animation */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Supported Networks</h3>
        <div className="flex flex-wrap justify-center gap-4">
          {['Solana', 'Base', 'Polygon', 'Arbitrum', 'Optimism', 'Ethereum'].map((network, idx) => (
            <div
              key={network}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-full font-semibold transform hover:scale-110 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              {network}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HowItWorksSection() {
  const [expandedStep, setExpandedStep]: any = useState(null);
  const [flowProgress, setFlowProgress]: any = useState(0);

  const steps = [
    {
      number: 1,
      title: 'Create Account',
      icon: Wallet,
      details: [
        'Sign up using SSO (Gmail) or Email with FaceID/Passkey',
        'Web3auth is used for sign-in (Zerodev creates smart contract wallet)',
        'We automatically create keyless wallets: Smart wallet on EVM and wallet on Solana',
        'No seed phrases, passwords, or private keys needed',
        'Wallet is self-custodial — user owns it',
        'Social login and passkeys for signing wallets with enhanced security'
      ]
    },
    {
      number: 2,
      title: 'Add Crypto',
      icon: Download,
      details: [
        'Deposit crypto from multiple blockchains',
        'Supported: Solana / Base / Polygon / Arbitrum / Optimism / Ethereum',
        'Supported tokens: USDC / USDT / ETH / SOL etc based on network',
        'Balance shows in app as soon as you deposit'
      ]
    },
    {
      number: 3,
      title: 'Convert & Bridge',
      icon: ArrowRightLeft,
      details: [
        'Click "Top-Up Card" to prepare funds',
        'System automatically converts any deposited token into USDC',
        'If crypto is on another chain, it automatically bridges to Base or Other L2',
        'All happens in background, user confirms with FaceID',
        'End result: all funds become USDC on Base, ready for card use',
        'We pay gas fees (except ETH mainnet)'
      ]
    },
    {
      number: 4,
      title: 'Spend Anywhere',
      icon: CreditCard,
      details: [
        'Card works globally',
        'Online, POS, Apple Pay / Tap to Pay (depending on issuer support)',
        'Balance reduces instantly when you spend',
        'Transactions update UI via webhook'
      ]
    },
    {
      number: 5,
      title: 'Withdraw',
      icon: Download,
      details: [
        'Withdraw from card balance → user wallet (USDC)',
        'Instant withdrawal without paying gas',
        'Can also withdraw from wallet to external account'
      ]
    }
  ];

  const startFlowAnimation = () => {
    setFlowProgress(0);
    const interval = setInterval(() => {
      setFlowProgress((prev: any) => {
        if (prev >= 5) {
          clearInterval(interval);
          return 5;
        }
        return prev + 1;
      });
    }, 800);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">How the System Works</h2>
        <button
          onClick={startFlowAnimation}
          className="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Play className="w-4 h-4" />
          <span>Animate Flow</span>
        </button>
      </div>

      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

        <div className="space-y-6">
          {steps.map((step, idx) => (
            <div
              key={step.number}
              className={`relative transition-all duration-500 ${flowProgress >= step.number ? 'opacity-100 scale-100' : 'opacity-50 scale-95'
                }`}
            >
              <div
                onClick={() => setExpandedStep(expandedStep === step.number ? null : step.number)}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer ml-12"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 -ml-24 relative z-10">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${flowProgress >= step.number
                        ? 'bg-indigo-600 scale-110'
                        : 'bg-indigo-100'
                      }`}>
                      <step.icon className={`w-6 h-6 ${flowProgress >= step.number ? 'text-white' : 'text-indigo-600'
                        }`} />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-semibold text-indigo-600">STEP {step.number}</span>
                        <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
                      </div>
                      <ChevronRight
                        className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${expandedStep === step.number ? 'rotate-90' : ''
                          }`}
                      />
                    </div>

                    <div className={`overflow-hidden transition-all duration-300 ${expandedStep === step.number ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                      }`}>
                      <ul className="space-y-2 mt-4">
                        {step.details.map((detail, idx) => (
                          <li
                            key={idx}
                            className="flex items-start space-x-2 animate-fadeIn"
                            style={{ animationDelay: `${idx * 50}ms` }}
                          >
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EscrowSection() {
  const [showExample, setShowExample] = useState(false);
  const [simulationStep, setSimulationStep] = useState(0);
  const [escrowBalance, setEscrowBalance] = useState(100);
  const [cardBalance, setCardBalance] = useState(100);
  const [lockedAmount, setLockedAmount] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);

  const runSimulation = () => {
    setIsSimulating(true);
    setSimulationStep(0);
    setEscrowBalance(100);
    setCardBalance(100);
    setLockedAmount(0);

    const steps = [
      () => { setSimulationStep(1); }, // Deposit
      () => {
        setSimulationStep(2);
        setCardBalance(80);
        setLockedAmount(20);
      }, // Spend
      () => {
        setSimulationStep(3);
        setEscrowBalance(80);
        setLockedAmount(0);
      }, // Settlement
      () => {
        setSimulationStep(4);
        setEscrowBalance(0);
        setCardBalance(0);
      } // Withdraw
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        steps[currentStep]();
        currentStep++;
      } else {
        clearInterval(interval);
        setIsSimulating(false);
      }
    }, 1500);
  };

  const resetSimulation = () => {
    setSimulationStep(0);
    setEscrowBalance(100);
    setCardBalance(100);
    setLockedAmount(0);
    setIsSimulating(false);
  };

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white">
        <h2 className="text-3xl font-bold mb-4">🟩 Secured Credit Escrow Model (Phase 2)</h2>
        <p className="text-lg text-purple-100">
          This model gives users a credit-like experience, but still keeps funds under self-custody.
        </p>
      </div>

      {/* Interactive Simulation */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 border-2 border-indigo-200">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Interactive Escrow Simulation</h3>
          <div className="flex space-x-3">
            <button
              onClick={runSimulation}
              disabled={isSimulating}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-colors ${isSimulating
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
            >
              <Play className="w-4 h-4" />
              <span>Run Simulation</span>
            </button>
            <button
              onClick={resetSimulation}
              className="px-6 py-3 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <Lock className="w-6 h-6 text-purple-600" />
              <h4 className="font-bold text-gray-900">Escrow Balance</h4>
            </div>
            <div className={`text-4xl font-bold transition-all duration-500 ${escrowBalance !== 100 ? 'text-purple-600 scale-110' : 'text-gray-900'
              }`}>
              ${escrowBalance}
            </div>
            {lockedAmount > 0 && (
              <div className="mt-2 text-sm text-red-600">
                ${lockedAmount} locked
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <CreditCard className="w-6 h-6 text-indigo-600" />
              <h4 className="font-bold text-gray-900">Card Balance</h4>
            </div>
            <div className={`text-4xl font-bold transition-all duration-500 ${cardBalance !== 100 ? 'text-indigo-600 scale-110' : 'text-gray-900'
              }`}>
              ${cardBalance}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <Zap className="w-6 h-6 text-green-600" />
              <h4 className="font-bold text-gray-900">Current Step</h4>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {simulationStep === 0 && 'Ready'}
              {simulationStep === 1 && 'Deposited'}
              {simulationStep === 2 && 'Spending'}
              {simulationStep === 3 && 'Settled'}
              {simulationStep === 4 && 'Withdrawn'}
            </div>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-between mb-8">
          {['Deposit', 'Spend $20', 'Settlement', 'Withdraw'].map((label, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-500 ${simulationStep > idx
                  ? 'bg-green-500 text-white scale-110'
                  : simulationStep === idx + 1
                    ? 'bg-indigo-600 text-white animate-pulse'
                    : 'bg-gray-200 text-gray-400'
                }`}>
                {simulationStep > idx ? '✓' : idx + 1}
              </div>
              <span className={`mt-2 text-sm font-medium ${simulationStep >= idx + 1 ? 'text-gray-900' : 'text-gray-400'
                }`}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Visual Flow */}
        <div className="relative bg-white rounded-xl p-8 shadow-sm">
          <div className="flex items-center justify-around">
            <div className="text-center">
              <Wallet className="w-16 h-16 text-indigo-600 mx-auto mb-2" />
              <p className="font-semibold">User Wallet</p>
            </div>

            <ArrowRightLeft className={`w-8 h-8 text-gray-400 transition-all duration-500 ${simulationStep >= 1 ? 'text-indigo-600 scale-125' : ''
              }`} />

            <div className="text-center">
              <Lock className="w-16 h-16 text-purple-600 mx-auto mb-2" />
              <p className="font-semibold">Escrow Contract</p>
            </div>

            <ArrowRightLeft className={`w-8 h-8 text-gray-400 transition-all duration-500 ${simulationStep >= 2 ? 'text-purple-600 scale-125' : ''
              }`} />

            <div className="text-center">
              <CreditCard className="w-16 h-16 text-green-600 mx-auto mb-2" />
              <p className="font-semibold">Card Issuer</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h3>

        <div className="space-y-4">
          <FlowStep>
            <code className="text-green-600">User deposits USDC into Escrow Smart Contract (owned by user)</code>
          </FlowStep>
          <FlowStep>
            <code className="text-green-600">Card Credit = Deposit Amount</code>
          </FlowStep>
          <FlowStep>
            <code className="text-green-600">User spends normally with card</code>
          </FlowStep>
          <FlowStep>
            <code className="text-green-600">Spend reduces credit balance</code>
          </FlowStep>
          <FlowStep>
            <code className="text-green-600">Every few days we liquidate spent USDC</code>
          </FlowStep>
          <FlowStep>
            <code className="text-green-600">Remaining escrow can be withdrawn anytime by user</code>
          </FlowStep>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">The Explanation</h3>

        <div className="space-y-4 text-gray-700">
          <p>
            The user deposits money into a smart contract escrow that they control. That deposit becomes
            their spending limit on the card.
          </p>

          <p>
            When they spend with the card, the card balance goes down immediately, but real crypto
            doesn't move until later in settlement.
          </p>

          <div className="bg-gray-50 rounded-lg p-6 my-6">
            <h4 className="font-bold text-gray-900 mb-3">Example Flow:</h4>
            <p className="mb-4">User deposits 100 USDC to the escrow smart contract.</p>

            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                <span>User Wallet → Escrow Smart Contract (owned by user)</span>
              </div>
              <div className="ml-5 text-gray-600">
                <p>• No money sent to card issuer yet</p>
                <p>• Waiting to see how much user actually spends before releasing funds</p>
              </div>
            </div>

            <div className="my-4 border-t border-gray-200 pt-4">
              <p className="font-semibold mb-2">User spends using card</p>
              <p className="text-sm text-gray-600">User buys something for $20 in a shop using the card.</p>
            </div>

            <div className="bg-white rounded p-4 my-4">
              <p className="font-semibold mb-2">What updates instantly:</p>
              <ul className="space-y-1 text-sm">
                <li>• Card balance = $80 (ledger updates off-chain through Rain API)</li>
                <li>• Escrow is still holding 100 USDC, but $20 is now reserved</li>
              </ul>
            </div>

            <div className="bg-indigo-50 rounded p-4 my-4 border-l-4 border-indigo-600">
              <p className="font-mono text-sm">Escrow</p>
              <p className="font-mono text-sm">├─ $80 free</p>
              <p className="font-mono text-sm">└─ $20 locked (pending settlement)</p>
            </div>

            <p className="text-sm text-red-600 font-semibold">No crypto is moved yet!</p>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <h4 className="font-bold text-gray-900 mb-2">Spend Attestation</h4>
            <ul className="space-y-1 text-sm">
              <li>• We record an attestation (receipt/proof of spend)</li>
              <li>• This attestation is stored in a backend ledger and may also be posted on-chain</li>
            </ul>
          </div>

          <div className="bg-green-50 border-l-4 border-green-400 p-4">
            <p className="text-sm">
              <span className="font-semibold">The attestation tells smart contract:</span><br />
              User spent $20 legitimately — release $20 later.
            </p>
          </div>

          <p className="text-sm text-gray-600">
            Settlement Time: Visa/Mastercard transactions settle in batch, typically daily or every few days.
          </p>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="font-bold mb-2">Escrow:</p>
            <p className="text-sm">It is non-custodial:</p>
            <ul className="space-y-1 text-sm ml-4 mt-2">
              <li>• No party can freely take funds and Only rules allow release of spent amount</li>
            </ul>
            <p className="text-sm mt-3">
              No, the user does not need to manually sign each settlement.
            </p>
            <p className="text-sm mt-2">
              Because when the user first deposits funds into the escrow, they are also authorizing specific
              rules inside the smart contract that allow:
            </p>
            <p className="text-sm mt-2">
              For eg; ONLY the spent amount (based on attestation) to be released automatically to the issuer
              settlement address without requiring a new signature each time.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">High Level Summary</h3>
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <p className="text-gray-700">The user signs only once during deposit to give permission to operate under these rules</p>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <p className="text-gray-700">The smart contract controls the funds afterwards, not the platform</p>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <p className="text-gray-700">The platform cannot take any more funds than the spend attestation amount</p>
          </div>
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <p className="text-gray-700">The user still owns the contract and can withdraw the remaining funds anytime</p>
          </div>
        </div>
      </div>

      <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Escrow smart contract can be non-custodial even if it is owned by the user
        </h3>
        <div className="space-y-3 text-gray-700">
          <p className="font-semibold">Because:</p>
          <ul className="space-y-2 ml-4">
            <li>• Ownership does NOT equal direct control of funds</li>
            <li>• The smart contract logic itself controls what actions are allowed</li>
            <li>• User ownership only means: they can withdraw remaining funds, but cannot break contract rules</li>
          </ul>
          <p className="mt-4">The contract holds funds & enforces rules</p>
          <p className="text-sm text-gray-600">Not our platform, Not card issue, Not the user</p>
        </div>
      </div>

      <button
        onClick={() => setShowExample(!showExample)}
        className="w-full bg-indigo-600 text-white rounded-lg py-3 font-semibold hover:bg-indigo-700 transition-colors"
      >
        {showExample ? 'Hide' : 'Show'} Example Transaction Flow
      </button>

      {showExample && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900">Deposit 100 USDC</td>
                <td className="px-6 py-4 text-sm text-gray-700">Card shows $100 credit</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900">Spend $20</td>
                <td className="px-6 py-4 text-sm text-gray-700">Card shows $80 credit</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900">Liquidation cycle</td>
                <td className="px-6 py-4 text-sm text-gray-700">20 USDC used to settle Visa</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-gray-900">Withdraw remainder</td>
                <td className="px-6 py-4 text-sm text-gray-700">80 USDC returned to wallet</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
        <h4 className="text-lg font-bold text-gray-900 mb-3">Key Points</h4>
        <ul className="space-y-2">
          <li className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">Funds stay in self-custody escrow contract</span>
          </li>
          <li className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">Neither platform nor Rain can take the money</span>
          </li>
          <li className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">Only the user can withdraw leftover funds</span>
          </li>
          <li className="flex items-start space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">This is how a secured credit card works</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function ProvidersSection() {
  const [activeProvider, setActiveProvider] = useState('card');

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-900">Service Providers</h2>

      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveProvider('card')}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all ${activeProvider === 'card'
              ? 'bg-indigo-600 text-white shadow-lg scale-105'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          <CreditCard className="w-5 h-5" />
          <span>Card Provider</span>
        </button>
        <button
          onClick={() => setActiveProvider('bank')}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all ${activeProvider === 'bank'
              ? 'bg-purple-600 text-white shadow-lg scale-105'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          <Globe className="w-5 h-5" />
          <span>Virtual Bank</span>
        </button>
      </div>

      <div className="transition-all duration-500">
        {activeProvider === 'card' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 animate-fadeIn">
            <div className="flex items-center space-x-3 mb-6">
              <CreditCard className="w-8 h-8 text-indigo-600" />
              <h3 className="text-2xl font-bold text-gray-900">Card Provider</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
                <CheckCircle className="w-5 h-5 text-indigo-600 mt-0.5" />
                <p className="text-gray-700">We integrate with **** (issuer)</p>
              </div>
              <div className="flex items-start space-x-3 p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
                <CheckCircle className="w-5 h-5 text-indigo-600 mt-0.5" />
                <p className="text-gray-700">Rain manages Visa/Mastercard rails and merchant payments</p>
              </div>
              <div className="flex items-start space-x-3 p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
                <CheckCircle className="w-5 h-5 text-indigo-600 mt-0.5" />
                <p className="text-gray-700">We never touch fiat directly</p>
              </div>
            </div>
          </div>
        )}

        {activeProvider === 'bank' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 animate-fadeIn">
            <div className="flex items-center space-x-3 mb-6">
              <Globe className="w-8 h-8 text-purple-600" />
              <h3 className="text-2xl font-bold text-gray-900">Virtual Bank Accounts</h3>
            </div>
            <p className="text-gray-700 mb-4">Using provider we offer:</p>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5" />
                <p className="text-gray-700">ACH, SWIFT, SEPA bank accounts</p>
              </div>
              <div className="flex items-start space-x-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5" />
                <p className="text-gray-700">Users can receive salary or business payments</p>
              </div>
              <div className="flex items-start space-x-3 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5" />
                <p className="text-gray-700">They can send funds to card or convert into crypto</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

type FeatureCardProps = {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: FeatureColor;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
};
function FeatureCard({ icon: Icon, title, description, color, isHovered, onHover, onLeave }: FeatureCardProps) {
  const colorClasses = {
    indigo: 'bg-indigo-100 text-indigo-600',
    purple: 'bg-purple-100 text-purple-600',
    pink: 'bg-pink-100 text-pink-600'
  };

  const hoverColorClasses = {
    'indigo': 'from-indigo-500 to-indigo-600',
    'purple': 'from-purple-500 to-purple-600',
    'pink': 'from-pink-500 to-pink-600'
  };

  return (
    <div
      className={`rounded-xl shadow-sm border border-gray-200 p-6 transition-all duration-300 cursor-pointer ${isHovered
          ? `bg-gradient-to-br ${hoverColorClasses[color]} text-white transform scale-105 shadow-xl`
          : 'bg-white hover:shadow-md'
        }`}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all duration-300 ${isHovered ? 'bg-white bg-opacity-20' : colorClasses[color]
        }`}>
        <Icon className={`w-6 h-6 transition-all duration-300 ${isHovered ? 'text-white' : ''
          }`} />
      </div>
      <h3 className={`text-xl font-bold mb-2 ${isHovered ? 'text-white' : 'text-gray-900'}`}>
        {title}
      </h3>
      <p className={`${isHovered ? 'text-white text-opacity-90' : 'text-gray-600'}`}>
        {description}
      </p>
    </div>
  );
}



type FlowStepProps = {
  children: ReactNode;
};
function FlowStep({ children }: FlowStepProps) {
  return (
    <div className="flex items-start space-x-3 bg-gray-50 rounded-lg p-4">
      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
      <div className="flex-1">{children}</div>
    </div>
  );
}