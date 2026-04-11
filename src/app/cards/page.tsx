"use client";
import React, { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { LayoutShell } from '@/components/Layout/LayoutShell';
import { 
    Eye, EyeOff, Snowflake, Hash, 
    Loader2, Landmark, PlusCircle, X, ShieldCheck, Lock
} from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './Card.module.css';

interface CardData {
    number: string;
    holder: string;
    expiry: string;
    cvv: string;
    isFrozen: boolean;
    pin: string;
    limit: number;
}

export default function CardsPage() {
    const [userData, setUserData] = useState<CardData | null>(null);
    const [showFullDetails, setShowFullDetails] = useState(false);
    const [loading, setLoading] = useState(true);
    
    const [activeModal, setActiveModal] = useState<'limit' | 'pin' | null>(null);
    const [showPinFields, setShowPinFields] = useState(false);
    const [formData, setFormData] = useState({
        oldPin: "",
        newPin: "",
        confirmPin: "",
        amount: "",
        securityPin: "" 
    });

    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                const docRef = doc(db, "users", user.uid);
                const unsubSnap = onSnapshot(docRef, (snap) => {
                    if (snap.exists()) {
                        const data = snap.data();
                        setUserData({
                            number: data.cardDetails?.number || "4214 5678 9012 3456",
                            holder: data.name || "User Name",
                            expiry: data.cardDetails?.expiry || "12/28",
                            cvv: data.cardDetails?.cvv || "•••",
                            isFrozen: data.cardDetails?.isFrozen || false,
                            pin: data.cardDetails?.pin || "",
                            limit: data.cardDetails?.limit ?? 50000
                        });
                    }
                    setLoading(false);
                });
                return () => unsubSnap();
            }
        });
        return () => unsubAuth();
    }, []);

    const sendNotification = async (title: string, message: string, type: string) => {
        const currentUser = auth.currentUser;
        if (!currentUser) return;
        try {
            const notifRef = collection(db, "users", currentUser.uid, "notifications");
            await addDoc(notifRef, {
                title, message, type,
                timestamp: serverTimestamp(),
                isRead: false
            });
        } catch (err) { console.error(err); }
    };

    const resetForm = () => {
        setFormData({ oldPin: "", newPin: "", confirmPin: "", amount: "", securityPin: "" });
        setActiveModal(null);
        setShowPinFields(false);
    };

    const handleNumberInput = (value: string, field: string) => {
        const onlyNums = value.replace(/[^0-9]/g, '');
        if (field === 'amount' && Number(onlyNums) > 200000) {
            toast.error("Maximum limit is 200,000 PKR", { id: "limit-err" });
            return;
        }
        setFormData(prev => ({ ...prev, [field]: onlyNums }));
    };

    const handleUpdateLimit = async () => {
        if (!formData.amount || !formData.securityPin) return toast.error("Please fill all fields");
        if (formData.securityPin !== userData?.pin) return toast.error("Incorrect Security PIN");
        
        try {
            const userRef = doc(db, "users", auth.currentUser!.uid);
            await updateDoc(userRef, { "cardDetails.limit": Number(formData.amount) });
            await sendNotification("Limit Updated", `New limit: ${formData.amount} PKR`, "limit");
            toast.success("Limit updated");
            resetForm();
        } catch (err) { toast.error("Update failed"); }
    };

    const handlePinSubmit = async () => {
        const { oldPin, newPin, confirmPin } = formData;
        if (newPin.length !== 4 || newPin !== confirmPin) return toast.error("PINs must match & be 4 digits");
        if (userData?.pin && oldPin !== userData.pin) return toast.error("Current PIN incorrect");

        try {
            const userRef = doc(db, "users", auth.currentUser!.uid);
            await updateDoc(userRef, { "cardDetails.pin": newPin });
            toast.success("PIN saved successfully");
            resetForm();
        } catch (err) { toast.error("Failed to save PIN"); }
    };

    if (loading) return <div className={styles.loader}><Loader2 className={styles.spin} /></div>;

    return (
        <LayoutShell headerTitle="My Virtual Card" showBack>
            <div className={styles.mainContainer}>
                
                {/* Virtual Card Section */}
                <div className={`${styles.virtualCard} ${userData?.isFrozen ? styles.frozenOverlay : ''}`}>
                    {userData?.isFrozen && <div className={styles.frozenTag}>FROZEN</div>}
                    <div className={styles.cardTop}>
                        <h2 className={styles.logoText}>FlowPay</h2>
                        <div className={styles.mastercircles}><div className={styles.circle1} /><div className={styles.circle2} /></div>
                    </div>
                    <div className={styles.cardNumberDisplay}>
                        {showFullDetails ? userData?.number : `••••  ••••  ••••  ${userData?.number.slice(-4)}`}
                    </div>
                    <div className={styles.cardBottom}>
                        <div className={styles.holderInfo}>
                            <span className={styles.label}>Card Holder</span>
                            <span className={styles.value}>{userData?.holder.toUpperCase()}</span>
                            <button className={styles.toggleBtn} onClick={() => setShowFullDetails(!showFullDetails)}>
                                {showFullDetails ? <EyeOff size={12} /> : <Eye size={12} />} Details
                            </button>
                        </div>
                        <p className={styles.visaText}>VISA</p>
                    </div>
                </div>

                {/* Tiles Section */}
                <div className={styles.actionGridSmall}>
                    <div className={styles.tile} onClick={() => setActiveModal('limit')}>
                        <div className={styles.tileIcon}><Landmark size={22} /></div>
                        <div className={styles.tileText}>
                            <span className={styles.tileLabel}>Daily Limit</span>
                            <span className={styles.tileValue}>{userData?.limit.toLocaleString()} PKR</span>
                        </div>
                    </div>
                    <div className={`${styles.tile} ${userData?.isFrozen ? styles.activeFreezeTile : ''}`} 
                         onClick={async () => {
                             const userRef = doc(db, "users", auth.currentUser!.uid);
                             await updateDoc(userRef, { "cardDetails.isFrozen": !userData?.isFrozen });
                             toast.success(userData?.isFrozen ? "Card Activated" : "Card Frozen");
                         }}>
                        <div className={styles.tileIcon}><Snowflake size={22} /></div>
                        <div className={styles.tileText}>
                            <span className={styles.tileLabel}>Status</span>
                            <span className={styles.tileValue}>{userData?.isFrozen ? "Frozen" : "Active"}</span>
                        </div>
                    </div>
                </div>

                <button className={styles.setPinBtn} onClick={() => setActiveModal('pin')}>
                    <Hash size={20} /> <span>{userData?.pin ? "Manage Security PIN" : "Setup Card PIN"}</span>
                    <PlusCircle size={18} />
                </button>

                {/* --- MODAL (SYNCED WITH CSS) --- */}
                {activeModal && (
                    <div className={styles.modalOverlay} onClick={resetForm}>
                        <div className={styles.modalSheet} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.sheetHeader}>
                                <h3>{activeModal === 'limit' ? 'Transaction Limit' : 'PIN Settings'}</h3>
                                <div className={styles.headerIcons}>
                                    <button className={styles.viewToggle} onClick={() => setShowPinFields(!showPinFields)}>
                                        {showPinFields ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                    <button className={styles.closeBtn} onClick={resetForm}><X size={20}/></button>
                                </div>
                            </div>
                            
                            <div className={styles.sheetBody}>
                                {activeModal === 'limit' ? (
                                    <>
                                        <div className={styles.inputWrapper}>
                                            <label>Daily Limit (PKR)</label>
                                            <input type="text" inputMode="numeric" value={formData.amount} 
                                            onChange={(e) => handleNumberInput(e.target.value, 'amount')} 
                                            className={styles.modalInput} placeholder="Enter amount"/>
                                            <div className={styles.limitRange}>
                                                <span className={styles.minLimit}>Min: 1,000</span>
                                                <span className={styles.maxLimit}>Max: 200,000</span>
                                            </div>
                                        </div>
                                        <div className={styles.inputWrapper}>
                                            <label>Confirm with Security PIN</label>
                                            <input type={showPinFields ? "text" : "password"} maxLength={4} inputMode="numeric" 
                                            value={formData.securityPin} onChange={(e) => handleNumberInput(e.target.value, 'securityPin')} 
                                            className={styles.modalInput} placeholder="••••"/>
                                        </div>
                                        <button className={styles.confirmBtn} onClick={handleUpdateLimit}>
                                            <ShieldCheck size={18}/> Update Limit
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        {userData?.pin && (
                                            <div className={styles.inputWrapper}>
                                                <label>Current PIN</label>
                                                <input type={showPinFields ? "text" : "password"} maxLength={4} value={formData.oldPin}
                                                onChange={(e) => handleNumberInput(e.target.value, 'oldPin')} className={styles.modalInput} placeholder="••••"/>
                                            </div>
                                        )}
                                        <div className={styles.inputWrapper}>
                                            <label>{userData?.pin ? 'New 4-Digit PIN' : 'Create 4-Digit PIN'}</label>
                                            <input type={showPinFields ? "text" : "password"} maxLength={4} value={formData.newPin}
                                            onChange={(e) => handleNumberInput(e.target.value, 'newPin')} className={styles.modalInput} placeholder="••••"/>
                                        </div>
                                        <div className={styles.inputWrapper}>
                                            <label>Confirm PIN</label>
                                            <input type={showPinFields ? "text" : "password"} maxLength={4} value={formData.confirmPin}
                                            onChange={(e) => handleNumberInput(e.target.value, 'confirmPin')} className={styles.modalInput} placeholder="••••"/>
                                        </div>
                                        <button className={styles.confirmBtn} onClick={handlePinSubmit}>
                                            <Lock size={18}/> Save PIN
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </LayoutShell>
    );
}