"use client";
import React, { useState, useEffect } from 'react';
import { LayoutShell } from '@/components/Layout/LayoutShell';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, updateDoc, increment, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Loader2, Wifi, Lock, ChevronDown, CheckCircle2, BellRing } from 'lucide-react';

// 1. Mock Data 0 to 9 (12-digit format)
const mockBills: Record<string, { amount: number; name: string }> = {
    "000000000000": { amount: 1200, name: "Asad Rahim" },
    "111111111111": { amount: 2500, name: "Zohaib Hassan" },
    "222222222222": { amount: 4800, name: "Premium User" },
    "333333333333": { amount: 1900, name: "Faisal Khan" },
    "444444444444": { amount: 3200, name: "Sajid Ali" },
    "555555555555": { amount: 2700, name: "Umar Farooq" },
    "666666666666": { amount: 5500, name: "Hamza Sheikh" },
    "777777777777": { amount: 1500, name: "Ayesha Bibi" },
    "888888888888": { amount: 4100, name: "Bilal Ahmed" },
    "999999999999": { amount: 2150, name: "M. Usman" },
};

const providers = [
    { id: 'ptcl', name: 'PTCL Broadband', icon: '🌲' },
    { id: 'nayatel', name: 'Nayatel Fiber', icon: '⚡' },
    { id: 'stormfiber', name: 'StormFiber', icon: '🌪️' },
    { id: 'transworld', name: 'Transworld', icon: '🌐' },
];

export default function InternetBillPage() {
    const router = useRouter();
    const [step, setStep] = useState(1); 
    const [loading, setLoading] = useState(false);
    const [balance, setBalance] = useState(0);

    const [selectedProvider, setSelectedProvider] = useState(providers[0]);
    const [refNumber, setRefNumber] = useState('');
    const [billData, setBillData] = useState<{ amount: number; name: string } | null>(null);
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (!auth.currentUser) return;
        getDoc(doc(db, "users", auth.currentUser.uid)).then(s => setBalance(s.data()?.balance || 0));
    }, []);

    const handleFetchBill = (e: React.FormEvent) => {
        e.preventDefault();
        if (refNumber.length < 12) {
            toast.error("Reference number must be 12 digits");
            return;
        }
        setLoading(true);
        
        setTimeout(() => {
            const data = mockBills[refNumber];
            if (data) {
                setBillData(data);
                setStep(2);
            } else {
                toast.error("Bill not found! Use 000000000000 to 999999999999");
            }
            setLoading(false);
        }, 800);
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user || !billData || !user.email) return;

        if (balance < billData.amount) {
            toast.error("Insufficient Balance!");
            return;
        }

        setLoading(true);
        try {
            // Password Verification
            const credential = EmailAuthProvider.credential(user.email, password);
            await reauthenticateWithCredential(user, credential);

            // 1. Deduct Balance
            await updateDoc(doc(db, "users", user.uid), { balance: increment(-billData.amount) });

            // 2. Add Transaction Record (Minus logic)
            await addDoc(collection(db, "transactions"), {
                userId: user.uid,
                amount: billData.amount,
                type: 'bill_payment',
                title: `${selectedProvider.name} Payment`,
                subTitle: `Ref: ${refNumber} (${billData.name})`,
                isIncoming: false,
                status: 'success',
                timestamp: serverTimestamp()
            });

            // 3. Add Notification (NEW FIX)
            await addDoc(collection(db, "notifications"), {
                userId: user.uid,
                title: "Bill Paid Successfully",
                message: `Your ${selectedProvider.name} bill of Rs. ${billData.amount} for Consumer ID ${refNumber} has been paid.`,
                type: 'payment',
                isRead: false,
                timestamp: serverTimestamp()
            });

            toast.success("Bill Paid Successfully!");
            router.push('/dashboard');
        } catch (error: any) {
            toast.error(error.code === 'auth/wrong-password' ? "Incorrect Password!" : "Transaction Failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <LayoutShell headerTitle="Internet Bill" showBack>
            <div style={{ padding: '20px', maxWidth: '480px', margin: '0 auto', color: 'white' }}>
                
                {step === 1 ? (
                    <div>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '8px', display: 'block' }}>SERVICE PROVIDER</label>
                            <div style={{ position: 'relative' }}>
                                <select 
                                    value={selectedProvider.id}
                                    onChange={(e) => setSelectedProvider(providers.find(p => p.id === e.target.value)!)}
                                    style={{ 
                                        width: '100%', padding: '16px', borderRadius: '16px', background: '#0a1622', 
                                        border: '1px solid rgba(255,255,255,0.1)', color: 'white', appearance: 'none',
                                        fontSize: '15px', outline: 'none', cursor: 'pointer'
                                    }}
                                >
                                    {providers.map(p => <option key={p.id} value={p.id} style={{background: '#0a1622'}}>{p.name}</option>)}
                                </select>
                                <ChevronDown style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#4B5563' }} size={18} />
                            </div>
                        </div>

                        <div style={{ marginBottom: '30px' }}>
                            <label style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '8px', display: 'block' }}>12-DIGIT REFERENCE NUMBER</label>
                            <div style={{ position: 'relative' }}>
                                <input 
                                    type="text"
                                    value={refNumber}
                                    maxLength={12}
                                    onChange={(e) => setRefNumber(e.target.value.replace(/\D/g, ''))}
                                    placeholder="e.g. 111111111111"
                                    style={{ 
                                        width: '100%', padding: '16px', borderRadius: '16px', background: '#0a1622', 
                                        border: refNumber.length === 12 ? '1px solid #4CAF50' : '1px solid rgba(255,255,255,0.1)', 
                                        color: 'white', fontSize: '16px', letterSpacing: '2px', outline: 'none'
                                    }}
                                />
                                {refNumber.length === 12 && <CheckCircle2 size={18} color="#4CAF50" style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' }} />}
                            </div>
                        </div>

                        <button 
                            disabled={refNumber.length !== 12 || loading}
                            onClick={handleFetchBill}
                            style={{ 
                                width: '100%', padding: '18px', borderRadius: '18px', 
                                background: refNumber.length === 12 ? '#4CAF50' : '#1e293b', 
                                border: 'none', color: 'white', fontWeight: '700', cursor: 'pointer'
                            }}
                        >
                            {loading ? <Loader2 className="animate-spin" /> : "Fetch Bill"}
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handlePayment}>
                        <div style={{ 
                            background: 'linear-gradient(145deg, #0d1b2a, #000814)', 
                            padding: '24px', borderRadius: '24px', border: '1px solid rgba(76, 175, 80, 0.3)', marginBottom: '25px' 
                        }}>
                            <p style={{ fontSize: '11px', color: '#4CAF50', fontWeight: '700' }}>DUE AMOUNT</p>
                            <h1 style={{ fontSize: '32px', margin: '5px 0' }}>Rs. {billData?.amount.toLocaleString()}</h1>
                            
                            <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '13px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ color: '#9CA3AF' }}>Customer:</span>
                                    <span>{billData?.name}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#9CA3AF' }}>Consumer ID:</span>
                                    <span>{refNumber}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ fontSize: '12px', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                <Lock size={14} /> ACCOUNT PASSWORD
                            </label>
                            <input 
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Verify password to pay"
                                style={{ 
                                    width: '100%', padding: '16px', borderRadius: '16px', background: '#0a1622', 
                                    border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' 
                                }}
                            />
                        </div>

                        <button 
                            disabled={loading || !password}
                            style={{ 
                                width: '100%', padding: '18px', borderRadius: '18px', 
                                background: '#4CAF50', border: 'none', color: 'white', fontWeight: '800'
                            }}
                        >
                            {loading ? <Loader2 className="animate-spin" /> : "Confirm Payment"}
                        </button>
                    </form>
                )}
            </div>
        </LayoutShell>
    );
}