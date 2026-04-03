'use client';

import React from 'react';
import Link from 'next/link';
import styles from './Dashboard.module.css';
import { Button } from '@/components/UI/Button';

export const BalanceCard: React.FC = () => {
    const [showBalance, setShowBalance] = React.useState(true);

    return (
        <div className={styles.balanceSection}>
            <div className={styles.balanceHeader}>
                <span className={styles.balanceLabel}>Total Balance</span>
                <button onClick={() => setShowBalance(!showBalance)} className={styles.eyeIcon}>
                    {showBalance ? '👁️' : '🙈'}
                </button>
            </div>
            <div className={styles.balanceAmount}>
                {showBalance ? '1099.25' : '••••••'} <span className={styles.currency}>PKR</span>
            </div>
            <div className={styles.quickActions}>
                <div className={styles.actionItem}>
                    <div className={styles.actionIcon}>+</div>
                    <span>Add money</span>
                </div>
                <div className={styles.actionItem}>
                    <div className={styles.actionIcon}>⇄</div>
                    <span>Transactions</span>
                </div>
                <div className={styles.actionItem}>
                    <div className={styles.actionIcon}>👤</div>
                    <span>Account</span>
                </div>
            </div>
        </div>
    );
};

const services = [
    { name: 'Transfer to contact', icon: '👤', href: '/transfer' },
    { name: 'International transfer', icon: '🌐' },
    { name: 'Request money', icon: '💰' },
    { name: 'Local bank transfer', icon: '🏦' },
    { name: 'Domestic labor salaries', icon: '👷' },
    { name: 'Quittah (money split)', icon: '➗' },
];

export const ServicesGrid: React.FC = () => {
    return (
        <div className={styles.servicesSection}>
            <h2 className={styles.sectionTitle}>Services</h2>
            <div className={styles.servicesGrid}>
                {services.map((service, index) => {
                    const content = (
                        <div key={index} className={`${styles.serviceItem} glass`}>
                            <div className={styles.serviceIcon}>{service.icon}</div>
                            <span className={styles.serviceName}>{service.name}</span>
                        </div>
                    );

                    if (service.href) {
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
        <div className={styles.promoBanner}>
            <div className={styles.promoText}>
                Complete challenges to receive CASH Gifts!
            </div>
            <div className={styles.promoIcon}>🎁</div>
        </div>
    );
};
