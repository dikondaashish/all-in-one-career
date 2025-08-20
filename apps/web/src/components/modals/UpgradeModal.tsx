'use client';

import { useState } from 'react';
import { X, Sparkles, ChevronRight, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/components/notifications/ToastContainer';

interface PricingOption {
  id: string;
  price: string;
  billing: string;
  value: number;
  interval: string;
  badge?: {
    type: 'popular' | 'value';
    text: string;
    icon?: string;
  };
}

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const premiumFeatures = [
  "Unlimited AI Resumes",
  "Unlimited AI Resume ATS Optimizer", 
  "Unlimited AI Resume Bullet and Summary Writer",
  "Advanced AI Resume Analysis",
  "Premium Job Tracking & Analytics",
  "Priority Customer Support",
  "Advanced Portfolio Builder",
  "Unlimited Email Templates"
];

const pricingOptions: PricingOption[] = [
  {
    id: 'weekly',
    price: '$8.99 per week',
    billing: 'paid weekly',
    value: 8.99,
    interval: 'week'
  },
  {
    id: 'monthly',
    price: '$23.99 per month', 
    billing: 'paid monthly',
    value: 23.99,
    interval: 'month'
  },
  {
    id: 'quarterly',
    price: '$18.33 per month',
    billing: 'paid quarterly',
    value: 54.99,
    interval: 'quarter',
    badge: {
      type: 'popular',
      text: 'Most Popular • Save 25%',
      icon: '🔥'
    }
  },
  {
    id: 'yearly',
    price: '$14.41 per month',
    billing: 'paid yearly', 
    value: 172.92,
    interval: 'year',
    badge: {
      type: 'value',
      text: 'Best Value • Save 40%',
      icon: '⚡'
    }
  }
];

interface PricingOptionProps {
  option: PricingOption;
  selectedPlan: string;
  onSelect: (id: string) => void;
}

const PricingOptionComponent = ({ option, selectedPlan, onSelect }: PricingOptionProps) => {
  const isSelected = selectedPlan === option.id;
  
  return (
    <div 
      className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all ${
        isSelected 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
      onClick={() => onSelect(option.id)}
    >
      {/* Badge for popular/best value */}
      {option.badge && (
        <div className={`absolute -top-3 right-4 px-3 py-1 rounded-full text-sm font-medium ${
          option.badge.type === 'popular' 
            ? 'bg-orange-100 text-orange-700' 
            : 'bg-yellow-100 text-yellow-700'
        }`}>
          {option.badge.icon && <span className="mr-1">{option.badge.icon}</span>}
          {option.badge.text}
        </div>
      )}
      
      <div className="flex items-center space-x-3">
        {/* Radio button */}
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
          isSelected ? 'border-blue-500' : 'border-gray-300'
        }`}>
          {isSelected && (
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
          )}
        </div>
        
        {/* Pricing info */}
        <div className="flex-1">
          <div className="font-semibold text-lg text-gray-900">
            {option.price}
          </div>
          <div className="text-sm text-gray-600">
            {option.billing}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState('quarterly'); // Default to quarterly (most popular)
  const [isProcessing, setIsProcessing] = useState(false);
  const { showToast } = useToast();

  if (!isOpen) return null;

  const handleUpgrade = async (planId: string) => {
    setIsProcessing(true);
    
    try {
      const planDetails = pricingOptions.find(plan => plan.id === planId);
      
      if (!planDetails) {
        throw new Error('Invalid plan selected');
      }

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      showToast({
        icon: '✅',
        title: 'Upgrade Successful',
        message: `Successfully upgraded to ${planDetails.interval} plan!`
      });
      
      onClose();
      
    } catch (error) {
      console.error('Payment error:', error);
      showToast({
        icon: '❌',
        title: 'Payment Failed',
        message: 'Payment failed. Please try again.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRedeemVoucher = () => {
    const voucherCode = prompt('Enter your voucher code:');
    
    if (voucherCode) {
      redeemVoucher(voucherCode);
    }
  };

  const redeemVoucher = async (code: string) => {
    try {
      // Simulate voucher redemption
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (code.toLowerCase() === 'premium2024') {
        showToast({
          icon: '🎉',
          title: 'Voucher Redeemed',
          message: 'Voucher redeemed successfully! Premium access granted.'
        });
        onClose();
      } else {
        showToast({
          icon: '❌',
          title: 'Invalid Voucher',
          message: 'Invalid voucher code. Please check and try again.'
        });
      }
      
    } catch {
      showToast({
        icon: '❌',
        title: 'Redemption Failed',
        message: 'Failed to redeem voucher. Please try again.'
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative p-8 pb-6">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Upgrade your plan and get AI Assistance
            </h1>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Choose your payment frequency
            </h2>
            <p className="text-lg text-gray-600">
              Instant Access, Cancel Anytime
            </p>
          </div>
        </div>

        {/* Two column content */}
        <div className="px-8 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Column - Premium Features */}
            <div className="bg-white rounded-2xl p-8 shadow-lg h-fit">
              <div className="flex items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Careerflow Premium</h3>
                <Sparkles className="ml-2 w-6 h-6 text-blue-500" />
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700 mb-2">Premium members are</p>
                <p className="text-lg font-semibold text-blue-600">
                  10X more effective in their Job Search
                </p>
              </div>
              
              <div className="space-y-4 mb-6">
                <h4 className="font-semibold text-gray-800 text-lg">
                  Everything in the free version, plus:
                </h4>
                
                {premiumFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
              
              <button className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                View more
              </button>
            </div>

            {/* Right Column - Pricing */}
            <div className="space-y-6">
              <div className="flex items-center space-x-2 text-green-600 font-medium">
                <Check className="w-5 h-5" />
                <span>Instant access, Cancel anytime.</span>
              </div>
              
              <div className="space-y-4">
                {pricingOptions.map((option) => (
                  <PricingOptionComponent
                    key={option.id}
                    option={option}
                    selectedPlan={selectedPlan}
                    onSelect={setSelectedPlan}
                  />
                ))}
              </div>
              
              <div className="space-y-3">
                <button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-lg font-semibold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => handleUpgrade(selectedPlan)}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    'Unlock Premium Features'
                  )}
                </button>
                
                <button 
                  className="w-full text-blue-600 hover:text-blue-700 py-2 font-medium transition-colors"
                  onClick={handleRedeemVoucher}
                  disabled={isProcessing}
                >
                  Redeem Voucher
                </button>
              </div>
              
              <p className="text-sm text-gray-500 text-center leading-relaxed">
                Secure payment by Stripe.com. All payments are fully encrypted and PCI-compliant. 
                We accept multiple payment methods.
              </p>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
