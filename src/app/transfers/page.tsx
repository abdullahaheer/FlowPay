"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { LayoutShell } from '@/components/Layout/LayoutShell';
import { db, auth } from '@/lib/firebase';
import { 
  collection, getDocs, runTransaction, doc, 
  serverTimestamp, QuerySnapshot 
} from 'firebase/firestore';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Loader2, ChevronDown, UserCircle2 } from 'lucide-react';

interface FlowUser {
    id: string;
    name: string;
    accountNumber: string;
}

function TransferContent() {
    const [users, setUsers] = useState<FlowUser[]>([]);
    const [selectedUser, setSelectedUser] = useState<FlowUser | null>(null);
    const [amount, setAmount] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    
    const [showPassModal, setShowPassModal] = useState<boolean>(false);
    const [password, setPassword] = useState<string>('');
    const [verifying, setVerifying] = useState<boolean>(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    const currentUserId = auth.currentUser?.uid;

    const notifyError = (msg: string) => toast.error(msg, { style: { background: '#ff4b4b', color: '#fff' } });
    const notifySuccess = (msg: string) => toast.success(msg, { style: { background: '#4CAF50', color: '#fff' } });

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

                const reqAmount = searchParams.get('amount');
                const reqUserId = searchParams.get('recipientId');
                if (reqAmount) setAmount(reqAmount);
                if (reqUserId) {
                    const targetUser = userList.find(u => u.id === reqUserId);
                    if (targetUser) setSelectedUser(targetUser);
                }
            } catch { notifyError("Failed to load accounts"); }
        };
        fetchAndPrefill();
    }, [currentUserId, searchParams]);

    const handleInitialSubmit = () => {
        if (!selectedUser) return notifyError("Please select a recipient");
        if (!amount || parseFloat(amount) <= 0) return notifyError("Enter a valid amount");
        setShowPassModal(true);
    };

    const handleSecurityVerify = async () => {
        const user = auth.currentUser;
        if (!user || !user.email) return;
        setVerifying(true);
        try {
            const credential = EmailAuthProvider.credential(user.email, password);
            await reauthenticateWithCredential(user, credential);
            await executeFlowTransfer();
            setShowPassModal(false);
        } catch { notifyError("Incorrect Password!"); } 
        finally { setVerifying(false); }
    };

    const executeFlowTransfer = async () => {
        setLoading(true);
        try {
            const transferAmount = parseFloat(amount);
            const requestId = searchParams.get('requestId');
            
            await runTransaction(db, async (transaction) => {
                const senderRef = doc(db, "users", currentUserId!);
                const receiverRef = doc(db, "users", selectedUser!.id);
                const sDoc = await transaction.get(senderRef);
                const rDoc = await transaction.get(receiverRef);
                
                if (sDoc.data()!.balance < transferAmount) throw new Error("Insufficient Balance");

                transaction.update(senderRef, { balance: sDoc.data()!.balance - transferAmount });
                transaction.update(receiverRef, { balance: (rDoc.data()!.balance || 0) + transferAmount });

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

                if (requestId) {
                    const reqRef = doc(db, "notifications", requestId);
                    transaction.update(reqRef, { status: 'paid', paidAt: serverTimestamp() });
                }
            });

            notifySuccess("Transfer Successful!");
            router.push('/dashboard');
        } catch { notifyError("Transaction failed"); } 
        finally { setLoading(false); }
    };

    return (
        <div style={{ backgroundColor: '#000D1A', minHeight: '100vh', color: '#FFFFFF' }}>
            <LayoutShell headerTitle={searchParams.get('type') === 'request' ? "Pay Request" : "Send via FlowPay"} showBack>
                <div style={{ padding: '30px 20px', maxWidth: '450px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <p style={{ fontSize: '11px', color: '#4CAF50', fontWeight: 'bold', letterSpacing: '1.5px' }}>
                            {searchParams.get('type') === 'request' ? "REQUESTED AMOUNT" : "TRANSFER AMOUNT"}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>PKR</span>
                            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                                readOnly={!!searchParams.get('amount')}
                                style={{ background: 'transparent', border: 'none', fontSize: '55px', fontWeight: '800', color: '#4CAF50', width: '220px', textAlign: 'center', outline: 'none' }}
                            />
                        </div>
                    </div>

                    <div style={{ position: 'relative', marginBottom: '40px' }}>
                        <p style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '10px' }}>Recipient Account</p>
                        <div onClick={() => !searchParams.get('recipientId') && setIsDropdownOpen(!isDropdownOpen)} 
                             style={{ background: '#0a1622', padding: '18px 20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <UserCircle2 size={24} color={selectedUser ? "#4CAF50" : "#4B5563"} />
                                <span>{selectedUser ? selectedUser.name : "Choose account"}</span>
                            </div>
                            {!searchParams.get('recipientId') && <ChevronDown size={20} />}
                        </div>
                        {isDropdownOpen && (
                            <div style={{ position: 'absolute', top: '105%', width: '100%', background: '#0a1622', borderRadius: '20px', zIndex: 100, border: '1px solid rgba(255,255,255,0.1)', maxHeight: '200px', overflowY: 'auto' }}>
                                {users.map(u => (
                                    <div key={u.id} onClick={() => { setSelectedUser(u); setIsDropdownOpen(false); }} style={{ padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                                        <div style={{ fontWeight: '600' }}>{u.name}</div>
                                        <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{u.accountNumber}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button onClick={handleInitialSubmit} style={{ width: '100%', padding: '20px', borderRadius: '22px', background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)', color: 'white', fontWeight: 'bold', border: 'none' }}>
                        {loading ? <Loader2 className="animate-spin mx-auto" /> : (searchParams.get('type') === 'request' ? "Confirm & Pay Request" : "Review Transfer")}
                    </button>
                </div>

                {showPassModal && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, backdropFilter: 'blur(8px)' }}>
                        <div style={{ background: '#0a1622', width: '90%', maxWidth: '400px', padding: '30px', borderRadius: '28px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <h3 style={{ textAlign: 'center' }}>Authorize Payment</h3>
                            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
                                style={{ width: '100%', padding: '15px', borderRadius: '12px', background: '#112233', border: '1px solid #334455', color: 'white', margin: '20px 0' }}
                            />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => setShowPassModal(false)} style={{ flex: 1, padding: '12px', background: '#1e293b', borderRadius: '12px', color: 'white' }}>Cancel</button>
                                <button onClick={handleSecurityVerify} disabled={verifying} style={{ flex: 2, padding: '12px', background: '#4CAF50', borderRadius: '12px', color: 'white', fontWeight: 'bold' }}>
                                    {verifying ? "Verifying..." : "Confirm"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </LayoutShell>
        </div>
    );
}

// 2. Main Page Export (Wrapped in Suspense)
export default function TransferPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-[#000D1A]"><Loader2 className="animate-spin text-green-500" size={40}/></div>}>
      <TransferContent />
    </Suspense>
  );
}