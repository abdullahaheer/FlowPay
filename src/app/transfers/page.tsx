"use client";
import React, { useState, useEffect } from 'react';
import { LayoutShell } from '@/components/Layout/LayoutShell';
import { db, auth } from '@/lib/firebase';
import { 
  collection, 
  getDocs, 
  runTransaction, 
  doc, 
  serverTimestamp,
  QuerySnapshot,
  updateDoc
} from 'firebase/firestore';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Loader2, ChevronDown, CheckCircle2, Lock, X, UserCircle2 } from 'lucide-react';

interface FlowUser {
    id: string;
    name: string;
    accountNumber: string;
}

export default function TransferPage() {
    const [users, setUsers] = useState<FlowUser[]>([]);
    const [selectedUser, setSelectedUser] = useState<FlowUser | null>(null);
    const [amount, setAmount] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    
    // Security states
    const [showPassModal, setShowPassModal] = useState<boolean>(false);
    const [password, setPassword] = useState<string>('');
    const [verifying, setVerifying] = useState<boolean>(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    const currentUserId = auth.currentUser?.uid;

    const notifyError = (msg: string) => toast.error(msg, { style: { background: '#ff4b4b', color: '#fff' } });
    const notifySuccess = (msg: string) => toast.success(msg, { style: { background: '#4CAF50', color: '#fff' } });

    // 1. Fetch Users & Handle URL Params (Requests)
    useEffect(() => {
        const fetchAndPrefill = async () => {
            if (!currentUserId) return;
            try {
                const querySnapshot: QuerySnapshot = await getDocs(collection(db, "users"));
                const userList: FlowUser[] = [];
                querySnapshot.forEach((docSnap) => {
                    if (docSnap.id !== currentUserId) {
                        const data = docSnap.data();
                        userList.push({
                            id: docSnap.id,
                            name: data.name || 'Unknown User',
                            accountNumber: data.accountNumber || 'N/A'
                        });
                    }
                });
                setUsers(userList);

                // --- REQUEST AUTO-FILL LOGIC ---
                const reqAmount = searchParams.get('amount');
                const reqUserId = searchParams.get('recipientId');
                
                if (reqAmount) setAmount(reqAmount);
                if (reqUserId) {
                    const targetUser = userList.find(u => u.id === reqUserId);
                    if (targetUser) setSelectedUser(targetUser);
                }
            } catch (err) {
                notifyError("Failed to load accounts");
            }
        };
        fetchAndPrefill();
    }, [currentUserId, searchParams]);

    const handleInitialSubmit = () => {
        if (!selectedUser) return notifyError("Please select a recipient");
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) return notifyError("Enter a valid amount");
        setShowPassModal(true);
    };

    const handleSecurityVerify = async () => {
        const user = auth.currentUser;
        if (!user || !user.email) return;

        setVerifying(true);
        try {
            const credential = EmailAuthProvider.credential(user.email, password);
            await reauthenticateWithCredential(user, credential);
            
            // Password correct -> Execute
            await executeFlowTransfer();
            
            setShowPassModal(false);
            setPassword('');
        } catch (error) {
            notifyError("Incorrect Password!");
        } finally {
            setVerifying(false);
        }
    };

    const executeFlowTransfer = async () => {
        setLoading(true);
        try {
            const transferAmount = parseFloat(amount);
            const requestId = searchParams.get('requestId'); // Check if it's a request fulfillment
            
            await runTransaction(db, async (transaction) => {
                const senderRef = doc(db, "users", currentUserId!);
                const receiverRef = doc(db, "users", selectedUser!.id);
                
                const sDoc = await transaction.get(senderRef);
                const rDoc = await transaction.get(receiverRef);
                
                if (sDoc.data()!.balance < transferAmount) throw new Error("Insufficient Balance");

                // Update Balances
                transaction.update(senderRef, { balance: sDoc.data()!.balance - transferAmount });
                transaction.update(receiverRef, { balance: (rDoc.data()!.balance || 0) + transferAmount });

                // Log Transaction
                const transRef = doc(collection(db, "transactions"));
                transaction.set(transRef, {
                    senderId: currentUserId,
                    senderName: sDoc.data()!.name,
                    receiverId: selectedUser!.id,
                    receiverName: selectedUser!.name,
                    amount: transferAmount,
                    type: 'internal_transfer',
                    status: 'success',
                    timestamp: serverTimestamp()
                });

                // If this was a request, mark it as completed/paid
                if (requestId) {
                    const reqRef = doc(db, "notifications", requestId);
                    transaction.update(reqRef, { status: 'paid', paidAt: serverTimestamp() });
                }

                // Notifications
                const notifRef = doc(collection(db, "notifications"));
                transaction.set(notifRef, {
                    userId: selectedUser!.id,
                    title: "Payment Received",
                    message: `Received Rs. ${transferAmount} from ${sDoc.data()!.name}`,
                    type: 'receive',
                    read: false,
                    timestamp: serverTimestamp()
                });
            });

            notifySuccess("Transfer Successful!");
            router.push('/dashboard');
        } catch  {
            notifyError("Transaction failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ backgroundColor: '#000D1A', minHeight: '100vh', color: '#FFFFFF' }}>
            <LayoutShell headerTitle={searchParams.get('type') === 'request' ? "Pay Request" : "Send via FlowPay"} showBack>
                <div style={{ padding: '30px 20px', maxWidth: '450px', margin: '0 auto' }}>
                    
                    {/* Amount Section */}
                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <p style={{ fontSize: '11px', color: '#4CAF50', fontWeight: 'bold', letterSpacing: '1.5px' }}>
                            {searchParams.get('type') === 'request' ? "REQUESTED AMOUNT" : "TRANSFER AMOUNT"}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>PKR</span>
                            <input 
                                type="number" 
                                value={amount} 
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0"
                                readOnly={!!searchParams.get('amount')} // Lock amount if it's a specific request
                                style={{ background: 'transparent', border: 'none', fontSize: '55px', fontWeight: '800', color: '#4CAF50', width: '220px', textAlign: 'center', outline: 'none', opacity: !!searchParams.get('amount') ? 0.8 : 1 }}
                            />
                        </div>
                    </div>

                    {/* Recipient Dropdown */}
                    <div style={{ position: 'relative', marginBottom: '40px' }}>
                        <p style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '10px' }}>Recipient Account</p>
                        <div 
                            onClick={() => !searchParams.get('recipientId') && setIsDropdownOpen(!isDropdownOpen)} 
                            style={{ 
                                background: '#0a1622', padding: '18px 20px', borderRadius: '20px', 
                                border: '1px solid rgba(255,255,255,0.1)', display: 'flex', 
                                justifyContent: 'space-between', alignItems: 'center', 
                                cursor: searchParams.get('recipientId') ? 'default' : 'pointer',
                                opacity: searchParams.get('recipientId') ? 0.7 : 1
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <UserCircle2 size={24} color={selectedUser ? "#4CAF50" : "#4B5563"} />
                                <span style={{ fontWeight: '500' }}>{selectedUser ? selectedUser.name : "Choose FlowPay account"}</span>
                            </div>
                            {!searchParams.get('recipientId') && <ChevronDown size={20} />}
                        </div>
                        
                        {isDropdownOpen && (
                            <div style={{ position: 'absolute', top: '105%', width: '100%', background: '#0a1622', borderRadius: '20px', zIndex: 100, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 15px 40px rgba(0,0,0,0.6)', maxHeight: '250px', overflowY: 'auto' }}>
                                {users.map(u => (
                                    <div key={u.id} onClick={() => { setSelectedUser(u); setIsDropdownOpen(false); }} style={{ padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                                        <div>
                                            <div style={{ fontWeight: '600', fontSize: '15px' }}>{u.name}</div>
                                            <div style={{ fontSize: '11px', color: '#9CA3AF' }}>ID: {u.accountNumber}</div>
                                        </div>
                                        {selectedUser?.id === u.id && <CheckCircle2 size={18} color="#4CAF50" />}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={handleInitialSubmit} 
                        style={{ width: '100%', padding: '20px', borderRadius: '22px', background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)', color: 'white', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '16px' }}
                    >
                        {searchParams.get('type') === 'request' ? "Confirm & Pay Request" : "Review Transfer"}
                    </button>

                    {/* Security Modal */}
                    {showPassModal && (
                        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '20px', backdropFilter: 'blur(8px)' }}>
                            <div style={{ background: '#0a1622', width: '100%', maxWidth: '400px', padding: '32px', borderRadius: '28px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                                    <div style={{ background: 'rgba(76,175,80,0.1)', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
                                        <Lock color="#4CAF50" size={24} />
                                    </div>
                                    <h3 style={{ margin: 0 }}>Authorize Payment</h3>
                                    <p style={{ fontSize: '13px', color: '#9CA3AF', marginTop: '10px' }}>Enter password to send <b>Rs. {amount}</b> to <b>{selectedUser?.name}</b></p>
                                </div>

                                <input 
                                    type="password"
                                    placeholder="FlowPay Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    style={{ width: '100%', padding: '18px', borderRadius: '15px', background: '#112233', border: '1px solid rgba(255,255,255,0.1)', color: 'white', marginBottom: '20px', outline: 'none' }}
                                    autoFocus
                                />

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button onClick={() => setShowPassModal(false)} style={{ flex: 1, padding: '16px', borderRadius: '15px', background: '#1e293b', color: 'white', border: 'none' }}>Cancel</button>
                                    <button 
                                        onClick={handleSecurityVerify}
                                        disabled={verifying || !password}
                                        style={{ flex: 2, padding: '16px', borderRadius: '15px', background: '#4CAF50', color: 'white', border: 'none', fontWeight: 'bold' }}
                                    >
                                        {verifying ? <Loader2 className="animate-spin" size={20} /> : "Confirm"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </LayoutShell>
        </div>
    );
}