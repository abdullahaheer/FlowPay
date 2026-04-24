"use client";
import React, { useState, Suspense } from 'react';
import { LayoutShell } from '@/components/Layout/LayoutShell';
import { db, auth } from '@/lib/firebase';
import { doc, runTransaction, serverTimestamp, collection } from 'firebase/firestore';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Loader2, ShieldCheck, Smartphone, Info } from 'lucide-react';

interface Bundle {
    id: string;
    name: string;
    data: string;
    mins: string;
    price: number;
    validity: string;
}

interface BundleData {
    Jazz: Bundle[];
    Zong: Bundle[];
    Telenor: Bundle[];
    Ufone: Bundle[];
}

const BUNDLE_DATA: BundleData = {
    Jazz: [
        { id: 'j1', name: 'Weekly Mega', data: '7GB', mins: '5000', price: 285, validity: '7 Days' },
        { id: 'j2', name: 'Monthly Premium', data: '25GB', mins: '3000', price: 830, validity: '30 Days' },
        { id: 'j3', name: 'Daily Social', data: '500MB', mins: '0', price: 30, validity: '1 Day' },
        { id: 'j4', name: 'Weekly YouTube', data: '5GB', mins: '0', price: 150, validity: '7 Days' },
        { id: 'j5', name: 'Monthly Max', data: '40GB', mins: '10000', price: 1200, validity: '30 Days' },
        { id: 'j6', name: 'Weekly Hybrid', data: '1GB', mins: '1000', price: 180, validity: '7 Days' },
        { id: 'j7', name: 'Monthly Social', data: '10GB', mins: '0', price: 200, validity: '30 Days' },
        { id: 'j8', name: 'Daily Extreme', data: '2GB', mins: '0', price: 40, validity: '1 Day' },
        { id: 'j9', name: 'Weekly Extreme', data: '25GB', mins: '0', price: 450, validity: '7 Days' },
        { id: 'j10', name: '3-Day Max', data: '1GB', mins: '100', price: 90, validity: '3 Days' },
    ],
    Zong: [
        { id: 'z1', name: 'Weekly Pro', data: '20GB', mins: '5000', price: 390, validity: '7 Days' },
        { id: 'z2', name: 'Monthly Digital', data: '60GB', mins: '10000', price: 1400, validity: '30 Days' },
        { id: 'z3', name: 'Daily Data', data: '1GB', mins: '0', price: 35, validity: '1 Day' },
        { id: 'z4', name: 'Weekly Social', data: '8GB', mins: '0', price: 220, validity: '7 Days' },
        { id: 'z5', name: 'Monthly Premium', data: '30GB', mins: '500', price: 950, validity: '30 Days' },
        { id: 'z6', name: 'Stay at Home', data: '10GB', mins: '1000', price: 250, validity: '7 Days' },
        { id: 'z7', name: 'Super Weekly', data: '4GB', mins: '0', price: 200, validity: '7 Days' },
        { id: 'z8', name: 'Monthly Social Plus', data: '12GB', mins: '0', price: 280, validity: '30 Days' },
        { id: 'z9', name: 'Daily SMS+Data', data: '500MB', mins: '0', price: 25, validity: '1 Day' },
        { id: 'z10', name: 'Zong 6 Month', data: '100GB', mins: '0', price: 5000, validity: '180 Days' },
    ],
    Telenor: [
        { id: 't1', name: 'Weekly Ultra', data: '12GB', mins: '0', price: 320, validity: '7 Days' },
        { id: 't2', name: 'Monthly Extreme', data: '40GB', mins: '7000', price: 900, validity: '30 Days' },
        { id: 't3', name: 'Daily Offpeak', data: '1.5GB', mins: '0', price: 25, validity: '1 Day' },
        { id: 't4', name: 'Weekly Budget', data: '3GB', mins: '500', price: 160, validity: '7 Days' },
        { id: 't5', name: 'Monthly Social', data: '8GB', mins: '0', price: 180, validity: '30 Days' },
        { id: 't6', name: '4G Weekly', data: '7GB', mins: '0', price: 240, validity: '7 Days' },
        { id: 't7', name: 'EasyCard 850', data: '15GB', mins: '5000', price: 850, validity: '30 Days' },
        { id: 't8', name: 'Weekly YouTube', data: '5GB', mins: '0', price: 140, validity: '7 Days' },
        { id: 't9', name: 'Monthly Starter', data: '4GB', mins: '2000', price: 550, validity: '30 Days' },
        { id: 't10', name: 'Daily Social', data: '50MB', mins: '0', price: 5, validity: '1 Day' },
    ],
    Ufone: [
        { id: 'u1', name: 'Weekly Super Plus', data: '10GB', mins: '5000', price: 340, validity: '7 Days' },
        { id: 'u2', name: 'Monthly Super Card', data: '20GB', mins: '6000', price: 999, validity: '30 Days' },
        { id: 'u3', name: 'Daily Light', data: '1GB', mins: '0', price: 30, validity: '1 Day' },
        { id: 'u4', name: 'Weekly Video', data: '5GB', mins: '0', price: 150, validity: '7 Days' },
        { id: 'u5', name: 'Monthly Digital', data: '30GB', mins: '1000', price: 850, validity: '30 Days' },
        { id: 'u6', name: 'Social Weekly', data: '6GB', mins: '0', price: 190, validity: '7 Days' },
        { id: 'u7', name: 'Weekly Heavy', data: '15GB', mins: '0', price: 380, validity: '7 Days' },
        { id: 'u8', name: 'Super Card Gold', data: '50GB', mins: '10000', price: 1200, validity: '30 Days' },
        { id: 'u9', name: 'Daily WhatsApp', data: '200MB', mins: '0', price: 10, validity: '1 Day' },
        { id: 'u10', name: 'Weekly Gaming', data: '8GB', mins: '0', price: 210, validity: '7 Days' },
    ]
};

function BundleContent() {
    const [selectedSim, setSelectedSim] = useState<keyof BundleData>('Jazz');
    const [phoneSuffix, setPhoneSuffix] = useState<string>(''); // User enters only the remaining 9 digits
    const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);
    
    const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
    const [showPassModal, setShowPassModal] = useState<boolean>(false);
    const [password, setPassword] = useState<string>('');
    const [verifying, setVerifying] = useState<boolean>(false);

    const router = useRouter();
    const currentUserId = auth.currentUser?.uid;
    const fullNumber = `+92 3${phoneSuffix}`;

    const notifyError = (msg: string) => toast.error(msg, { style: { background: '#ff4b4b', color: '#fff' } });
    const notifySuccess = (msg: string) => toast.success(msg, { style: { background: '#4CAF50', color: '#fff' } });

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        // User starts typing after +92 3 (only digits, max 9)
        if (/^\d*$/.test(val) && val.length <= 9) {
            setPhoneSuffix(val);
        }
    };

    const handleBundleClick = (bundle: Bundle) => {
        if (phoneSuffix.length < 9) return notifyError("Please enter a complete mobile number");
        setSelectedBundle(bundle);
        setShowReviewModal(true);
    };

    const proceedToPassword = () => {
        setShowReviewModal(false);
        setShowPassModal(true);
    };

    const handleSecurityVerify = async () => {
        const user = auth.currentUser;
        if (!user || !user.email || !selectedBundle) return;
        setVerifying(true);
        try {
            const credential = EmailAuthProvider.credential(user.email, password);
            await reauthenticateWithCredential(user, credential);
            await executeBundlePurchase();
            setShowPassModal(false);
        } catch { notifyError("Incorrect Security Password!"); } 
        finally { setVerifying(false); }
    };

    const executeBundlePurchase = async () => {
    if (!selectedBundle || !currentUserId) return;
    
    try {
        await runTransaction(db, async (transaction) => {
            const userRef = doc(db, "users", currentUserId);
            const uDoc = await transaction.get(userRef);

            if (!uDoc.exists()) throw new Error("User record not found");
            const currentBalance = uDoc.data().balance || 0;
            
            if (currentBalance < selectedBundle.price) throw new Error("INSUFFICIENT_BALANCE");

            // 1. Update Balance
            transaction.update(userRef, { balance: currentBalance - selectedBundle.price });

            // 2. Add Transaction Record
            const transRef = doc(collection(db, "transactions"));
            transaction.set(transRef, {
                userId: currentUserId,
                amount: selectedBundle.price,
                type: 'debit',
                category: 'Mobile Bundle',
                title: `${selectedSim.toUpperCase()} ${selectedBundle.name}`,
                description: `${selectedBundle.data} Data, ${selectedBundle.mins} Mins, ${selectedBundle.validity}`,
                status: 'success',
                isIncoming: false, // Minus logic for history
                referenceId: fullNumber,
                timestamp: serverTimestamp()
            });

            // 3. Add Notification (NEW PART)
            const notificationRef = doc(collection(db, "notifications"));
            transaction.set(notificationRef, {
                userId: currentUserId,
                title: "Bundle Activated!",
                message: `Your ${selectedSim.toUpperCase()} ${selectedBundle.name} has been activated on ${fullNumber}. Enjoy ${selectedBundle.data} data and ${selectedBundle.mins} minutes.`,
                type: 'package',
                isRead: false,
                timestamp: serverTimestamp()
            });
        });

        notifySuccess(`${selectedBundle.name} Activated!`);
        router.push('/dashboard');
    } catch (err: any) { 
        notifyError(err.message === "INSUFFICIENT_BALANCE" ? "Insufficient Balance!" : "Failed to process"); 
    } finally {
    }
};

    return (
        <div style={{ backgroundColor: '#000D1A', minHeight: '100vh', color: '#FFFFFF' }}>
            <LayoutShell headerTitle="Mobile Bundles" showBack>
                <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
                    
                    {/* Fixed Prefix Phone Input */}
                    <div style={{ marginBottom: '25px' }}>
                        <p style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '10px' }}>Enter Recipient Number</p>
                        <div style={{ background: '#0a1622', padding: '15px 20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Smartphone size={20} color="#4CAF50" style={{marginRight: '8px'}} />
                            <span style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: '18px' }}>+92</span><span style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: '18px' }}>3</span>
                            <input 
                                type="text" 
                                value={phoneSuffix} 
                                onChange={handlePhoneChange} 
                                placeholder="xxxxxxxxx" 
                                style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: '18px', fontWeight: 'bold', letterSpacing: '1px' }} 
                            />
                        </div>
                    </div>

                    {/* Sim Tabs */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '25px', overflowX: 'auto', paddingBottom: '5px' }}>
                        {(Object.keys(BUNDLE_DATA) as Array<keyof BundleData>).map((sim) => (
                            <button key={sim} onClick={() => setSelectedSim(sim)} 
                                style={{ flexShrink: 0, padding: '10px 22px', borderRadius: '12px', border: 'none', background: selectedSim === sim ? '#4CAF50' : '#0a1622', color: 'white', fontWeight: '600', cursor: 'pointer' }}>
                                {sim}
                            </button>
                        ))}
                    </div>

                    {/* Bundle Cards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {BUNDLE_DATA[selectedSim].map((bundle) => (
                            <div key={bundle.id} onClick={() => handleBundleClick(bundle)} 
                                style={{ background: '#0a1622', padding: '18px', borderRadius: '22px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: '0.2s' }}>
                                <div>
                                    <div style={{ fontWeight: '800', fontSize: '15px' }}>{bundle.name}</div>
                                    <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>{bundle.data} • {bundle.validity}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ color: '#4CAF50', fontWeight: 'bold', fontSize: '16px' }}>PKR {bundle.price}</div>
                                    <div style={{ fontSize: '10px', color: '#9CA3AF' }}>Tap to view</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Step 1: Review Detail Modal */}
                {showReviewModal && selectedBundle && (
                    <div style={modalOverlayStyle}>
                        <div style={modalContainerStyle}>
                            <Info size={40} color="#4CAF50" style={{ margin: '0 auto 15px' }} />
                            <h3 style={{ fontSize: '20px', fontWeight: '800' }}>Plan Details</h3>
                            <div style={detailBoxStyle}>
                                <DetailRow label="Bundle" value={selectedBundle.name} />
                                <DetailRow label="Network" value={selectedSim} />
                                <DetailRow label="Number" value={fullNumber} />
                                <DetailRow label="Data" value={selectedBundle.data} />
                                <DetailRow label="Minutes" value={selectedBundle.mins} />
                                <DetailRow label="Validity" value={selectedBundle.validity} />
                                <div style={{ borderTop: '1px solid #1e293b', margin: '10px 0', paddingTop: '10px' }}>
                                    <DetailRow label="Total Payable" value={`PKR ${selectedBundle.price}`} isBold />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                <button onClick={() => setShowReviewModal(false)} style={secondaryBtnStyle}>Back</button>
                                <button onClick={proceedToPassword} style={primaryBtnStyle}>Confirm & Pay</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Password Modal */}
                {showPassModal && (
                    <div style={modalOverlayStyle}>
                        <div style={modalContainerStyle}>
                            <ShieldCheck size={40} color="#4CAF50" style={{ margin: '0 auto 15px' }} />
                            <h3 style={{ fontSize: '20px', fontWeight: '800' }}>Authorize Activation</h3>
                            <p style={{ color: '#9CA3AF', fontSize: '13px', margin: '10px 0' }}>Enter your security password to complete purchase</p>
                            <input 
                                type="password" 
                                placeholder="Enter Password" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)}
                                style={modalInputStyle} 
                                autoFocus 
                            />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => setShowPassModal(false)} style={secondaryBtnStyle}>Cancel</button>
                                <button onClick={handleSecurityVerify} disabled={verifying} style={primaryBtnStyle}>
                                    {verifying ? "Verifying..." : "Verify & Pay"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </LayoutShell>
        </div>
    );
}

// --- Helper Components & Styles ---
const DetailRow = ({ label, value, isBold = false }: { label: string, value: string, isBold?: boolean }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
        <span style={{ color: '#9CA3AF' }}>{label}</span>
        <span style={{ fontWeight: isBold ? '800' : '600', color: isBold ? '#4CAF50' : 'white' }}>{value}</span>
    </div>
);

const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 3000, backdropFilter: 'blur(10px)'
};

const modalContainerStyle: React.CSSProperties = {
    background: '#0a1622', width: '90%', maxWidth: '400px', padding: '30px',
    borderRadius: '30px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center'
};

const detailBoxStyle: React.CSSProperties = {
    background: '#0f1f2e', padding: '20px', borderRadius: '20px', textAlign: 'left', marginTop: '20px'
};

const modalInputStyle: React.CSSProperties = {
    width: '100%', padding: '15px', borderRadius: '15px', background: '#112233',
    border: '1px solid #334455', color: 'white', margin: '15px 0', outline: 'none'
};

const primaryBtnStyle: React.CSSProperties = {
    flex: 2, padding: '14px', background: '#4CAF50', borderRadius: '14px',
    color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer'
};

const secondaryBtnStyle: React.CSSProperties = {
    flex: 1, padding: '14px', background: '#1e293b', borderRadius: '14px',
    color: 'white', border: 'none', cursor: 'pointer'
};

export default function BundlePage() {
    return (
        <Suspense fallback={<div className="h-screen flex items-center justify-center bg-[#000D1A]"><Loader2 className="animate-spin text-green-500" size={40}/></div>}>
            <BundleContent />
        </Suspense>
    );
}