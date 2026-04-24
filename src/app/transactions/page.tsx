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
  Timestamp,
  DocumentData 
} from 'firebase/firestore';
import { 
  Loader2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  PlusCircle, 
  Car,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface Transaction {
    id: string;
    amount: number;
    receiverId?: string;
    senderId?: string;
    userId?: string; 
    type: string;
    category?: string;
    title?: string;
    subTitle?: string;
    senderName?: string;
    receiverName?: string;
    status: string;
    timestamp: Timestamp;
    isIncoming: boolean;
}

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [stats, setStats] = useState({ incoming: 0, outgoing: 0 }); // Added Stats State
    const currentUserId = auth.currentUser?.uid;

    useEffect(() => {
        const fetchTransactions = async () => {
            if (!currentUserId) return;
            try {
                setLoading(true);
                
                const qSent = query(collection(db, "transactions"), where("senderId", "==", currentUserId), orderBy("timestamp", "desc"));
                const qReceived = query(collection(db, "transactions"), where("receiverId", "==", currentUserId), orderBy("timestamp", "desc"));
                const qUserId = query(collection(db, "transactions"), where("userId", "==", currentUserId), orderBy("timestamp", "desc"));

                const [sSnap, rSnap, uSnap] = await Promise.all([
                    getDocs(qSent), 
                    getDocs(qReceived), 
                    getDocs(qUserId) 
                ]);

                const combined: Transaction[] = [];
                let totalIn = 0;
                let totalOut = 0;

                const processDoc = (doc: DocumentData, isIncomingOverride: boolean): Transaction => {
                    const data = doc.data();
                    const amt = data.amount || 0;
                    
                    // Add to stats
                    if (isIncomingOverride) {
                        totalIn += amt;
                    } else {
                        totalOut += amt;
                    }

                    return {
                        id: doc.id,
                        amount: amt,
                        type: data.type || 'transaction',
                        status: data.status || 'success',
                        timestamp: data.timestamp || Timestamp.now(),
                        title: data.title,
                        subTitle: data.subTitle,
                        senderName: data.senderName,
                        receiverName: data.receiverName,
                        isIncoming: isIncomingOverride,
                        ...data 
                    } as Transaction;
                };

                sSnap.forEach(doc => combined.push(processDoc(doc, false)));
                rSnap.forEach(doc => combined.push(processDoc(doc, true)));
                uSnap.forEach(doc => {
                    const data = doc.data();
                    const isActuallyIncoming = data.type === 'deposit' || data.isIncoming === true;
                    combined.push(processDoc(doc, isActuallyIncoming));
                });

                combined.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
                
                const uniqueTransactions = combined.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
                
                setTransactions(uniqueTransactions);
                setStats({ incoming: totalIn, outgoing: totalOut }); // Update the card stats
            } catch (err) {
                console.error("Fetch Error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, [currentUserId]);

    const formatTime = (ts: Timestamp) => {
        if (!ts) return "Recently";
        return ts.toDate().toLocaleDateString('en-PK', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <LayoutShell headerTitle="Transaction History" showBack>
                
                {/* 1. STATS CARD (INCOMING / OUTGOING) */}
                <div style={{ 
                    background: 'linear-gradient(135deg, #0d1b2a 0%, #000814 100%)',
                    padding: '20px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)',
                    marginBottom: '25px', display: 'flex', gap: '15px'
                }}>
                    <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '10px', color: '#9CA3AF', marginBottom: '5px' }}>TOTAL OUTGOING</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#FFFFFF' }}>
                            <TrendingDown size={14} color="#FF4D4D" />
                            <span style={{ fontWeight: '700' }}>Rs. {stats.outgoing.toLocaleString()}</span>
                        </div>
                    </div>
                    <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                    <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '10px', color: '#9CA3AF', marginBottom: '5px' }}>TOTAL INCOMING</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#4CAF50' }}>
                            <TrendingUp size={14} />
                            <span style={{ fontWeight: '700' }}>Rs. {stats.incoming.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* 2. TRANSACTION LIST */}
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}>
                        <Loader2 className="animate-spin" color="#4CAF50" size={32} />
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <h3 style={{ fontSize: '14px', color: '#9CA3AF', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <History size={16} /> Recent Activity
                        </h3>
                        
                        {transactions.length > 0 ? (
                            transactions.map((tx) => (
                                <div key={tx.id} style={{
                                    background: '#0a1622', padding: '16px', borderRadius: '20px',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                        <div style={{ 
                                            background: tx.isIncoming ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 77, 77, 0.1)', 
                                            padding: '10px', borderRadius: '14px' 
                                        }}>
                                            {tx.type === 'deposit' ? <PlusCircle color="#4CAF50" size={22}/> : 
                                             tx.category === 'M-Tag' ? <Car color="#FF4D4D" size={22}/> :
                                             tx.isIncoming ? <ArrowDownLeft color="#4CAF50" size={22}/> : 
                                             <ArrowUpRight color="#FF4D4D" size={22}/>}
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: '600', fontSize: '14px', color: '#FFFFFF' }}>
                                                {tx.title || (tx.isIncoming ? `From: ${tx.senderName || 'Transfer'}` : `To: ${tx.receiverName || 'Payment'}`)}
                                            </p>
                                            <p style={{ margin: 0, fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>
                                                {formatTime(tx.timestamp)}
                                            </p>
                                        </div>
                                    </div>

                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ 
                                            margin: 0, fontWeight: '700', fontSize: '15px', 
                                            color: tx.isIncoming ? '#4CAF50' : '#FFFFFF' 
                                        }}>
                                            {tx.isIncoming ? '+' : '-'} Rs. {tx.amount.toLocaleString()}
                                        </p>
                                        <span style={{ fontSize: '9px', color: '#6B7280', textTransform: 'uppercase' }}>
                                            {tx.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p style={{ textAlign: 'center', color: '#6B7280', marginTop: '50px' }}>No transactions found.</p>
                        )}
                    </div>
                )}
         
        </LayoutShell>
    );
}