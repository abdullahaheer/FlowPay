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
import { Loader2, ArrowUpRight, ArrowDownLeft, Calendar, Search } from 'lucide-react';
import toast from 'react-hot-toast';

// 1. Interfaces for Type Safety
interface Transaction {
    id: string;
    amount: number;
    receiverName?: string;
    senderName?: string;
    type: 'transfer' | 'deposit' | 'withdrawal';
    status: string;
    timestamp: Timestamp;
}

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const currentUserId = auth.currentUser?.uid;

    useEffect(() => {
        const fetchTransactions = async (): Promise<void> => {
            if (!currentUserId) return;

            try {
                // Sender as current user OR Receiver as current user dono fetch karne ke liye
                const q = query(
                    collection(db, "transactions"),
                    where("senderId", "==", currentUserId),
                    orderBy("timestamp", "desc")
                );

                const querySnapshot = await getDocs(q);
                const list: Transaction[] = [];
                
                querySnapshot.forEach((docSnap) => {
                    const data = docSnap.data() as DocumentData;
                    list.push({
                        id: docSnap.id,
                        amount: data.amount,
                        receiverName: data.receiverName,
                        senderName: data.senderName,
                        type: data.type,
                        status: data.status,
                        timestamp: data.timestamp
                    });
                });
                setTransactions(list);
            } catch (err: unknown) {
                console.error(err);
                toast.error("History load nahi ho saki");
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, [currentUserId]);

    // Date formatter
    const formatDate = (ts: Timestamp) => {
        return ts.toDate().toLocaleDateString('en-PK', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div style={{ backgroundColor: '#000814', minHeight: '100vh', color: '#FFFFFF' }}>
            <LayoutShell headerTitle="Activity" showBack>
                <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
                    
                    {/* --- SUMMARY STATS (Optional) --- */}
                    <div style={{ 
                        background: 'linear-gradient(135deg, #0d1b2a 0%, #000814 100%)',
                        padding: '25px',
                        borderRadius: '24px',
                        border: '1px solid rgba(255,255,255,0.05)',
                        marginBottom: '30px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div>
                            <p style={{ margin: 0, fontSize: '12px', color: '#9CA3AF', fontWeight: '600' }}>TOTAL SPENT</p>
                            <h2 style={{ margin: '5px 0 0', fontSize: '24px', fontWeight: '800', color: '#4CAF50' }}>
                                Rs. {transactions.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}
                            </h2>
                        </div>
                        <Search size={20} opacity={0.5} />
                    </div>

                    <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', paddingLeft: '5px' }}>Recent Transactions</h3>

                    {/* --- TRANSACTIONS LIST --- */}
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
                            <Loader2 className="animate-spin" color="#4CAF50" size={32} />
                        </div>
                    ) : transactions.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {transactions.map((tx) => (
                                <div key={tx.id} style={{
                                    background: '#0a1622',
                                    padding: '16px',
                                    borderRadius: '20px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    border: '1px solid rgba(255,255,255,0.03)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <div style={{ 
                                            background: 'rgba(76, 175, 80, 0.1)', 
                                            padding: '12px', 
                                            borderRadius: '16px' 
                                        }}>
                                            <ArrowUpRight size={20} color="#4CAF50" />
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: '700', fontSize: '14px' }}>
                                                To: {tx.receiverName || "Unknown"}
                                            </p>
                                            <p style={{ margin: 0, fontSize: '11px', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Calendar size={10} /> {formatDate(tx.timestamp)}
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ margin: 0, fontWeight: '800', fontSize: '15px', color: '#FFFFFF' }}>
                                            - Rs. {tx.amount.toLocaleString()}
                                        </p>
                                        <p style={{ margin: 0, fontSize: '10px', color: '#4CAF50', fontWeight: 'bold' }}>
                                            SUCCESSFUL
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', marginTop: '100px', opacity: 0.5 }}>
                            <p>No transactions yet</p>
                        </div>
                    )}
                </div>
            </LayoutShell>
        </div>
    );
}