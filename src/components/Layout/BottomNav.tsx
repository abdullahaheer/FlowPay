import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './BottomNav.module.css';

const navItems = [
    { label: 'Home', icon: '🏠', href: '/dashboard' },
    { label: 'Cards', icon: '💳', href: '/cards' },
    { label: 'More', icon: '⋮⋮', href: '/more' },
];
export const BottomNav: React.FC = () => {
    const pathname = usePathname();
    return (
        <nav className={styles.nav}>
            <ul className={styles.navList}>
                {navItems.map((item) => (
                    <li key={item.href} className={styles.navItem}>
                        <Link href={item.href} className={`${styles.navLink} ${pathname === item.href ? styles.active : ''}`}>
                            <span className={styles.icon}>{item.icon}</span>
                            <span className={styles.label}>{item.label}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    );
};
