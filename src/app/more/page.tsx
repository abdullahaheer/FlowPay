"use client";

import React, { useEffect, useState } from 'react';
import { LayoutShell } from '@/components/Layout/LayoutShell';
import styles from './More.module.css';
import { auth } from "@/lib/firebase"; 
import { signOut, onAuthStateChanged } from "firebase/auth";
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
    const [authenticated, setAuthenticated] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setAuthenticated(true);
            } else {
                router.push("/auth");
            }
        });
        return () => unsubscribe();
    }, [router]);

    const handleItemClick = async (id: string) => {
        switch (id) {
            case 'logout':
                try {
                    await signOut(auth);
                    toast.success("Logged out successfully!");
                    router.push("/auth"); 
                } catch {
                    toast.error("Logout failed!");
                }
                break;
            
            case 'support':
                router.push('/support');
                break;
            
            case 'terms':
                router.push('/termsAndConditions');
                break;
            
            case 'about':
                router.push('/about');
                break;

            default:
                toast(`Feature coming soon!`);
        }
    };

    if (!authenticated) {
        return (
            <div style={{ 
                height: '100vh', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                backgroundColor: '#001E3C',
                color: 'white',
                fontFamily: 'sans-serif'
            }}>
                Verifying Session...
            </div>
        );
    }

    return (
        <LayoutShell >
            <div className={styles.menuList}>
                {menuItems.map((item) => (
                    <div
                        key={item.id}
                        onClick={() => handleItemClick(item.id)}
                        className={`${styles.menuItem} ${item.variant === 'logout' ? styles.logout : ''}`}
                        style={{ cursor: 'pointer' }}
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