'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Sparkles, X, Crown } from 'lucide-react';
import { PaymentQRSheet } from './PaymentQRSheet';

interface SubscriptionExpiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan?: string;
}

export function SubscriptionExpiredModal({ isOpen, onClose, plan }: SubscriptionExpiredModalProps) {
  const [showQR, setShowQR] = useState(false);
  const isExpiredPremium = plan === 'PREMIUM';

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.8)' }}
            onClick={onClose}
          >
            <motion.div
              initial={{ y: 60, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 60, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-sm sm:max-w-md mx-4 mb-6 sm:mb-0 rounded-3xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Gradient header */}
              <div
                className="relative px-6 pt-8 pb-6 flex flex-col items-center"
                style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)' }}
              >
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4 text-white/70" />
                </button>

                <div className="relative mb-4">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
                      <Lock className="w-7 h-7 text-white" />
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
                    className="absolute -top-1 -right-1"
                  >
                    <Sparkles className="w-5 h-5 text-yellow-300" />
                  </motion.div>
                </div>

                <h2 className="text-xl font-bold text-white text-center">
                  {isExpiredPremium ? 'Subscription Expired' : 'Free Trial Ended'}
                </h2>
                <p className="text-sm text-indigo-200 text-center mt-1.5 leading-relaxed">
                  {isExpiredPremium
                    ? 'Your premium subscription has expired. Renew now to keep recording transactions.'
                    : "Your free trial has ended. Go Premium to keep tracking your finances."}
                </p>
              </div>

              {/* Body */}
              <div className="bg-card px-6 pt-5 pb-6">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Premium includes</p>
                <div className="space-y-2.5 mb-6">
                  {[
                    { icon: '📊', text: 'Unlimited transaction recording' },
                    { icon: '📈', text: 'Advanced analytics & reports' },
                    { icon: '🏦', text: 'Multiple accounts & transfers' },
                    { icon: '🔔', text: 'Smart spending alerts' },
                  ].map((feat) => (
                    <div key={feat.text} className="flex items-center gap-3">
                      <span className="text-base w-6 text-center flex-shrink-0">{feat.icon}</span>
                      <span className="text-sm text-foreground">{feat.text}</span>
                      <span className="ml-auto text-emerald-400 text-xs font-bold">✓</span>
                    </div>
                  ))}
                </div>

                {/* CTA — opens QR sheet */}
                <button
                  onClick={() => setShowQR(true)}
                  className="w-full py-3.5 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)' }}
                >
                  <Crown className="w-4 h-4" />
                  Upgrade to Premium
                </button>

                <p className="text-center text-[10px] text-muted-foreground mt-3">
                  Scan QR to pay · Activated within 24h
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR payment sheet — z-[90] so it sits above the modal */}
      <PaymentQRSheet
        isOpen={showQR}
        onClose={() => setShowQR(false)}
      />
    </>
  );
}
