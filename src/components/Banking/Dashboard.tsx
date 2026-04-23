'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './Dashboard.module.css';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, increment, getDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { 
    Eye, EyeOff, Plus, History, User, 
    Car, Smartphone, Zap, Globe, Gift 
} from 'lucide-react';
import toast from 'react-hot-toast';

// --- 1. BALANCE CARD ---
export const BalanceCard = () => {
    const [showBalance, setShowBalance] = useState(true);
    const [userData, setUserData] = useState({
        name: 'User',
        balance: 0,
        accountNumber: 'FLP-0000'
    });

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                const userRef = doc(db, "users", user.uid);
                const unsubscribeDoc = onSnapshot(userRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setUserData({
                            name: data.name || 'User',
                            balance: data.balance || 0,
                            accountNumber: data.accountNumber || 'N/A'
                        });
                    }
                });
                return () => unsubscribeDoc();
            }
        });
        return () => unsubscribeAuth();
    }, []);

    const copyAccountNumber = () => {
        navigator.clipboard.writeText(userData.accountNumber);
        toast.success("Account ID Copied!");
    };

    return (
        <div className={styles.balanceSection}>
            <div className={styles.balanceContent}>
                <div className={styles.balanceInfo}>
                    <div onClick={copyAccountNumber} style={{ cursor: 'pointer' }}>
                        <span className={styles.balanceLabel}>Hi, {userData.name}</span>
                        <p style={{ fontSize: '11px', opacity: 0.7, margin: '2px 0' }}>ID: {userData.accountNumber} 📋</p>
                    </div>
                    <div className={styles.balanceAmountWrapper}>
                        <h1 className={styles.balanceAmount}>
                            {showBalance ? userData.balance.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '••••••'}
                            <span className={styles.currency}>PKR</span>
                        </h1>
                        <button onClick={() => setShowBalance(!showBalance)} className={styles.eyeIcon}>
                            {showBalance ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>

                <div className={styles.quickActions}>
                    <Link href="/add-money" className={styles.actionItem}>
                        <div className={styles.actionIcon}><Plus size={22} /></div>
                        <span>Add Money</span>
                    </Link>
                    <Link href="/transactions" className={styles.actionItem}>
                        <div className={styles.actionIcon}><History size={22} /></div>
                        <span>History</span>
                    </Link>
                    <Link href="/profile" className={styles.actionItem}>
                        <div className={styles.actionIcon}><User size={22} /></div>
                        <span>Account</span>
                    </Link>
                </div>
            </div>
        </div>
    );
};

// --- 2. MAIN SERVICES ---
export const ServicesGrid = () => {
    const mainServices = [
        { name: 'FlowPay Transfer', icon: '👤', href: '/transfers', desc: 'To FlowPay users' },
        { name: 'Request Money', icon: '💰', href: '/request-money', desc: 'Ask for payment' },
        { name: 'Bank Transfer', icon: '🏦', href: '/bank-transfer', desc: 'To local banks' },
    ];

    return (
        <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Main Services</h2>
            <div className={styles.servicesGrid}>
                {mainServices.map((s, i) => (
                    <Link href={s.href} key={i} className={styles.serviceItem}>
                        <span className={styles.serviceIconMain}>{s.icon}</span>
                        <div>
                            <span className={styles.serviceName}>{s.name}</span>
                            <span className={styles.serviceDesc}>{s.desc}</span>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
};

// --- 3. PROMO/GIFT BANNER (WITH 24H LOCK & TIMESTAMP) ---
export const PromoBanner = () => {
    const [isSpinning, setIsSpinning] = useState(false);
    const [timeLeft, setTimeLeft] = useState<string | null>(null);

    const updateTimer = (lastDate: Date) => {
        const now = new Date();
        const diff = now.getTime() - lastDate.getTime();
        const twentyFourHours = 24 * 60 * 60 * 1000;

        if (diff < twentyFourHours) {
            const remaining = twentyFourHours - diff;
            const hours = Math.floor(remaining / (1000 * 60 * 60));
            const mins = Math.floor((remaining / (1000 * 60)) % 60);
            setTimeLeft(`${hours}h ${mins}m remaining`);
        } else {
            setTimeLeft(null);
        }
    };

    useEffect(() => {
        let interval: NodeJS.Timeout;
        const checkStatus = async () => {
            const user = auth.currentUser;
            if (user) {
                const userRef = doc(db, "users", user.uid);
                const snap = await getDoc(userRef);
                if (snap.exists() && snap.data().lastGiftClaimed) {
                    const lastDate = snap.data().lastGiftClaimed.toDate();
                    updateTimer(lastDate);
                    interval = setInterval(() => updateTimer(lastDate), 60000);
                }
            }
        };
        checkStatus();
        return () => clearInterval(interval);
    }, []);

    const claimGift = async () => {
        const user = auth.currentUser;
        if (!user || isSpinning || timeLeft) return;

        setIsSpinning(true);
        const tid = toast.loading("Spinning for gift...");

        try {
            const amount = Math.floor(Math.random() * 9) + 1;
            const userRef = doc(db, "users", user.uid);

            await updateDoc(userRef, {
                balance: increment(amount),
                lastGiftClaimed: Timestamp.now(),
                transactions: arrayUnion({
                    id: `GIFT-${Date.now()}`,
                    type: 'credit',
                    category: 'Cash Gift',
                    title: 'Daily Reward',
                    amount: amount,
                    date: new Date().toISOString(),
                    status: 'Completed'
                })
            });

            toast.success(`Mubarak! Received PKR ${amount}`, { id: tid });
            setTimeLeft("23h 59m remaining");
        } catch {
            toast.error("Failed to claim", { id: tid });
        } finally {
            setIsSpinning(false);
        }
    };

    return (
        <div 
            className={`${styles.promoBanner} ${timeLeft ? styles.disabledBanner : ''}`} 
            onClick={claimGift}
        >
            <div className={styles.promoText}>
                {timeLeft ? (
                    <span>Next gift available in: <br/><b>{timeLeft}</b></span>
                ) : (
                    <span>Tap to spin and win <b>CASH Gifts!</b></span>
                )}
            </div>
            <div className={`${styles.promoIcon} ${isSpinning ? styles.spinAnimation : ''}`}>
                {isSpinning ? '⏳' : (timeLeft ? '🔒' : <Gift size={32} />)}
            </div>
        </div>
    );
};

// --- 4. UTILITIES ---
export const QuickServices = () => {
    const utilityServices = [
        { name: 'M-Tag', icon: <Car size={22} />, href: '/m-tag', desc: ' Recharge', color: '#3b82f6' },
        { name: 'Bundles', icon: <Smartphone size={22} />, href: '/bundles', desc: ' Mobile Data', color: '#8b5cf6' },
        { name: 'Electricity', icon: <Zap size={22} />, href: '/electricity-bills', desc: ' Bill Pay', color: '#f59e0b' },
        { name: 'Internet', icon: <Globe size={22} />, href: '', desc: ' Fiber/4G', color: '#10b981' },
    ];

    return (
        <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Utilities & Top-ups</h2>
            <div className={styles.quickGrid}>
                {utilityServices.map((u, i) => (
                    <Link href={u.href} key={i} className={styles.quickBox}>
                        <div className={styles.quickIcon} style={{color: u.color}}>{u.icon}</div>
                        <div className={styles.quickInfo}>
                            <span className={styles.quickName}>{u.name}</span>
                            <span className={styles.quickDesc}>{u.desc}</span>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
};