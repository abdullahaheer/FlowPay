"use client";
import React, { useState, Suspense } from 'react';
import { LayoutShell } from '@/components/Layout/LayoutShell';
import { db, auth } from '@/lib/firebase';
import { 
    doc, runTransaction, serverTimestamp, collection 
} from 'firebase/firestore';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Loader2, Car, ShieldCheck } from 'lucide-react';

function MTagContent() {
    const [mtagId, setMtagId] = useState<string>('');
    const [amount, setAmount] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [isLimitExceeded, setIsLimitExceeded] = useState<boolean>(false);
    
    // Security Modal States
    const [showPassModal, setShowPassModal] = useState<boolean>(false);
    const [password, setPassword] = useState<string>('');
    const [verifying, setVerifying] = useState<boolean>(false);

    const router = useRouter();
    const currentUserId = auth.currentUser?.uid;

    const notifyError = (msg: string) => toast.error(msg, { style: { background: '#ff4b4b', color: '#fff' } });
    const notifySuccess = (msg: string) => toast.success(msg, { style: { background: '#4CAF50', color: '#fff' } });

    // Handle M-Tag ID Input (Strictly 8 digits)
    const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (/^\d*$/.test(val) && val.length <= 8) {
            setMtagId(val);
        }
    };

    // Handle Amount Input with Red Text logic
    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const numVal = parseFloat(val);
        
        setAmount(val);

        // Check limit for UI feedback (Red Text)
        if (numVal > 5000) {
            setIsLimitExceeded(true);
        } else {
            setIsLimitExceeded(false);
        }
    };

    const handleInitialSubmit = () => {
        const rechargeAmount = parseFloat(amount);

        if (mtagId.length < 8) return notifyError("Invalid M-Tag ID (8 digits required)");
        if (!amount || rechargeAmount < 100) return notifyError("Minimum recharge is PKR 100");
        
        // Prevent modal if limit exceeded
        if (rechargeAmount > 5000) return; 
        
        setShowPassModal(true);
    };

    const handleSecurityVerify = async () => {
        const user = auth.currentUser;
        if (!user || !user.email) return;
        setVerifying(true);
        try {
            const credential = EmailAuthProvider.credential(user.email, password);
            await reauthenticateWithCredential(user, credential);
            await executeMTagRecharge();
            setShowPassModal(false);
        } catch { 
            notifyError("Incorrect Security Password!"); 
        } finally { 
            setVerifying(false); 
        }
    };

    const executeMTagRecharge = async () => {
        const rechargeAmount = parseFloat(amount);
        setLoading(true);

        try {
            if (!currentUserId) return;

            await runTransaction(db, async (transaction) => {
                const userRef = doc(db, "users", currentUserId);
                const uDoc = await transaction.get(userRef);

                if (!uDoc.exists()) throw new Error("User record not found");
                const currentBalance = uDoc.data().balance || 0;

                if (currentBalance < rechargeAmount) {
                    throw new Error("INSUFFICIENT_BALANCE");
                }

                // 1. Update Balance
                transaction.update(userRef, { 
                    balance: currentBalance - rechargeAmount 
                });

                // 2. Create Transaction History Entry
                const newTransRef = doc(collection(db, "transactions")); 
                transaction.set(newTransRef, {
                    userId: currentUserId,
                    amount: rechargeAmount,
                    type: 'debit',
                    category: 'M-Tag',
                    title: 'Motorway M-Tag',
                    subTitle: `ID: ${mtagId}`,
                    description: `Recharge for M-Tag account ${mtagId}`,
                    status: 'success',
                    isIncoming: false, // Minus logic ke liye
                    referenceId: mtagId,
                    timestamp: serverTimestamp()
                });

                // 3. Add Notification (NEW PART ADDED)
                const notificationRef = doc(collection(db, "notifications"));
                transaction.set(notificationRef, {
                    userId: currentUserId,
                    title: "M-Tag Recharge Success",
                    message: `Rs. ${rechargeAmount} has been recharged to M-Tag ID: ${mtagId}.`,
                    type: 'payment',
                    isRead: false,
                    timestamp: serverTimestamp()
                });
            });

            notifySuccess("M-Tag Recharge Successful!");
            router.push('/dashboard');

        } catch (err: any) { 
            if (err.message === "INSUFFICIENT_BALANCE") {
                notifyError("Insufficient Balance! Please top up your account.");
            } else {
                notifyError("Transaction failed. Please try again.");
            }
        } finally { 
            setLoading(false); 
        }
    };

    return (
        <div style={{ backgroundColor: '#000D1A', minHeight: '100vh', color: '#FFFFFF' }}>
            <LayoutShell headerTitle="M-Tag Recharge" showBack>
                <div style={{ padding: '30px 20px', maxWidth: '450px', margin: '0 auto' }}>
                    
                    {/* Amount Input Section */}
                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <p style={{ 
                            fontSize: '11px', 
                            color: isLimitExceeded ? '#ff4b4b' : '#4CAF50', // RED if exceeded
                            fontWeight: 'bold', 
                            letterSpacing: '1.5px',
                            transition: '0.3s'
                        }}>
                            {isLimitExceeded ? "LIMIT EXCEEDED (MAX 5,000)" : "ENTER RECHARGE AMOUNT (MAX 5,000)"}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <span style={{ 
                                fontSize: '24px', 
                                fontWeight: 'bold', 
                                color: isLimitExceeded ? '#ff4b4b' : '#4CAF50' 
                            }}>PKR</span>
                            <input 
                                type="number" 
                                value={amount} 
                                onChange={handleAmountChange}
                                placeholder="0"
                                style={{ 
                                    background: 'transparent', 
                                    border: 'none', 
                                    fontSize: '55px', 
                                    fontWeight: '800', 
                                    color: isLimitExceeded ? '#ff4b4b' : '#4CAF50', // RED if exceeded
                                    width: '250px', 
                                    textAlign: 'center', 
                                    outline: 'none',
                                    transition: '0.3s'
                                }}
                            />
                        </div>
                    </div>

                    {/* M-Tag ID Input Section */}
                    <div style={{ marginBottom: '40px' }}>
                        <p style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '10px' }}>M-Tag ID (8 Digits Only)</p>
                        <div style={{ background: '#0a1622', padding: '18px 20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Car size={24} color="#4CAF50" />
                            <input 
                                type="text"
                                value={mtagId}
                                onChange={handleIdChange}
                                placeholder="12345678"
                                style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: '16px' }}
                            />
                        </div>
                    </div>

                    {/* Action Button */}
                    <button 
                        onClick={handleInitialSubmit} 
                        disabled={loading || isLimitExceeded} // Disable button if limit exceeded
                        style={{ 
                            width: '100%', 
                            padding: '20px', 
                            borderRadius: '22px', 
                            background: isLimitExceeded 
                                ? '#1e293b' // Dark gray if disabled
                                : 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)', 
                            color: isLimitExceeded ? '#9CA3AF' : 'white', 
                            fontWeight: 'bold', 
                            border: 'none', 
                            cursor: isLimitExceeded ? 'not-allowed' : 'pointer', 
                            transition: '0.3s' 
                        }}
                    >
                        {loading ? <Loader2 className="animate-spin mx-auto" /> : isLimitExceeded ? "Limit Exceeded" : "Verify & Recharge"}
                    </button>
                </div>

                {/* Password Security Modal */}
                {showPassModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, backdropFilter: 'blur(8px)' }}>
                        <div style={{ background: '#0a1622', width: '90%', maxWidth: '400px', padding: '30px', borderRadius: '28px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                            <ShieldCheck size={48} color="#4CAF50" style={{ margin: '0 auto 15px' }} />
                            <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>Authorize Recharge</h3>
                            <p style={{ color: '#9CA3AF', fontSize: '14px', marginTop: '5px' }}>
                                Confirm payment of <b>PKR {amount}</b> for M-Tag <b>{mtagId}</b>
                            </p>
                            
                            <input 
                                type="password" 
                                placeholder="Enter Password" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ width: '100%', padding: '15px', borderRadius: '12px', background: '#112233', border: '1px solid #334455', color: 'white', margin: '20px 0', outline: 'none' }}
                                autoFocus
                            />

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => setShowPassModal(false)} style={{ flex: 1, padding: '12px', background: '#1e293b', borderRadius: '12px', color: 'white', border: 'none' }}>Cancel</button>
                                <button onClick={handleSecurityVerify} disabled={verifying} style={{ flex: 2, padding: '12px', background: '#4CAF50', borderRadius: '12px', color: 'white', fontWeight: 'bold', border: 'none' }}>
                                    {verifying ? "Verifying..." : "Confirm Payment"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </LayoutShell>
        </div>
    );
}

export default function MTagPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-[#000D1A]"><Loader2 className="animate-spin text-green-500" size={40}/></div>}>
      <MTagContent />
    </Suspense>
  );
}