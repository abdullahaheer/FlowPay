"use client";
import React, { useState } from 'react';
import { LayoutShell } from '@/components/Layout/LayoutShell';
import { db, auth } from '@/lib/firebase';
import { doc, runTransaction, collection, serverTimestamp } from 'firebase/firestore';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { Search, ChevronRight, Loader2, Lock, X } from 'lucide-react';
import toast from 'react-hot-toast';

const ALL_BANKS = [
    // Digital Wallets / Microfinance (The "Vaults")
    { id: '1', name: 'JazzCash', short: 'JazzCash', color: '#ed1c24' },
    { id: '2', name: 'EasyPaisa', short: 'EasyPaisa', color: '#39b54a' },
    { id: '3', name: 'SadaPay', short: 'SadaPay', color: '#ff4b4b' },
    { id: '4', name: 'NayaPay', short: 'NayaPay', color: '#ff8a00' },
    { id: '5', name: 'Finja', short: 'Finja', color: '#00d084' },
    { id: '6', name: 'Keenu', short: 'Keenu', color: '#00a3e0' },

    // Top Tier Commercial Banks
    { id: '7', name: 'Habib Bank Limited', short: 'HBL', color: '#008269' },
    { id: '8', name: 'United Bank Limited', short: 'UBL', color: '#004a99' },
    { id: '9', name: 'Meezan Bank', short: 'Meezan', color: '#870230' },
    { id: '10', name: 'MCB Bank Limited', short: 'MCB', color: '#005596' },
    { id: '11', name: 'Allied Bank Limited', short: 'ABL', color: '#004b91' },
    { id: '12', name: 'National Bank of Pakistan', short: 'NBP', color: '#006a33' },
    { id: '13', name: 'Bank Alfalah', short: 'Alfalah', color: '#bf2d35' },
    { id: '14', name: 'Askari Bank', short: 'AKBL', color: '#1d428a' },
    { id: '15', name: 'Bank Al Habib', short: 'BAHL', color: '#005a3c' },
    { id: '16', name: 'Faysal Bank', short: 'Faysal', color: '#911d30' },
    { id: '17', name: 'JS Bank', short: 'JS Bank', color: '#2b3990' },
    { id: '18', name: 'Standard Chartered', short: 'SCB', color: '#00a546' },
    { id: '19', name: 'Dubai Islamic Bank', short: 'DIB', color: '#9a7c45' },
    { id: '20', name: 'Bank of Punjab', short: 'BOP', color: '#ed1c24' },
    { id: '21', name: 'Al Baraka Bank', short: 'Al Baraka', color: '#9e7b4f' },
    { id: '22', name: 'Habib Metropolitan Bank', short: 'Metro', color: '#004a99' },
    { id: '23', name: 'BankIslami Pakistan', short: 'BankIslami', color: '#8b1d41' },
    { id: '24', name: 'Summit Bank', short: 'Summit', color: '#ee3124' },
    { id: '25', name: 'Soneri Bank', short: 'Soneri', color: '#2c3e50' },
    { id: '26', name: 'Silk Bank', short: 'Silk', color: '#ed1c24' },
    { id: '27', name: 'Sindh Bank', short: 'Sindh', color: '#006a33' },
];

export default function BankTransferPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBank, setSelectedBank] = useState<typeof ALL_BANKS[0] | null>(null);
    const [accountNumber, setAccountNumber] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [view, setView] = useState<'list' | 'details'>('list');
    
    // Password Verification States
    const [showPassModal, setShowPassModal] = useState(false);
    const [password, setPassword] = useState('');
    const [verifying, setVerifying] = useState(false);

    const filteredBanks = ALL_BANKS.filter(b => 
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        b.short.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 1. Account Number Validation logic
    const handleAccountChange = (val: string) => {
        if (val.length <= 24) setAccountNumber(val);
    };

    const isButtonDisabled = accountNumber.length < 11 || !amount || loading;

    // 2. Step 1: Trigger Password Modal
    const initiateTransfer = (e: React.FormEvent) => {
        e.preventDefault();
        setShowPassModal(true);
    };

    // 3. Step 2: Final Verification & Transaction
    const handleFinalVerify = async () => {
        const user = auth.currentUser;
        if (!user || !user.email) return;

        setVerifying(true);
        try {
            // Re-authenticate user with their login password
            const credential = EmailAuthProvider.credential(user.email, password);
            await reauthenticateWithCredential(user, credential);

            // If success, run the transaction
            await executeTransaction();
            
            setShowPassModal(false);
            setPassword('');
        } catch  {
            toast.error("Incorrect password. Please try again.");
        } finally {
            setVerifying(false);
        }
    };

    const executeTransaction = async () => {
        setLoading(true);
        try {
            await runTransaction(db, async (transaction) => {
                const userRef = doc(db, "users", auth.currentUser!.uid);
                const userSnap = await transaction.get(userRef);
                const currentBalance = userSnap.data()?.balance || 0;
                const transferAmount = parseFloat(amount);

                if (currentBalance < transferAmount) throw new Error("Insufficient Balance");

                transaction.update(userRef, { balance: currentBalance - transferAmount });

                const notifRef = doc(collection(db, "notifications"));
                transaction.set(notifRef, {
                    userId: auth.currentUser!.uid,
                    title: "Bank Transfer Sent",
                    message: `Rs. ${transferAmount} sent to ${selectedBank?.short}`,
                    type: 'transfer',
                    read: false,
                    timestamp: serverTimestamp()
                });
            });

            toast.success("Payment Sent Successfully!");
            setView('list');
            setAmount(''); setAccountNumber('');
        } catch  {
            toast.error("Transaction Failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <LayoutShell headerTitle={view === 'list' ? "Select Bank" : "Transfer Details"} showBack>
            <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', color: 'white' }}>
                
                {view === 'list' ? (
                    <>
                        <div style={{ position: 'relative', marginBottom: '25px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '15px', top: '15px', color: '#9CA3AF' }} />
                            <input 
                                type="text"
                                placeholder="Search bank name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ width: '100%', padding: '15px 15px 15px 45px', borderRadius: '15px', background: '#0a1622', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {filteredBanks.map(bank => (
                                <div key={bank.id} onClick={() => { setSelectedBank(bank); setView('details'); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#0a1622', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: bank.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{bank.short[0]}</div>
                                        <p style={{ margin: 0, fontWeight: '600' }}>{bank.name}</p>
                                    </div>
                                    <ChevronRight size={18} color="#4b5563" />
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div style={{ animation: 'fadeIn 0.3s ease-in' }}>
                        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                            <div style={{ width: '70px', height: '70px', borderRadius: '20px', background: selectedBank?.color, margin: '0 auto 15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold' }}>{selectedBank?.short[0]}</div>
                            <h2 style={{ fontSize: '20px', margin: 0 }}>{selectedBank?.name}</h2>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ fontSize: '12px', color: '#9CA3AF' }}>Account Number / IBAN (11-24 Digits)</label>
                                <input 
                                    type="text"
                                    placeholder="Enter digits"
                                    value={accountNumber}
                                    onChange={(e) => handleAccountChange(e.target.value)}
                                    style={{ width: '100%', padding: '16px', borderRadius: '15px', background: '#0a1622', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', marginTop: '8px' }}
                                />
                                <p style={{ fontSize: '10px', marginTop: '5px', color: accountNumber.length >= 11 ? '#4CAF50' : '#FF4B4B' }}>
                                    {accountNumber.length}/24 characters
                                </p>
                            </div>

                            <div>
                                <label style={{ fontSize: '12px', color: '#9CA3AF' }}>Amount (PKR)</label>
                                <input 
                                    type="number"
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    style={{ width: '100%', padding: '16px', borderRadius: '15px', background: '#0a1622', border: '1px solid rgba(255,255,255,0.1)', color: '#4CAF50', fontSize: '24px', fontWeight: 'bold', outline: 'none', marginTop: '8px' }}
                                />
                            </div>

                            <button 
                                onClick={initiateTransfer}
                                disabled={isButtonDisabled}
                                style={{ width: '100%', padding: '18px', borderRadius: '18px', background: isButtonDisabled ? '#1a2633' : 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)', color: 'white', fontWeight: 'bold', border: 'none', cursor: isButtonDisabled ? 'not-allowed' : 'pointer' }}
                            >
                                Send Money Now
                            </button>
                        </div>
                    </div>
                )}

                {/* --- PASSWORD VERIFICATION MODAL --- */}
                {showPassModal && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}>
                        <div style={{ background: '#0a1622', width: '100%', maxWidth: '400px', padding: '30px', borderRadius: '25px', border: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
                            <button onClick={() => setShowPassModal(false)} style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', color: '#9CA3AF' }}><X size={20}/></button>
                            
                            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                <div style={{ background: 'rgba(76,175,80,0.1)', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
                                    <Lock color="#4CAF50" size={24} />
                                </div>
                                <h3 style={{ margin: 0 }}>Verify Identity</h3>
                                <p style={{ fontSize: '13px', color: '#9CA3AF' }}>Enter your login password to confirm Rs. {amount} transfer.</p>
                            </div>

                            <input 
                                type="password"
                                placeholder="Enter Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ width: '100%', padding: '15px', borderRadius: '12px', background: '#112233', border: '1px solid rgba(255,255,255,0.1)', color: 'white', marginBottom: '20px', outline: 'none' }}
                            />

                            <button 
                                onClick={handleFinalVerify}
                                disabled={verifying || !password}
                                style={{ width: '100%', padding: '15px', borderRadius: '12px', background: '#4CAF50', color: 'white', border: 'none', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                            >
                                {verifying ? <Loader2 className="animate-spin" size={20} /> : "Confirm & Send"}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </LayoutShell>
    );
}