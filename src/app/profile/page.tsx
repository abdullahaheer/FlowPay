"use client";
import React, { useEffect, useState } from 'react';
import { LayoutShell } from '@/components/Layout/LayoutShell';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { User, Mail, Hash, ShieldCheck, Eye, EyeOff, Loader2, CreditCard } from 'lucide-react';

interface UserData {
    name: string;
    email: string;
    balance: number;
    accountNumber: string;
    cardDetails: {
        number: string;
        expiry: string;
        cvv: string;
        status: string;
    };
}

export default function ProfilePage() {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [showFullDetails, setShowFullDetails] = useState(false);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (user) => {
            if (user) {
                const docRef = doc(db, "users", user.uid);
                const unsubscribeSnap = onSnapshot(docRef, (snap) => {
                    if (snap.exists()) {
                        setUserData(snap.data() as UserData);
                    }
                });
                return () => unsubscribeSnap();
            }
        });
        return () => unsub();
    }, []);

    if (!userData) return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000D1A', color: 'white' }}>
            <Loader2 className="animate-spin" />
        </div>
    );

    const formatCard = (num: string, show: boolean) => {
        const clean = num.replace(/\s/g, '');
        if (!show) return `••••  ••••  ••••  ${clean.slice(-4)}`;
        return clean.replace(/(\d{4})/g, '$1  ').trim();
    };

    return (
        <div style={{ backgroundColor: '#000D1A', minHeight: '100vh' }}>
            <LayoutShell headerTitle="FlowPay Card" showBack>
                <div style={{ padding: '20px' }}>
                    
                    {/* --- FINAL GREEN CARD DESIGN --- */}
                    <div style={{
                        background: 'linear-gradient(135deg, #0d1d12 0%, #1a3a21 100%)', 
                        borderRadius: '24px',
                        padding: '25px',
                        height: '225px',
                        position: 'relative',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
                        marginBottom: '30px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#FFFFFF',
                        overflow: 'hidden'
                    }}>
                        {/* Top Section: Branding & Type */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '1px', color: '#4CAF50' }}>FlowPay</span>
                                <span style={{ fontSize: '10px', opacity: 0.6 }}>Virtual Debit Card</span>
                            </div>
                            <div style={{ position: 'relative', width: '35px', height: '20px' }}>
                                <div style={{ position: 'absolute', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', left: 0 }}></div>
                                <div style={{ position: 'absolute', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', right: 0 }}></div>
                            </div>
                        </div>

                        {/* Middle Section: Card Number */}
                        <div style={{ 
                            fontSize: '22px', 
                            letterSpacing: '3px', 
                            fontFamily: 'monospace', 
                            fontWeight: 'bold',
                            color: '#FFFFFF',
                            textAlign: 'center',
                            margin: '10px 0'
                        }}>
                            {formatCard(userData.cardDetails.number, showFullDetails)}
                        </div>

                        {/* Bottom Section: Name & Expiry */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '9px', opacity: 0.6, textTransform: 'uppercase' }}>Card Holder</span>
                                <span style={{ fontSize: '14px', fontWeight: '600', letterSpacing: '0.5px' }}>{userData.name.toUpperCase()}</span>
                                
                                <button 
                                    onClick={() => setShowFullDetails(!showFullDetails)}
                                    style={{
                                        background: 'rgba(255,255,255,0.1)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: '#FFFFFF',
                                        padding: '5px 10px',
                                        fontSize: '10px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        marginTop: '10px',
                                        width: 'fit-content'
                                    }}
                                >
                                    {showFullDetails ? <EyeOff size={12} /> : <Eye size={12} />}
                                    {showFullDetails ? "Hide Details" : "View Details"}
                                </button>
                            </div>

                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                    <span style={{ fontSize: '8px', opacity: 0.6 }}>EXPIRY</span>
                                    <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{userData.cardDetails.expiry}</span>
                                </div>
                                <span style={{ fontStyle: 'italic', fontWeight: '900', fontSize: '20px' }}>VISA</span>
                            </div>
                        </div>
                    </div>

                    {/* --- DETAILS LIST --- */}
                    <div style={{ 
                        background: '#0a1622', 
                        borderRadius: '24px', 
                        padding: '8px',
                        border: '1px solid rgba(255,255,255,0.05)' 
                    }}>
                        <DetailRow icon={<User size={18}/>} label="Full Name" value={userData.name} />
                        <DetailRow icon={<Hash size={18}/>} label="FlowPay ID" value={userData.accountNumber} />
                        <DetailRow icon={<CreditCard size={18}/>} label="Wallet Balance" value={`${userData.balance.toLocaleString()} PKR`} />
                        
                        {showFullDetails && (
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '5px', paddingTop: '5px' }}>
                                <DetailRow icon={<ShieldCheck size={18}/>} label="CVV Security Code" value={userData.cardDetails.cvv} />
                                <DetailRow icon={<Mail size={18}/>} label="Registered Email" value={userData.email} />
                            </div>
                        )}
                    </div>
                </div>
            </LayoutShell>
        </div>
    );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', padding: '18px 15px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
            <div style={{ marginRight: '15px', color: '#4CAF50', background: 'rgba(76, 175, 80, 0.1)', padding: '10px', borderRadius: '12px' }}>
                {icon}
            </div>
            <div style={{ flex: 1 }}>
                <p style={{ fontSize: '10px', margin: 0, color: '#6B7280', textTransform: 'uppercase', fontWeight: 'bold' }}>{label}</p>
                <p style={{ margin: '2px 0 0', fontWeight: '500', fontSize: '15px', color: '#FFFFFF' }}>{value}</p>
            </div>
        </div>
    );
}