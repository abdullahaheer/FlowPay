'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './Dashboard.module.css';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import toast from 'react-hot-toast';

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
                            name: data.name,
                            balance: data.balance,
                            accountNumber: data.accountNumber
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
        toast.success("Account Number Copied!");
    };

    return (
        <div className={styles.balanceSection}>
            <div className={styles.balanceHeader}>
                <div onClick={copyAccountNumber} style={{ cursor: 'pointer' }}>
                    <span className={styles.balanceLabel}>Hi, {userData.name}</span>
                    <p style={{ fontSize: '12px', margin: 0, opacity: 0.8 }}>ID: {userData.accountNumber} 📋</p>
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
                <div className={styles.actionItem} onClick={() => toast("Top-up via Card coming soon!")}>
                    <div className={styles.actionIcon}>+</div>
                    <span>Add money</span>
                </div>
                
                <Link href="/transactions" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className={styles.actionItem}>
                        <div className={styles.actionIcon}>⇄</div>
                        <span>Transactions</span>
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

const services = [
    { name: 'Transfer to contact', icon: '👤', href: '/transfers', active: true },
    { name: 'International transfer', icon: '🌐', href: '#', active: false },
    { name: 'Request money', icon: '💰', href: '#', active: false },
    { name: 'Local bank transfer', icon: '🏦', href: '/bank-transfer', active: true },
    { name: 'Domestic labor salaries', icon: '👷', href: '#', active: false },
    { name: 'Quittah (money split)', icon: '➗', href: '#', active: false },
];

export const ServicesGrid: React.FC = () => {
    return (
        <div className={styles.servicesSection}>
            <h2 className={styles.sectionTitle}>Services</h2>
            <div className={styles.servicesGrid}>
                {services.map((service, index) => {
                    const content = (
                        <div key={index} 
                             className={`${styles.serviceItem} glass`} 
                             onClick={() => !service.active && toast("Coming Soon!")}>
                            <div className={styles.serviceIcon}>{service.icon}</div>
                            <span className={styles.serviceName}>{service.name}</span>
                        </div>
                    );

                    if (service.active && service.href) {
                        return (
                            <Link href={service.href} key={index} style={{ textDecoration: 'none' }}>
                                {content}
                            </Link>
                        );
                    }

                    return content;
                })}
            </div>
        </div>
    );
};

export const PromoBanner: React.FC = () => {
    return (
        <div className={styles.promoBanner} onClick={() => toast("No active challenges right now!")}>
            <div className={styles.promoText}>
                Complete challenges to receive CASH Gifts!
            </div>
            <div className={styles.promoIcon}>🎁</div>
        </div>
    );
};