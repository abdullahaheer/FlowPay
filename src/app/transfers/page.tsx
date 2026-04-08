"use client";
import React, { useState, useEffect } from 'react';
import { LayoutShell } from '@/components/Layout/LayoutShell';
import { db, auth } from '@/lib/firebase';
import { 
  collection, 
  getDocs, 
  runTransaction, 
  doc, 
  addDoc, 
  serverTimestamp,
  DocumentData,
  QuerySnapshot,
  DocumentReference
} from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowRightLeft, Loader2, User, ChevronDown, CheckCircle2 } from 'lucide-react';

interface FlowUser {
    id: string;
    name: string;
    accountNumber: string;
    balance: number;
}

interface UserDocument extends DocumentData {
    name: string;
    accountNumber: string;
    balance: number;
}

export default function TransferPage() {
    const [users, setUsers] = useState<FlowUser[]>([]);
    const [selectedUser, setSelectedUser] = useState<FlowUser | null>(null);
    const [amount, setAmount] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    
    const router = useRouter();
    const currentUserId: string | undefined = auth.currentUser?.uid;

    useEffect(() => {
        const fetchUsers = async (): Promise<void> => {
            try {
                if (!currentUserId) return;
                const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(collection(db, "users"));
                const userList: FlowUser[] = [];
                querySnapshot.forEach((docSnap) => {
                    const data = docSnap.data() as UserDocument;
                    if (docSnap.id !== currentUserId) {
                        userList.push({
                            id: docSnap.id,
                            name: data.name,
                            accountNumber: data.accountNumber,
                            balance: data.balance
                        });
                    }
                });
                setUsers(userList);
            } catch (err: unknown) {
                console.error(err);
            }
        };
        fetchUsers();
    }, [currentUserId]);

    const handleTransfer = async (): Promise<void> => {
        // FIXED: Separate toast and return to avoid TS error
        if (!selectedUser || !amount || parseFloat(amount) <= 0) {
            toast.error("Details check karein");
            return; 
        }

        setLoading(true);
        try {
            await runTransaction(db, async (transaction) => {
                const senderRef: DocumentReference = doc(db, "users", currentUserId!);
                const receiverRef: DocumentReference = doc(db, "users", selectedUser.id);
                
                const sDoc = await transaction.get(senderRef);
                if (!sDoc.exists()) throw new Error("User record not found");
                
                const senderData = sDoc.data() as UserDocument;
                if (senderData.balance < parseFloat(amount)) throw new Error("Balance kam hai!");

                transaction.update(senderRef, { balance: senderData.balance - parseFloat(amount) });
                transaction.update(receiverRef, { balance: selectedUser.balance + parseFloat(amount) });

                await addDoc(collection(db, "transactions"), {
                    senderId: currentUserId,
                    senderName: senderData.name,
                    receiverId: selectedUser.id,
                    receiverName: selectedUser.name,
                    amount: parseFloat(amount),
                    type: 'transfer',
                    status: 'success',
                    timestamp: serverTimestamp()
                });
            });

            toast.success("Transfer Successful!");
            router.push('/dashboard');
        } catch (err: unknown) {
            if (err instanceof Error) toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ backgroundColor: '#000D1A', minHeight: '100vh', color: '#FFFFFF' }}>
            <LayoutShell headerTitle="Send Money" showBack>
                <div style={{ padding: '30px 20px', maxWidth: '450px', margin: '0 auto' }}>
                    
                    {/* --- AMOUNT INPUT --- */}
                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <p style={{ fontSize: '12px', color: '#4CAF50', fontWeight: 'bold', letterSpacing: '2px' }}>ENTER AMOUNT</p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
                            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>Rs.</span>
                            <input 
                                type="number"
                                placeholder="0"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    fontSize: '50px',
                                    fontWeight: '800',
                                    color: '#4CAF50',
                                    width: '180px',
                                    textAlign: 'center',
                                    outline: 'none'
                                }}
                            />
                        </div>
                    </div>

                    {/* --- DROPDOWN --- */}
                    <div style={{ position: 'relative', marginBottom: '40px' }}>
                        <p style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '10px' }}>Recipient</p>
                        <div 
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            style={{
                                background: '#0a1622',
                                padding: '15px 20px',
                                borderRadius: '18px',
                                border: isDropdownOpen ? '1px solid #4CAF50' : '1px solid rgba(255,255,255,0.1)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer',
                                transition: '0.3s ease'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ background: '#4CAF50', padding: '8px', borderRadius: '12px' }}>
                                    <User size={18} color="white" />
                                </div>
                                <span style={{ fontWeight: '600' }}>
                                    {selectedUser ? selectedUser.name : "Select a User"}
                                </span>
                            </div>
                            <ChevronDown size={20} style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.3s' }} />
                        </div>

                        {isDropdownOpen && (
                            <div style={{
                                position: 'absolute',
                                top: '105%',
                                left: 0,
                                right: 0,
                                background: '#0a1622',
                                borderRadius: '18px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                maxHeight: '250px',
                                overflowY: 'auto',
                                zIndex: 100,
                                boxShadow: '0 15px 35px rgba(0,0,0,0.6)'
                            }}>
                                {users.length > 0 ? users.map((u) => (
                                    <div 
                                        key={u.id}
                                        onClick={() => {
                                            setSelectedUser(u);
                                            setIsDropdownOpen(false);
                                        }}
                                        style={{
                                            padding: '15px 20px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                                            cursor: 'pointer',
                                            backgroundColor: selectedUser?.id === u.id ? 'rgba(76, 175, 80, 0.1)' : 'transparent'
                                        }}
                                    >
                                        <div>
                                            <p style={{ margin: 0, fontWeight: '600', fontSize: '14px' }}>{u.name}</p>
                                            <p style={{ margin: 0, fontSize: '12px', color: '#9CA3AF' }}>{u.accountNumber}</p>
                                        </div>
                                        {selectedUser?.id === u.id && <CheckCircle2 size={18} color="#4CAF50" />}
                                    </div>
                                )) : (
                                    <div style={{ padding: '20px', textAlign: 'center', color: '#9CA3AF' }}>No users found</div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* --- BUTTON --- */}
                    <button 
                        onClick={handleTransfer}
                        disabled={loading || !selectedUser}
                        style={{
                            width: '100%',
                            padding: '18px',
                            borderRadius: '20px',
                            background: (loading || !selectedUser) ? '#1a2b3c' : 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            cursor: (loading || !selectedUser) ? 'default' : 'pointer'
                        }}
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : (
                            <>Confirm Payment <ArrowRightLeft size={18} /></>
                        )}
                    </button>
                </div>
            </LayoutShell>
        </div>
    );
}