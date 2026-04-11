"use client";

import React, { useEffect, useState } from 'react';
import { LayoutShell } from '@/components/Layout/LayoutShell';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Image from 'next/image';
import { 
  Loader2, 
  Wallet,
  Phone,
  MapPin,
  Calendar,
  IdCard,
  ShieldCheck,
  CircleUserRound,
  Mail
} from 'lucide-react';

interface UserData {
    name: string;
    email: string;
    balance: number;
    accountNumber: string;
    phone: string;
    cnic: string;
    city: string;
    dob: string;
}

export default function ProfilePage() {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (user) => {
            if (user) {
                const docRef = doc(db, "users", user.uid);
                const unsubscribeSnap = onSnapshot(docRef, (snap) => {
                    if (snap.exists()) {
                        setUserData(snap.data() as UserData);
                    }
                    setLoading(false);
                });
                return () => unsubscribeSnap();
            } else {
                setLoading(false);
            }
        });
        return () => unsub();
    }, []);

    if (loading) {
        return (
            <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#020617', color: 'white' }}>
                <Loader2 className="animate-spin" size={30} style={{ color: '#22C55E' }} />
            </div>
        );
    }

    if (!userData) return null;

    return (
        // Deep Navy Blue Background (Match theme image)
        <div style={{ backgroundColor: '#0A1A2F', minHeight: '100vh', color: '#FFFFFF', fontFamily: 'sans-serif' }}>
            <LayoutShell headerTitle="Profile Details" showBack>
                <div style={{ padding: '24px', maxWidth: '480px', margin: '0 auto' }}>
                    
                    {/* --- HEADER LOGO SECTION --- */}
                    <div style={{ 
                        textAlign: 'center', 
                        marginBottom: '32px',
                        background: '#388E3C', // FlowPay Green from image
                        borderRadius: '20px',
                        padding: '16px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                            <Image 
                                src="/logo.png" // Logo from your public path
                                alt="FlowPay Logo" 
                                width={40} 
                                height={40} 
                                style={{ borderRadius: '8px' }}
                            />
                            <h1 style={{ color: 'white', fontSize: '24px', fontWeight: '800', margin: 0 }}>FlowPay</h1>
                        </div>
                    </div>

                   
                    {/* --- FINANCIAL INFORMATION BOX (FlowPay Green) --- */}
                    <div style={{
                        background: 'linear-gradient(135deg, #2D6A4F 0%, #1B4332 100%)', // FlowPay Dark Green gradient
                        padding: '24px',
                        borderRadius: '24px',
                        marginBottom: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        boxShadow: '0 10px 20px rgba(0,0,0,0.3)'
                    }}>
                        <div>
                            {/* White Text */}
                            <p style={{ fontSize: '12px', color: '#A7C957', fontWeight: '600', textTransform: 'uppercase', marginBottom: '8px' }}>AVAILABLE FUNDS</p>
                            <h3 style={{ fontSize: '30px', fontWeight: '900', margin: 0, color: '#FFFFFF' }}>
                                <span style={{ fontSize: '18px', color: '#D8E2DC', fontWeight: '400', marginRight: '4px' }}>PKR</span>
                                {userData.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </h3>
                        </div>
                        <Wallet size={35} style={{ color: '#FFFFFF', opacity: 0.6 }} />
                    </div>

                    {/* --- DETAILED INFORMATION LIST (Pure Dark Theme) --- */}
                    <p style={{ fontSize: '14px', fontWeight: '700', color: '#A3B18A', marginBottom: '16px', marginLeft: '6px' }}>ACCOUNT INFORMATION</p>
                    
                    <div style={{ 
                        background: '#0A2540', // Darker navy blue box from image services
                        borderRadius: '24px', 
                        padding: '8px',
                        border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                        {/* DetailRow has only white text and green icon backgrounds */}
                       <DetailRow icon={<CircleUserRound size={18}/>} label="Legal Name" value={userData.name} />
    
    {/* --- Added Email Row --- */}
    <DetailRow icon={<Mail size={18}/>} label="Email Address" value={userData.email} />
    
    <DetailRow icon={<Phone size={18}/>} label="Mobile Number" value={userData.phone || "---"} />
    <DetailRow icon={<IdCard size={18}/>} label="CNIC Number" value={userData.cnic || "---"} />
    <DetailRow icon={<MapPin size={18}/>} label="City" value={userData.city || "---"} />
    <DetailRow icon={<Calendar size={18}/>} label="Date of Birth" value={userData.dob || "---"} />
    <DetailRow icon={<ShieldCheck size={18}/>} label="Account Status" value="LEVEL 1 VERIFIED" isLast />
                    </div>

                </div>
            </LayoutShell>
        </div>
    );
}

// --- Detailed Row Component (White Text Only) ---
function DetailRow({ icon, label, value, isLast }: { icon: React.ReactNode, label: string, value: string, isLast?: boolean }) {
    return (
        <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            padding: '16px 15px', 
            borderBottom: isLast ? 'none' : '1px solid rgba(255, 255, 255, 0.03)' 
        }}>
            {/* Green Icon Background */}
            <div style={{ 
                marginRight: '16px', 
                color: '#66FF66', // Neon Green from image icons
                background: 'rgba(76, 175, 80, 0.15)', 
                padding: '10px', 
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {icon}
            </div>
            <div style={{ flex: 1 }}>
                {/* Gray Label Text */}
                <p style={{ fontSize: '10px', margin: 0, color: '#9CA3AF', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>{label}</p>
                {/* Pure White Text for data */}
                <p style={{ margin: '3px 0 0', fontWeight: '600', fontSize: '14px', color: '#FFFFFF' }}>{value}</p>
            </div>
        </div>
    );
}