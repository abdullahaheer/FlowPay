'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './Dashboard.module.css';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import toast from 'react-hot-toast';

// --- BALANCE CARD COMPONENT ---
export const BalanceCard: React.FC = () => {
    const [showBalance, setShowBalance] = useState(true);
    const [userData, setUserData] = useState({
        name: 'Loading...',
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
        toast.success("Account ID Copied!", {
            style: { background: '#333', color: '#fff', borderRadius: '10px' }
        });
    };

    return (
        <div className={styles.balanceSection}>
            <div className={styles.balanceHeader}>
                <div onClick={copyAccountNumber} style={{ cursor: 'pointer' }}>
                    <span className={styles.balanceLabel}>Hi, {userData.name}</span>
                    <p style={{ fontSize: '11px', margin: '2px 0 0 0', opacity: 0.7, letterSpacing: '0.5px' }}>
                        ID: {userData.accountNumber} 📋
                    </p>
                </div>
                <button onClick={() => setShowBalance(!showBalance)} className={styles.eyeIcon}>
                    {showBalance ? '👁️' : '🙈'}
                </button>
            </div>

            <div className={styles.balanceAmount}>
                {showBalance ?
                    userData.balance.toLocaleString('en-US', { minimumFractionDigits: 2 }) :
                    '••••••'
                } <span className={styles.currency}>PKR</span>
            </div>

            <div className={styles.quickActions}>
                <Link href="/add-money" style={{ textDecoration: 'none', color: 'inherit', flex: 1 }}>
                    <div className={styles.actionItem}>
                        <div className={styles.actionIcon}>+</div>
                        <span>Add money</span>
                    </div>
                </Link>

                <Link href="/transactions" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className={styles.actionItem}>
                        <div className={styles.actionIcon}>⇄</div>
                        <span>History</span>
                    </div>
                </Link>

                <Link href="/profile" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className={styles.actionItem}>
                        <div className={styles.actionIcon}>👤</div>
                        <span>Account</span>
                    </div>
                </Link>
            </div>
        </div>
    );
};

// --- SERVICES GRID COMPONENT (Dark Background Tiles) ---
const services = [
    {
        name: 'FlowPay Transfer',
        icon: '👤',
        href: '/transfers',
        desc: 'Send to FlowPay users'
    },
    {
        name: 'Request Money',
        icon: '💰',
        href: '/request-money',
        desc: 'Ask for payment'
    },
    {
        name: 'Bank Transfer',
        icon: '🏦',
        href: '/bank-transfer',
        desc: 'Send to local banks'
    },
];

export const ServicesGrid: React.FC = () => {
    return (
        <div className={styles.servicesSection}>
            <h2 className={styles.sectionTitle}>Main Services</h2>
            <div className={styles.servicesGrid}>
                {services.map((service, index) => (
                    <Link href={service.href} key={index} style={{ textDecoration: 'none' }}>
                        {/* updated styles for dark background/green theme */}
                        <div className={styles.serviceItem}>
                            <div className={styles.serviceIcon}>{service.icon}</div>
                            <div className={styles.serviceInfo}>
                                <span className={styles.serviceName}>{service.name}</span>
                                <span style={{ fontSize: '11px', color: '#9CA3AF', display: 'block', marginTop: '4px' }}>
                                    {service.desc}
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

// --- PROMO BANNER ---
export const PromoBanner: React.FC = () => {
    return (
        <div className={styles.promoBanner} onClick={() => toast("Coming Soon: Win CASH Gifts!")}>
            <div className={styles.promoText}>
                Complete challenges to receive <b>CASH Gifts!</b>
            </div>
            <div className={styles.promoIcon}>🎁</div>
        </div>
    );
};