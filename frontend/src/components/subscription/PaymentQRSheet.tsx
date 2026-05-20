'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Copy, ChevronRight, Upload, ImageIcon } from 'lucide-react';
import { apiService } from '@/services/api';
import { useTelegram } from '@/hooks/useTelegram';

interface QRCode {
  id: string;
  provider: string;
  imageUrl: string;
  accountName?: string;
  accountNumber?: string;
  instructions?: string;
}

const PLANS = [
  { label: '1 Month',  days: 30,  price: 2.99, badge: '' },
  { label: '3 Months', days: 90,  price: 7.99, badge: 'Popular' },
  { label: '6 Months', days: 180, price: 14.99, badge: 'Best Value' },
  { label: 'Lifetime', days: 0,   price: 29.99, badge: '∞' },
];

const PROVIDER_ICONS: Record<string, string> = {
  ABA: '🏦', ACLEDA: '🏧', WING: '🪽', KHQR: '🇰🇭',
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function PaymentQRSheet({ isOpen, onClose }: Props) {
  const { haptic } = useTelegram();
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(1);
  const [selectedProvider, setSelectedProvider] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [note, setNote] = useState('');
  const [copied, setCopied] = useState(false);
  const [receipt, setReceipt] = useState<string>('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const receiptRef = useRef<HTMLInputElement>(null);

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingReceipt(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setReceipt(ev.target?.result as string);
      setUploadingReceipt(false);
      haptic.success();
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!isOpen) return;
    setSubmitted(false);
    setReceipt('');
    setNote('');
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/qr-codes`)
      .then(r => r.json())
      .then(json => {
        setQrCodes(json.data || []);
        setSelectedProvider(0);
      })
      .catch(() => setQrCodes([]))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const plan = PLANS[selectedPlan];
  const qr = qrCodes[selectedProvider];

  const copyAccount = () => {
    if (!qr?.accountNumber) return;
    navigator.clipboard.writeText(qr.accountNumber);
    setCopied(true);
    haptic.success();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    haptic.selection();
    try {
      await apiService.payments.request({
        amount: plan.price,
        currency: 'USD',
        plan: plan.days === 0 ? 'LIFETIME' : 'PREMIUM',
        durationDays: plan.days || 36500,
        qrProvider: qr?.provider,
        screenshotUrl: receipt || undefined,
        note: note.trim() || undefined,
      });
      haptic.success();
      setSubmitted(true);
    } catch {
      haptic.error();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="w-full max-w-md bg-card rounded-t-3xl overflow-hidden"
            style={{ maxHeight: '92vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3">
              <h2 className="text-base font-bold">Upgrade to Premium</h2>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {submitted ? (
              /* ── Success state ── */
              <div className="px-5 pb-8 flex flex-col items-center text-center gap-4 pt-4">
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-emerald-400">Payment Submitted!</h3>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                    Your payment request has been sent to the admin for review. We'll activate your plan within 24 hours.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-full py-3.5 rounded-2xl bg-emerald-500 text-white text-sm font-bold mt-2"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="px-5 pb-8 space-y-5">

                {/* Plan selector */}
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2.5">Select Plan</p>
                  <div className="grid grid-cols-2 gap-2">
                    {PLANS.map((p, i) => (
                      <button
                        key={p.label}
                        onClick={() => { setSelectedPlan(i); haptic.selection(); }}
                        className={`relative flex flex-col items-center py-3 px-2 rounded-2xl border-2 transition-all ${
                          selectedPlan === i
                            ? 'border-violet-500 bg-violet-500/15'
                            : 'border-border bg-secondary'
                        }`}
                      >
                        {p.badge && (
                          <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-violet-500 text-white whitespace-nowrap">
                            {p.badge}
                          </span>
                        )}
                        <span className={`text-sm font-bold ${selectedPlan === i ? 'text-violet-300' : 'text-foreground'}`}>
                          {p.label}
                        </span>
                        <span className={`text-xl font-bold mt-0.5 ${selectedPlan === i ? 'text-white' : 'text-foreground'}`}>
                          ${p.price.toFixed(2)}
                        </span>
                        {p.days > 0 && (
                          <span className="text-[10px] text-muted-foreground">{p.days} days</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {loading ? (
                  <div className="flex justify-center py-10">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full"
                    />
                  </div>
                ) : qrCodes.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-3xl mb-2">🔧</p>
                    <p className="text-sm text-muted-foreground">No payment methods available yet.</p>
                    <p className="text-xs text-muted-foreground mt-1">Please contact support to upgrade.</p>
                  </div>
                ) : (
                  <>
                    {/* Provider tabs */}
                    {qrCodes.length > 1 && (
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2.5">Pay via</p>
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                          {qrCodes.map((q, i) => (
                            <button
                              key={q.provider}
                              onClick={() => { setSelectedProvider(i); haptic.selection(); }}
                              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 flex-shrink-0 text-sm font-semibold transition-all ${
                                selectedProvider === i
                                  ? 'border-violet-500 bg-violet-500/15 text-violet-300'
                                  : 'border-border bg-secondary text-muted-foreground'
                              }`}
                            >
                              <span>{PROVIDER_ICONS[q.provider] || '💳'}</span>
                              {q.provider}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* QR code display */}
                    {qr && (
                      <div className="flex flex-col items-center gap-3">
                        <div className="bg-white p-3 rounded-2xl shadow-lg">
                          <img
                            src={qr.imageUrl}
                            alt={`${qr.provider} QR code`}
                            className="w-52 h-52 object-contain"
                          />
                        </div>

                        {/* Account info */}
                        {(qr.accountName || qr.accountNumber) && (
                          <div className="w-full bg-secondary rounded-2xl px-4 py-3 space-y-2">
                            {qr.accountName && (
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Account Name</span>
                                <span className="font-semibold">{qr.accountName}</span>
                              </div>
                            )}
                            {qr.accountNumber && (
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Account No.</span>
                                <button
                                  onClick={copyAccount}
                                  className="flex items-center gap-1.5 font-semibold text-violet-400"
                                >
                                  {qr.accountNumber}
                                  {copied
                                    ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                                    : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            )}
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Amount to Pay</span>
                              <span className="font-bold text-emerald-400">${plan.price.toFixed(2)}</span>
                            </div>
                          </div>
                        )}

                        {/* Instructions */}
                        {qr.instructions && (
                          <p className="text-xs text-muted-foreground text-center leading-relaxed">
                            {qr.instructions}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Receipt upload — required */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          Payment Receipt <span className="text-rose-400">*</span>
                        </label>
                        {receipt && (
                          <button
                            onClick={() => setReceipt('')}
                            className="text-[10px] text-rose-400 font-medium"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <input
                        ref={receiptRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleReceiptChange}
                      />

                      {receipt ? (
                        <div
                          className="relative w-full rounded-2xl overflow-hidden border-2 border-emerald-500/40 cursor-pointer"
                          onClick={() => receiptRef.current?.click()}
                        >
                          <img src={receipt} alt="Receipt" className="w-full max-h-48 object-contain bg-black/20" />
                          <div className="absolute bottom-0 inset-x-0 bg-emerald-500/80 py-1.5 text-center text-[10px] font-bold text-white tracking-wide">
                            ✓ Receipt uploaded — tap to change
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => receiptRef.current?.click()}
                          disabled={uploadingReceipt}
                          className="w-full h-28 rounded-2xl border-2 border-dashed border-border hover:border-violet-500/50 hover:bg-violet-500/5 transition-colors flex flex-col items-center justify-center gap-2"
                        >
                          {uploadingReceipt ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                              className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full"
                            />
                          ) : (
                            <>
                              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                                <ImageIcon className="w-5 h-5 text-muted-foreground" />
                              </div>
                              <p className="text-xs font-medium text-muted-foreground">Tap to upload payment screenshot</p>
                              <p className="text-[10px] text-muted-foreground/60">Required before submitting</p>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Note (optional) */}
                    <div className="bg-secondary rounded-2xl px-4 py-3">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">
                        Transaction Ref / Note (optional)
                      </label>
                      <input
                        type="text"
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        placeholder="e.g. last 4 digits of transaction"
                        className="w-full bg-transparent outline-none text-sm placeholder:text-muted-foreground/40"
                        maxLength={100}
                      />
                    </div>

                    {/* Submit — disabled until receipt uploaded */}
                    <button
                      onClick={handleSubmit}
                      disabled={submitting || !receipt}
                      className="w-full py-4 rounded-2xl text-sm font-bold text-white flex items-center justify-center gap-2 shadow-lg transition-opacity"
                      style={{
                        background: receipt
                          ? 'linear-gradient(135deg,#7c3aed,#4f46e5)'
                          : undefined,
                        opacity: receipt ? 1 : 0.4,
                        backgroundColor: receipt ? undefined : '#4b5563',
                        cursor: receipt ? 'pointer' : 'not-allowed',
                      }}
                    >
                      {submitting ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                      ) : (
                        <>
                          {receipt ? <CheckCircle className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                          {receipt ? 'Submit Payment Request' : 'Upload Receipt First'}
                          {receipt && <ChevronRight className="w-4 h-4" />}
                        </>
                      )}
                    </button>

                    <p className="text-center text-[10px] text-muted-foreground -mt-2">
                      Your plan will be activated within 24 hours after admin review
                    </p>
                  </>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
