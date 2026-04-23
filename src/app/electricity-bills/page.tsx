"use client";
import React, { useState, Suspense } from 'react';
import { LayoutShell } from '@/components/Layout/LayoutShell';
import { db, auth } from '@/lib/firebase';
import { doc, runTransaction, serverTimestamp, collection } from 'firebase/firestore';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Loader2, Zap, ShieldCheck, ChevronDown, CheckCircle2 } from 'lucide-react';

// Hardcoded Bills Data
const MOCK_BILLS: Record<string, number> = {
    "00000000000000": 1250,
    "11111111111111": 3400,
    "22222222222222": 5800,
    "33333333333333": 2100,
    "44444444444444": 9500,
    "55555555555555": 4300,
    "66666666666666": 7200,
    "77777777777777": 1500,
    "88888888888888": 11000,
    "99999999999999": 6400,
};

const COMPANIES = [
    { id: 'mapco', name: 'MAPCO' },
    { id: 'lesco', name: 'LESCO' },
    { id: 'kelectric', name: 'K-Electric' },
    { id: 'iesco', name: 'IESCO' },
    { id: 'fesco', name: 'FESCO' }
];

function BillPaymentContent() {
    const [company, setCompany] = useState<string>('');
    const [billId, setBillId] = useState<string>('');
    const [amount, setAmount] = useState<number | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [loading, setLoading] = useState<boolean>(false);
    
    const [showPassModal, setShowPassModal] = useState<boolean>(false);
    const [password, setPassword] = useState<string>('');
    const [verifying, setVerifying] = useState<boolean>(false);

    const router = useRouter();
    const currentUserId = auth.currentUser?.uid;

    const notifyError = (msg: string) => toast.error(msg, { style: { background: '#ff4b4b', color: '#fff' } });
    const notifySuccess = (msg: string) => toast.success(msg, { style: { background: '#4CAF50', color: '#fff' } });

    const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (/^\d*$/.test(val) && val.length <= 14) {
            setBillId(val);
            // Auto-fetch logic
            if (val.length === 14) {
                if (MOCK_BILLS[val]) {
                    setAmount(MOCK_BILLS[val]);
                } else {
                    setAmount(null);
                    notifyError("Bill not found for this Reference ID");
                }
            } else {
                setAmount(null);
            }
        }
    };

    const handleInitialSubmit = () => {
        if (!company) return notifyError("Please select a company");
        if (billId.length < 14) return notifyError("Enter 14-digit Reference No");
        if (!amount) return notifyError("Invalid bill details");
        setShowPassModal(true);
    };

    const handleSecurityVerify = async () => {
        const user = auth.currentUser;
        if (!user?.email) return;
        setVerifying(true);
        try {
            const credential = EmailAuthProvider.credential(user.email, password);
            await reauthenticateWithCredential(user, credential);
            await executeBillPayment();
            setShowPassModal(false);
        } catch { 
            notifyError("Wrong Password!"); 
        } finally { 
            setVerifying(false); 
        }
    };

    const executeBillPayment = async () => {
        setLoading(true);
        try {
            if (!currentUserId || !amount) return;
            await runTransaction(db, async (transaction) => {
                const userRef = doc(db, "users", currentUserId);
                const uDoc = await transaction.get(userRef);
                const currentBalance = uDoc.data()?.balance || 0;

                if (currentBalance < amount) throw new Error("INSUFFICIENT_BALANCE");

                transaction.update(userRef, { balance: currentBalance - amount });
                const newTransRef = doc(collection(db, "transactions")); 
                transaction.set(newTransRef, {
                    userId: currentUserId,
                    amount: amount,
                    type: 'debit',
                    category: 'Utility Bill',
                    title: `Electricity - ${company.toUpperCase()}`,
                    description: `Reference: ${billId}`,
                    status: 'success',
                    referenceId: billId,
                    timestamp: serverTimestamp()
                });
            });
            notifySuccess("Bill Paid!");
            router.push('/dashboard');
        } catch (err: any) { 
            notifyError(err.message === "INSUFFICIENT_BALANCE" ? "Insufficient Balance!" : "Failed!");
        } finally { setLoading(false); }
    };

    return (
        <div style={{ backgroundColor: '#000D1A', minHeight: '100vh', color: '#FFFFFF' }}>
            <LayoutShell headerTitle="Electricity Bill" showBack>
                <div style={{ padding: '20px', maxWidth: '450px', margin: '0 auto' }}>
                    
                    {/* Professional Dropdown */}
                    <div style={{ marginBottom: '20px' }}>
                        <p style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '8px' }}>Select Distribution Company</p>
                        <div style={{ position: 'relative' }}>
                            <div 
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                style={{ background: '#0a1622', padding: '16px 20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                            >
                                <span>{company ? COMPANIES.find(c => c.id === company)?.name : "Choose Provider"}</span>
                                <ChevronDown size={20} style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: '0.3s' }} />
                            </div>

                            {isDropdownOpen && (
                                <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, background: '#0a1622', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', zIndex: 10, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                                    {COMPANIES.map((c) => (
                                        <div 
                                            key={c.id} 
                                            onClick={() => { setCompany(c.id); setIsDropdownOpen(false); }}
                                            style={{ padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: '0.2s', backgroundColor: company === c.id ? '#4CAF5022' : 'transparent' }}
                                        >
                                            {c.name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Reference ID */}
                    <div style={{ marginBottom: '20px' }}>
                        <p style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '8px' }}>Reference Number</p>
                        <div style={{ background: '#0a1622', padding: '18px 20px', borderRadius: '16px', border: billId.length === 14 ? '1px solid #4CAF50' : '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Zap size={22} color={billId.length === 14 ? "#4CAF50" : "#9CA3AF"} />
                            <input 
                                type="text" value={billId} onChange={handleIdChange} placeholder="Enter 14 digits"
                                style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: '16px' }}
                            />
                            {billId.length === 14 && <CheckCircle2 size={18} color="#4CAF50" />}
                        </div>
                    </div>

                    {/* Auto-Fetched Amount Card */}
                    <div style={{ background: 'linear-gradient(135deg, #0a1622 0%, #001a0a 100%)', padding: '25px', borderRadius: '24px', border: '1px solid rgba(76, 175, 80, 0.2)', textAlign: 'center', marginBottom: '30px', minHeight: '140px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        {amount !== null ? (
                            <>
                                <p style={{ fontSize: '12px', color: '#4CAF50', fontWeight: 'bold' }}>PAYABLE AMOUNT</p>
                                <h2 style={{ fontSize: '42px', fontWeight: '800', color: '#FFFFFF', margin: '5px 0' }}>Rs. {amount.toLocaleString()}</h2>
                                <p style={{ fontSize: '11px', color: '#9CA3AF' }}>Due Date: 28 Apr 2026</p>
                            </>
                        ) : (
                            <p style={{ color: '#6B7280', fontSize: '14px' }}>Enter a valid reference number to fetch bill details</p>
                        )}
                    </div>

                    <button 
                        onClick={handleInitialSubmit} disabled={loading || !amount}
                        style={{ width: '100%', padding: '20px', borderRadius: '18px', background: !amount ? '#1e293b' : 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
                    >
                        {loading ? <Loader2 className="animate-spin mx-auto" /> : "Confirm Payment"}
                    </button>
                </div>

                {/* Password Modal */}
                {showPassModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, backdropFilter: 'blur(10px)' }}>
                        <div style={{ background: '#0a1622', width: '90%', maxWidth: '400px', padding: '30px', borderRadius: '28px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                            <ShieldCheck size={48} color="#4CAF50" style={{ margin: '0 auto 15px' }} />
                            <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>Security Check</h3>
                            <p style={{ color: '#9CA3AF', fontSize: '13px', marginTop: '5px' }}>Paying <b>Rs. {amount}</b> to <b>{company.toUpperCase()}</b></p>
                            <input 
                                type="password" placeholder="Enter Password" value={password} onChange={(e) => setPassword(e.target.value)}
                                style={{ width: '100%', padding: '15px', borderRadius: '12px', background: '#112233', border: '1px solid #334455', color: 'white', margin: '20px 0', outline: 'none' }}
                                autoFocus
                            />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => setShowPassModal(false)} style={{ flex: 1, padding: '12px', background: '#1e293b', borderRadius: '12px', color: 'white', border: 'none' }}>Cancel</button>
                                <button onClick={handleSecurityVerify} disabled={verifying} style={{ flex: 2, padding: '12px', background: '#4CAF50', borderRadius: '12px', color: 'white', fontWeight: 'bold', border: 'none' }}>
                                    {verifying ? "Verifying..." : "Pay Now"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </LayoutShell>
        </div>
    );
}

export default function ElectricityPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-[#000D1A]"><Loader2 className="animate-spin text-green-500" size={40}/></div>}>
      <BillPaymentContent />
    </Suspense>
  );
}