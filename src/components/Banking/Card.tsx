import React from 'react';
import styles from './Card.module.css';

export const CreditCard: React.FC = () => {
    return (
        <div className={styles.cardContainer}>
            <div className={styles.creditCard}>
                <div className={styles.cardHeader}>
                    <span className={styles.cardType}>Credit Card</span>
                    <div className={styles.cardLogo}>
                        <div className={styles.logoCircle}></div>
                        <div className={`${styles.logoCircle} ${styles.logoCircleOverlay}`}></div>
                    </div>
                </div>
                <div className={styles.cardNumber}>
                    •••• •••• •••• 0329
                </div>
                <div className={styles.cardFooter}>
                    <button className={styles.viewDetails}>View Details</button>
                    <div className={styles.visaText}>VISA</div>
                </div>
            </div>
        </div>
    );
};

const controls = [
    { name: 'Manage Limit', icon: '⚙️' },
    { name: 'Freeze', icon: '❄️' },
    { name: 'Card Setting', icon: '🔧' },
];

export const CardControls: React.FC = () => {
    return (
        <div className={styles.controlsGrid}>
            {controls.map((control, index) => (
                <div key={index} className={styles.controlItem}>
                    <div className={styles.controlIcon}>{control.icon}</div>
                    <span className={styles.controlName}>{control.name}</span>
                </div>
            ))}
        </div>
    );
};

export const CardActions: React.FC = () => {
    return (
        <div className={styles.actionsList}>
            <div className={styles.actionRow}>
                <span className={styles.rowIcon}>📇</span>
                <span>Request Physical Card</span>
            </div>
            <div className={styles.actionRow}>
                <span className={styles.rowIcon}>🔢</span>
                <span>Change PIN</span>
            </div>
            <div className={styles.actionRow}>
                <span className={styles.rowIcon}>🛡️</span>
                <span>Card Control</span>
                <span className={styles.arrow}>›</span>
            </div>
            <div className={styles.actionRow}>
                <span className={styles.rowIcon}>🎁</span>
                <span>Card Benefits</span>
                <span className={styles.arrow}>›</span>
            </div>

            <button className={styles.appleWalletBtn}>
                Add to Apple Wallet
            </button>
        </div>
    );
};
