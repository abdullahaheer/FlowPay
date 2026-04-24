"use client";
import React, { useState, useEffect } from 'react';
import { LayoutShell } from '@/components/Layout/LayoutShell';
import { db, auth } from '@/lib/firebase';
import { doc, updateDoc, increment, collection, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { CreditCard, Loader2, ShieldCheck, Lock } from 'lucide-react';

export default function AddMoneyPage() {
    const [amount, setAmount] = useState('');
    const [currentBalance, setCurrentBalance] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [cardData, setCardData] = useState({ number: '', expiry: '', cvv: '' });
    
    const router = useRouter();

    const parsedAmount = parseFloat(amount);
    const isAmountValid = parsedAmount >= 100 && parsedAmount <= 50000;
    const isCardNumberValid = cardData.number.replace(/\s/g, '').length === 16;
    const isExpiryValid = cardData.expiry.length === 5;
    const isCvvValid = cardData.cvv.length === 3;
    const isFormValid = isAmountValid && isCardNumberValid && isExpiryValid && isCvvValid;

    useEffect(() => {
        if (!auth.currentUser) return;
        const unsub = onSnapshot(doc(db, "users", auth.currentUser.uid), (doc) => {
            if (doc.exists()) setCurrentBalance(doc.data().balance || 0);
        });
        return () => unsub();
    }, []);

    const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        let formattedValue = value.replace(/\D/g, ''); 
        if (name === 'number') {
            formattedValue = formattedValue.slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
        } else if (name === 'expiry') {
            formattedValue = formattedValue.slice(0, 4).replace(/(.{2})/, '$1/');
        } else if (name === 'cvv') {
            formattedValue = formattedValue.slice(0, 3);
        }
        setCardData(prev => ({ ...prev, [name]: formattedValue }));
    };

    const handleAddBalance = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) return;

        setLoading(true);
        const uid = auth.currentUser?.uid;

        if (!uid) {
            toast.error("User not authenticated");
            setLoading(false);
            return;
        }

        try {
            const userRef = doc(db, "users", uid);

            // 1. Balance Update
            await updateDoc(userRef, {
                balance: increment(parsedAmount)
            });

            // 2. Transaction Record (Fixed for History Page)
            await addDoc(collection(db, "transactions"), {
                userId: uid,           // Search key for history
                amount: parsedAmount,
                type: 'deposit',
                category: 'Top-up',
                title: 'Money Added',   // Shows instead of "undefined"
                subTitle: 'via Debit/Credit Card',
                status: 'success',
                isIncoming: true,      // Makes it GREEN (+) in history
                timestamp: serverTimestamp()
            });

            // 3. Notification
            await addDoc(collection(db, "notifications"), {
                userId: uid,
                title: "Deposit Successful",
                message: `Rs. ${parsedAmount.toLocaleString()} added to your wallet.`,
                type: 'receive',
                isRead: false,
                timestamp: serverTimestamp()
            });

            toast.success(`Rs. ${parsedAmount.toLocaleString()} Added!`);
            
            setTimeout(() => {
                router.push('/dashboard');
            }, 1500);

        } catch (error) {
            console.error("Transaction Error:", error);
            toast.error("Payment failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <LayoutShell headerTitle="Add Money" showBack>
            <div style={{ padding: '20px', maxWidth: '480px', margin: '0 auto', color: 'white' }}>
                
                {/* Balance Display */}
                <div style={{ 
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
                    padding: '25px', 
                    borderRadius: '24px', 
                    marginBottom: '25px', 
                    border: '1px solid rgba(255,255,255,0.08)', 
                    position: 'relative', 
                    overflow: 'hidden' 
                }}>
                    <div style={{ position: 'absolute', bottom: '-20px', right: '-10px', opacity: 0.15 }}>
                        <CreditCard size={120} />
                    </div>
                    <p style={{ color: '#9CA3AF', fontSize: '12px', fontWeight: '600', letterSpacing: '1px' }}>CURRENT BALANCE</p>
                    <h2 style={{ fontSize: '34px', fontWeight: '800', margin: '10px 0 0', position: 'relative', zIndex: 1 }}>
                        <span style={{ fontSize: '18px', marginRight: '5px' }}>Rs.</span>
                        {currentBalance.toLocaleString()}
                    </h2>
                </div>

                <form onSubmit={handleAddBalance}>
                    {/* Amount Input */}
                    <div style={{ marginBottom: '25px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', height: '20px', marginBottom: '8px' }}>
                            <label style={{ fontSize: '13px', color: '#9CA3AF' }}>Enter Amount</label>
                            {(!isAmountValid && amount) && (
                                <span style={{ fontSize: '11px', color: '#FF4B4B', fontWeight: '600' }}>
                                    {parsedAmount < 100 ? "Min Rs. 100" : "Max Rs. 50,000"}
                                </span>
                            )}
                        </div>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <span style={{ 
                                position: 'absolute', left: '20px', fontSize: '24px', fontWeight: '800', 
                                color: isAmountValid ? '#4CAF50' : '#64748b', transition: '0.3s'
                            }}>Rs.</span>
                            <input 
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0"
                                style={{ 
                                    width: '100%', padding: '18px 20px 18px 65px', background: '#0a1622', 
                                    border: `2px solid ${isAmountValid ? '#4CAF50' : 'rgba(255,255,255,0.1)'}`, 
                                    borderRadius: '18px', color: '#4CAF50', fontSize: '26px', fontWeight: '800', 
                                    outline: 'none', transition: '0.3s'
                                }}
                            />
                        </div>
                    </div>

                    {/* Card Details */}
                    <div style={{ 
                        background: '#0a1622', padding: '25px', borderRadius: '24px', 
                        marginBottom: '30px', border: '1px solid rgba(255,255,255,0.05)' 
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                            <Lock size={18} color={isCardNumberValid ? "#4CAF50" : "#9CA3AF"} />
                            <span style={{ fontSize: '14px', fontWeight: '600' }}>Secure Card Payment</span>
                        </div>

                        <input 
                            name="number" 
                            value={cardData.number} 
                            onChange={handleCardChange}
                            placeholder="0000 0000 0000 0000" 
                            style={{ 
                                width: '100%', padding: '15px', background: 'rgba(255,255,255,0.03)', 
                                border: `1px solid ${isCardNumberValid ? '#4CAF50' : 'rgba(255,255,255,0.1)'}`, 
                                borderRadius: '12px', color: 'white', outline: 'none', marginBottom: '15px', 
                                letterSpacing: '2.5px', fontSize: '16px'
                            }} 
                        />

                        <div style={{ display: 'flex', gap: '15px' }}>
                            <input 
                                name="expiry" value={cardData.expiry} onChange={handleCardChange} 
                                placeholder="MM/YY" 
                                style={{ 
                                    width: '60%', padding: '15px', background: 'rgba(255,255,255,0.03)', 
                                    border: `1px solid ${isExpiryValid ? '#4CAF50' : 'rgba(255,255,255,0.1)'}`, 
                                    borderRadius: '12px', color: 'white', outline: 'none' 
                                }} 
                            />
                            <input 
                                name="cvv" value={cardData.cvv} onChange={handleCardChange} 
                                type="password" placeholder="CVV" 
                                style={{ 
                                    width: '40%', padding: '15px', background: 'rgba(255,255,255,0.03)', 
                                    border: `1px solid ${isCvvValid ? '#4CAF50' : 'rgba(255,255,255,0.1)'}`, 
                                    borderRadius: '12px', color: 'white', outline: 'none' 
                                }} 
                            />
                        </div>
                    </div>

                    <button 
                        type="submit"
                        disabled={!isFormValid || loading}
                        style={{ 
                            width: '100%', padding: '20px', borderRadius: '20px', 
                            background: isFormValid ? 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)' : '#1e293b', 
                            color: isFormValid ? 'white' : '#64748b', fontWeight: '800', border: 'none', 
                            cursor: isFormValid ? 'pointer' : 'not-allowed', display: 'flex', 
                            justifyContent: 'center', alignItems: 'center', gap: '12px', transition: '0.4s'
                        }}
                    >
                        {loading ? <Loader2 className="animate-spin" size={22} /> : (
                            <>
                                <ShieldCheck size={22} />
                                {isFormValid ? `Pay Rs. ${parsedAmount.toLocaleString()}` : "Enter Details"}
                            </>
                        )}
                    </button>
                </form>
            </div>
        </LayoutShell>
    );
}