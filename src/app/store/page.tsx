import React from 'react';
import { LayoutShell } from '@/components/Layout/LayoutShell';
import styles from './Store.module.css';

const products = [
    { name: 'Apple iPhone 15 Pro', price: '299,000', icon: '📱', tag: 'Hot' },
    { name: 'Sony PlayStation 5', price: '145,000', icon: '🎮', tag: 'Gaming' },
    { name: 'MacBook Air M2', price: '320,000', icon: '💻', tag: 'Best Seller' },
    { name: 'AirPods Pro 2', price: '65,000', icon: '🎧', tag: 'New' },
    { name: 'Samsung S24 Ultra', price: '345,000', icon: '📱', tag: 'Trend' },
    { name: 'Nintendo Switch', price: '85,000', icon: '🕹️', tag: 'Fun' },
];

export default function StorePage() {
    return (
        <LayoutShell headerTitle="Marketplace">
            <div className={styles.grid}>
                {products.map((item, idx) => (
                    <div key={idx} className={styles.itemCard}>
                        <div className={styles.tag}>{item.tag}</div>
                        <div className={styles.imagePlaceholder}>
                            {item.icon}
                        </div>
                        <div className={styles.info}>
                            <span className={styles.itemName}>{item.name}</span>
                            <span className={styles.itemPrice}>{item.price} PKR</span>
                        </div>
                    </div>
                ))}
            </div>
        </LayoutShell>
    );
}
