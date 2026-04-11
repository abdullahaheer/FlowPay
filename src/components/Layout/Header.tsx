"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { db, auth } from '@/lib/firebase';
import {
    collection,
    query,
    where,
    onSnapshot,
    orderBy,
    limit,
    doc,
    writeBatch,
    updateDoc,
    Timestamp
} from 'firebase/firestore';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
    Bell,
    ArrowLeft,
    User,
    X,
    LogOut,
    ShieldCheck,
    ArrowUpLeft,
    ArrowDownRight,
    Info,
    Check
} from 'lucide-react';
import styles from './Header.module.css';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'transfer' | 'receive' | 'system' | 'payment_request';
    status?: 'pending' | 'paid' | 'cancelled';
    read: boolean;
    timestamp: Timestamp;
    userId: string;
    fromId?: string;
    amount?: string;
}

interface HeaderProps {
    title?: string;
    showBack?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ title, showBack }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [user, setUser] = useState<FirebaseUser | null>(null);

    const router = useRouter();
    const headerRef = useRef<HTMLDivElement>(null);
    const unreadCount = notifications.filter(n => !n.read).length;

    // --- Actions ---
    const handleAccept = (n: Notification) => {
        setIsNotifOpen(false);
        // Transfer page par data bhej raha hai auto-fill ke liye
        router.push(`/transfers?recipientId=${n.fromId}&amount=${n.amount}&type=request&requestId=${n.id}`);
    };

    const handleCancel = async (notifId: string) => {
        try {
            await updateDoc(doc(db, "notifications", notifId), {
                status: 'cancelled',
                read: true
            });
            toast.error("Request Declined");
        } catch (e) {
            console.error("Cancel failed:", e);
        }
    };

    const markAllAsRead = useCallback(async () => {
        if (!user?.uid || notifications.length === 0) return;
        try {
            const batch = writeBatch(db);
            let hasUnread = false;
            notifications.forEach(n => {
                if (!n.read) {
                    batch.update(doc(db, "notifications", n.id), { read: true });
                    hasUnread = true;
                }
            });
            if (hasUnread) await batch.commit();
        } catch (e) {
            console.error("Batch update failed:", e);
        }
    }, [user, notifications]);

    // --- Effects ---
    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
        return () => unsubAuth();
    }, []);

    useEffect(() => {
        if (!user?.uid) return;
        const q = query(
            collection(db, "notifications"),
            where("userId", "==", user.uid),
            orderBy("timestamp", "desc"),
            limit(15)
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
            setNotifications(list);
        });
        return () => unsubscribe();
    }, [user?.uid]);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
                setIsNotifOpen(false);
                setIsProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const handleLogout = async () => {
        await auth.signOut();
        router.push('/auth');
    };

    return (
        <header className={styles.header} ref={headerRef}>
            <div className={styles.left}>
                {showBack ? (
                    <button className={styles.iconButton} onClick={() => window.history.back()}>
                        <ArrowLeft size={20} />
                    </button>
                ) : (
                    <div className={styles.profileWrapper}>
                        <button className={styles.profileBtn} onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotifOpen(false); }}>
                            <User size={20} className={styles.profileIcon} />
                        </button>
                        {isProfileOpen && user && (
                            <div className={styles.profileDropdown}>
                                <div className={styles.profileHeader}>
                                    <div className={styles.avatarLarge}><User size={32} /></div>
                                    <div className={styles.profileInfo}>
                                        <p className={styles.userName}>{user.displayName || "User"}</p>
                                        <p className={styles.userEmail}>{user.email}</p>
                                    </div>
                                </div>
                                <div className={styles.profileBody}>
                                    <div className={styles.profileItem}><ShieldCheck size={16} /> <span>ID: {user.uid.slice(0, 8)}...</span></div>
                                    <button onClick={handleLogout} className={styles.logoutBtn}><LogOut size={16} /> Sign Out</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className={styles.center}>
                {title && <h1 className={styles.title}>{title}</h1>}
            </div>

            <div className={styles.right}>
                {!showBack && (
                    <div className={styles.notificationWrapper}>
                        <button className={styles.iconButton} onClick={() => {
                            const next = !isNotifOpen;
                            setIsNotifOpen(next);
                            setIsProfileOpen(false);
                            if (next && unreadCount > 0) markAllAsRead();
                        }}>
                            <Bell size={20} />
                            {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
                        </button>

                        {isNotifOpen && (
                            <div className={styles.dropdown}>
                                <div className={styles.dropdownHeader}>
                                    <button onClick={() => setIsNotifOpen(false)} className={styles.closeBtn}>
                                        <X size={18} className="text-gray-400 hover:text-white transition-colors" />
                                    </button>
                                </div>
                                <div className={styles.list}>
                                    {notifications.length > 0 ? (
                                        notifications.map(n => (
                                            <div key={n.id} className={`${styles.item} ${!n.read ? styles.unread : ''}`}>
                                                <div className={styles.iconBox}>
                                                    {n.type === 'receive' ? <div className={styles.receiveIcon}><ArrowUpLeft size={18} /></div> :
                                                        n.type === 'transfer' ? <div className={styles.transferIcon}><ArrowDownRight size={18} /></div> :
                                                            n.type === 'payment_request' ? <div className={styles.requestIcon}><Info size={18} /></div> :
                                                                <div className={styles.systemIcon}><Info size={18} /></div>}
                                                </div>
                                                <div className={styles.itemContent}>
                                                    <p className={styles.itemTitle}>{n.title}</p>
                                                    <p className={styles.itemMessage}>{n.message}</p>

                                                    {n.type === 'payment_request' && n.status === 'pending' && (
                                                        <div className={styles.actionButtons}>
                                                            <button onClick={() => handleAccept(n)} className={styles.acceptBtn}>Accept</button>
                                                            <button onClick={() => handleCancel(n.id)} className={styles.cancelBtn}>Cancel</button>
                                                        </div>
                                                    )}

                                                    {n.status === 'paid' && <span className={styles.paidBadge}><Check size={10} /> Paid</span>}

                                                    <span className={styles.itemTime}>
                                                        {n.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className={styles.empty}>No notifications yet</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
};