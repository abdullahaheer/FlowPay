"use client";
import React, { useState, useEffect } from 'react';
import { LayoutShell } from '@/components/Layout/LayoutShell';
import { db, auth } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  DocumentData, 
  Timestamp 
} from 'firebase/firestore';
import { 
  Loader2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  History
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Transaction {
    id: string;
    amount: number;
    receiverName?: string;
    senderName?: string;
    receiverId?: string;
    senderId?: string;
    type: string;
    status: string;
    timestamp: Timestamp;
    isIncoming: boolean; // Custom flag for UI
}

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [stats, setStats] = useState({ sent: 0, received: 0 });
    const currentUserId = auth.currentUser?.uid;

    useEffect(() => {
        const fetchAllTransactions = async () => {
            if (!currentUserId) return;

            try {
                setLoading(true);

                // 1. Sent Transactions Query
                const qSent = query(
                    collection(db, "transactions"),
                    where("senderId", "==", currentUserId),
                    orderBy("timestamp", "desc")
                );

                // 2. Received Transactions Query
                const qReceived = query(
                    collection(db, "transactions"),
                    where("receiverId", "==", currentUserId),
                    orderBy("timestamp", "desc")
                );

                // Dono queries ko parallel run karna (Speed ke liye)
                const [sentSnap, receivedSnap] = await Promise.all([
                    getDocs(qSent),
                    getDocs(qReceived)
                ]);

                let totalSent = 0;
                let totalReceived = 0;
                const combinedList: Transaction[] = [];

                // Process Sent
                sentSnap.forEach((doc) => {
                    const data = doc.data();
                    totalSent += data.amount;
                    combinedList.push({
                        id: doc.id,
                        ...data,
                        timestamp: data.timestamp,
                        isIncoming: false
                    } as Transaction);
                });

                // Process Received
                receivedSnap.forEach((doc) => {
                    const data = doc.data();
                    totalReceived += data.amount;
                    combinedList.push({
                        id: doc.id,
                        ...data,
                        timestamp: data.timestamp,
                        isIncoming: true
                    } as Transaction);
                });

                // Merge karne ke baad timestamp par sort karna (Latest First)
                combinedList.sort((a, b) => b.timestamp.toMillis() - a.timestamp.toMillis());

                setTransactions(combinedList);
                setStats({ sent: totalSent, received: totalReceived });

            }  finally {
                setLoading(false);
            }
        };

        fetchAllTransactions();
    }, [currentUserId]);

    const formatDate = (ts: Timestamp) => {
        if (!ts) return "Processing...";
        return ts.toDate().toLocaleDateString('en-PK', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div style={{ backgroundColor: '#000814', minHeight: '100vh', color: '#FFFFFF' }}>
            <LayoutShell headerTitle="Transaction History" showBack>
                <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
                    
                    {/* --- QUICK STATS CARD --- */}
                    <div style={{ 
                        background: 'linear-gradient(135deg, #0d1b2a 0%, #000814 100%)',
                        padding: '20px',
                        borderRadius: '24px',
                        border: '1px solid rgba(255,255,255,0.08)',
                        marginBottom: '25px',
                        display: 'flex',
                        gap: '15px'
                    }}>
                        <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '10px', color: '#9CA3AF', marginBottom: '5px' }}>TOTAL SENT</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#FF4D4D' }}>
                                <TrendingDown size={14} />
                                <span style={{ fontWeight: '700' }}>Rs. {stats.sent.toLocaleString()}</span>
                            </div>
                        </div>
                        <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                        <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '10px', color: '#9CA3AF', marginBottom: '5px' }}>TOTAL RECEIVED</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#4CAF50' }}>
                                <TrendingUp size={14} />
                                <span style={{ fontWeight: '700' }}>Rs. {stats.received.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '15px', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <History size={16} /> Activity Log
                    </h3>

                    {/* --- TRANSACTIONS LIST --- */}
                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '100px', gap: '10px' }}>
                            <Loader2 className="animate-spin" color="#4CAF50" size={32} />
                            <p style={{ fontSize: '12px', color: '#9CA3AF' }}>Fetching records...</p>
                        </div>
                    ) : transactions.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {transactions.map((tx) => (
                                <div key={tx.id} style={{
                                    background: '#0a1622',
                                    padding: '14px 16px',
                                    borderRadius: '18px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    border: '1px solid rgba(255,255,255,0.03)',
                                    transition: '0.2s'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ 
                                            background: tx.isIncoming ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 77, 77, 0.1)', 
                                            padding: '10px', 
                                            borderRadius: '14px' 
                                        }}>
                                            {tx.isIncoming ? 
                                                <ArrowDownLeft size={20} color="#4CAF50" /> : 
                                                <ArrowUpRight size={20} color="#FF4D4D" />
                                            }
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: '600', fontSize: '14px' }}>
                                                {tx.isIncoming ? `From: ${tx.senderName || 'Internal'}` : `To: ${tx.receiverName || 'Internal'}`}
                                            </p>
                                            <p style={{ margin: 0, fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>
                                                {formatDate(tx.timestamp)}
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ 
                                            margin: 0, 
                                            fontWeight: '700', 
                                            fontSize: '15px', 
                                            color: tx.isIncoming ? '#4CAF50' : '#FFFFFF' 
                                        }}>
                                            {tx.isIncoming ? '+' : '-'} Rs. {tx.amount.toLocaleString()}
                                        </p>
                                        <span style={{ fontSize: '9px', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', color: '#9CA3AF' }}>
                                            {tx.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', marginTop: '80px' }}>
                            <div style={{ opacity: 0.2, marginBottom: '10px' }}>
                                <History size={48} style={{ margin: '0 auto' }} />
                            </div>
                            <p style={{ color: '#9CA3AF', fontSize: '14px' }}>No transactions found</p>
                        </div>
                    )}
                </div>
            </LayoutShell>
        </div>
    );
}