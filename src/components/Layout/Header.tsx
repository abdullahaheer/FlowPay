import React from 'react';
import styles from './Header.module.css';

interface HeaderProps {
    title?: string;
    showBack?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ title, showBack }) => {
    return (
        <header className={styles.header}>
            <div className={styles.left}>
                {showBack ? (
                    <button className={styles.iconButton} onClick={() => window.history.back()}>
                        <span>←</span>
                    </button>
                ) : (
                    <div className={styles.profile}>
                        <span className={styles.profileIcon}>👤</span>
                    </div>
                )}
            </div>
            <div className={styles.center}>
                {title && <h1 className={styles.title}>{title}</h1>}
            </div>
            <div className={styles.right}>
                {!showBack && (
                    <button className={styles.iconButton}>
                        <span>🔔</span>
                    </button>
                )}
            </div>
        </header>
    );
};
