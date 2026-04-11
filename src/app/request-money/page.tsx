"use client";
import React, { useState, useEffect } from 'react';
import { LayoutShell } from '@/components/Layout/LayoutShell';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Loader2, ChevronDown, CheckCircle2, SendHorizontal } from 'lucide-react';

interface FlowUser {
    id: string;
    name: string;
    accountNumber: string;
}

export default function RequestMoneyPage() {
    const [users, setUsers] = useState<FlowUser[]>([]);
    const [selectedUser, setSelectedUser] = useState<FlowUser | null>(null);
    const [amount, setAmount] = useState<string>('');
    const [note, setNote] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const router = useRouter();
    const currentUserId = auth.currentUser?.uid;

    useEffect(() => {
        const fetchUsers = async () => {
            if (!currentUserId) return;
            try {
                const querySnapshot = await getDocs(collection(db, "users"));
                const list: FlowUser[] = [];
                querySnapshot.forEach(doc => {
                    if (doc.id !== currentUserId) {
                        list.push({ id: doc.id, ...doc.data() } as FlowUser);
                    }
                });
                setUsers(list);
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };
        fetchUsers();
    }, [currentUserId]);

    const handleSendRequest = async () => {
        if (!selectedUser || !amount || parseFloat(amount) <= 0) {
            return toast.error("Please fill all details correctly");
        }

        setLoading(true);
        try {
            // 1. Create Request in 'payment_requests' collection for record keeping
            const requestRef = await addDoc(collection(db, "payment_requests"), {
                fromId: currentUserId,
                fromName: auth.currentUser?.displayName || "Someone",
                toId: selectedUser.id,
                amount: parseFloat(amount),
                note: note,
                status: 'pending',
                timestamp: serverTimestamp()
            });

            // 2. Send Notification (Updated logic to match Header buttons)
            await addDoc(collection(db, "notifications"), {
                userId: selectedUser.id,              // Receiver
                fromId: currentUserId,                // Sender (You)
                title: "Money Request",
                message: `${auth.currentUser?.displayName || 'A user'} is requesting Rs. ${amount}`,
                amount: amount,                       // Amount for auto-fill
                type: 'payment_request',              // Must match Header's type check
                status: 'pending',                    // Must match Header's status check
                requestId: requestRef.id,             // Linked request ID
                read: false,
                timestamp: serverTimestamp()
            });

            toast.success("Request Sent Successfully!");
            router.push('/dashboard');
        } catch (error) {
            console.error(error);
            toast.error("Failed to send request");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ backgroundColor: '#000D1A', minHeight: '100vh', color: '#FFFFFF' }}>
            <LayoutShell headerTitle="Request Money" showBack>
                <div style={{ padding: '30px 20px', maxWidth: '450px', margin: '0 auto' }}>
                    
                    {/* Amount Input */}
                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <p style={{ fontSize: '11px', color: '#4CAF50', fontWeight: 'bold', letterSpacing: '1.5px' }}>REQUEST AMOUNT</p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>Rs.</span>
                            <input 
                                type="number" 
                                value={amount} 
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0"
                                style={{ background: 'transparent', border: 'none', fontSize: '50px', fontWeight: '800', color: '#4CAF50', width: '200px', textAlign: 'center', outline: 'none' }}
                            />
                        </div>
                    </div>

                    {/* Select User Dropdown */}
                    <div style={{ position: 'relative', marginBottom: '25px' }}>
                        <p style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '10px' }}>Request From</p>
                        <div 
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
                            style={{ background: '#0a1622', padding: '18px 20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                        >
                            <span style={{ fontWeight: '500' }}>{selectedUser ? selectedUser.name : "Select a FlowPay user"}</span>
                            <ChevronDown size={20} style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.3s' }} />
                        </div>
                        
                        {isDropdownOpen && (
                            <div style={{ position: 'absolute', top: '105%', width: '100%', background: '#0a1622', borderRadius: '18px', zIndex: 100, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', maxHeight: '200px', overflowY: 'auto' }}>
                                {users.map(u => (
                                    <div key={u.id} onClick={() => { setSelectedUser(u); setIsDropdownOpen(false); }} style={{ padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}>
                                        <div>
                                            <div style={{ fontWeight: '600' }}>{u.name}</div>
                                            <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{u.accountNumber}</div>
                                        </div>
                                        {selectedUser?.id === u.id && <CheckCircle2 size={16} color="#4CAF50" />}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Optional Note */}
                    <div style={{ marginBottom: '35px' }}>
                        <p style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '10px' }}>Add a note (Optional)</p>
                        <input 
                            type="text"
                            placeholder="e.g. For dinner, Project payment"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            style={{ width: '100%', padding: '16px', borderRadius: '15px', background: '#0a1622', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }}
                        />
                    </div>

                    <button 
                        onClick={handleSendRequest} 
                        disabled={loading}
                        style={{ width: '100%', padding: '18px', borderRadius: '20px', background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : (
                            <>
                                <SendHorizontal size={20} />
                                Send Request
                            </>
                        )}
                    </button>
                </div>
            </LayoutShell>
        </div>
    );
}