"use client";
import React from 'react';
import { LayoutShell } from '@/components/Layout/LayoutShell';
import styles from './More.module.css';
import { auth } from "@/lib/firebase"; // Firebase auth import karein
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import toast from 'react-hot-toast';

const menuItems = [
    { label: 'Support', icon: '🎧', id: 'support' },
    { label: 'Terms & Conditions', icon: '📄', id: 'terms' },
    { label: 'About', icon: 'ℹ️', id: 'about' },
    { label: 'Logout', icon: '🚪', id: 'logout', variant: 'logout' },
];

export default function MorePage() {
    const router = useRouter();

    const handleItemClick = async (id: string) => {
        if (id === 'logout') {
            try {
                await signOut(auth);
                toast.success("Logged out successfully!");
                router.push("/auth"); // Logout ke baad wapis auth page par
            } catch  {
                toast.error("Logout failed!");
            }
        } else {
            // Baqi items ke liye logic yahan likh sakty hain
            toast(`Feature ${id} coming soon!`);
        }
    };

    return (
        <LayoutShell headerTitle="More Settings">
            <div className={styles.menuList}>
                {menuItems.map((item) => (
                    <div
                        key={item.id}
                        onClick={() => handleItemClick(item.id)} // Click handler add kiya
                        className={`${styles.menuItem} ${item.variant === 'logout' ? styles.logout : ''}`}
                        style={{ cursor: 'pointer' }} // Taaky pata chaly click ho sakta hai
                    >
                        <div className={styles.iconWrapper}>
                            {item.icon}
                        </div>
                        <span className={styles.label}>{item.label}</span>
                        <span className={styles.arrow}>&gt;</span>
                    </div>
                ))}
            </div>
        </LayoutShell>
    );
}