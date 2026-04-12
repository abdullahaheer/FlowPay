"use client";
import React, { useState, useEffect } from 'react';
import { db, auth } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { LayoutShell } from '@/components/Layout/LayoutShell';
import { 
    Eye, EyeOff, Snowflake, Landmark, PlusCircle, X, 
    ShieldCheck, Lock, RefreshCcw, Loader2,
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

// Card number ko 4-4 digits ke gap se dikhane ke liye
const formatCardNumber = (num: string) => {
    const digits = num.replace(/\D/g, ''); 
    return digits.replace(/(\d{4})/g, '$1 ').trim(); 
};

export default function CardsPage() {
    const [userData, setUserData] = useState<CardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isVerifying, setIsVerifying] = useState(false);
    const [showFullDetails, setShowFullDetails] = useState(false);
    const [showPinText, setShowPinText] = useState(false);
    const [showPassText, setShowPassText] = useState(false); 
    
    const [activeModal, setActiveModal] = useState<'limit' | 'pin' | 'reset-pin' | null>(null);
    const [resetStep, setResetStep] = useState(1); 

    const [formData, setFormData] = useState({
        oldPin: "",
        newPin: "",
        confirmPin: "",
        amount: "",
        securityPin: "",
        loginPassword: ""
    });

    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, (user) => {
            if (user) {
                const docRef = doc(db, "users", user.uid);
                const unsubSnap = onSnapshot(docRef, (snap) => {
                    if (snap.exists()) {
                        const data = snap.data();
                        setUserData({
                            number: data.cardDetails?.number || "4213000000000000",
                            holder: data.name || "User Name",
                            expiry: data.cardDetails?.expiry || "12/30",
                            cvv: data.cardDetails?.cvv || "000",
                            isFrozen: data.cardDetails?.isFrozen || false,
                            pin: data.cardDetails?.pin || "",
                            limit: data.cardDetails?.limit ?? 50000
                        });
                    }
                    setLoading(false);
                }, () => {
                    toast.error("Failed to fetch card data");
                    setLoading(false);
                });
                return () => unsubSnap();
            } else {
                setLoading(false);
            }
        });
        return () => unsubAuth();
    }, []);

    const resetForm = () => {
        setActiveModal(null);
        setResetStep(1);
        setShowPinText(false);
        setShowPassText(false);
        setIsVerifying(false);
        setFormData({ oldPin: "", newPin: "", confirmPin: "", amount: "", securityPin: "", loginPassword: "" });
    };

    const handleNumberInput = (value: string, field: string) => {
        const onlyNums = value.replace(/[^0-9]/g, '');
        if (field === 'amount' && Number(onlyNums) > 200000) return;
        setFormData(prev => ({ ...prev, [field]: onlyNums }));
    };

    const verifyLoginPassword = async () => {
        const user = auth.currentUser;
        if (!user || !user.email) return;
        setIsVerifying(true);
        const loadToast = toast.loading("Verifying Identity...");
        try {
            const credential = EmailAuthProvider.credential(user.email, formData.loginPassword);
            await reauthenticateWithCredential(user, credential);
            toast.success("Identity Verified!", { id: loadToast });
            setResetStep(2); 
            setIsVerifying(false);
        } catch {
            setIsVerifying(false);
            toast.error("Invalid Password", { id: loadToast });
        }
    };

    const handleFinalReset = async () => {
        if (formData.newPin.length !== 4) return toast.error("PIN must be 4 digits");
        setIsVerifying(true);
        try {
            const userRef = doc(db, "users", auth.currentUser!.uid);
            await updateDoc(userRef, { "cardDetails.pin": formData.newPin });
            toast.success("Card PIN updated!");
            resetForm();
        } catch { 
            toast.error("Failed to update PIN"); 
            setIsVerifying(false);
        }
    };

    const handleUpdateLimit = async () => {
        if (formData.securityPin !== userData?.pin) return toast.error("Incorrect Card PIN");
        setIsVerifying(true);
        try {
            const userRef = doc(db, "users", auth.currentUser!.uid);
            await updateDoc(userRef, { "cardDetails.limit": Number(formData.amount) });
            toast.success("Limit updated!");
            resetForm();
        } catch { 
            toast.error("Update failed"); 
            setIsVerifying(false);
        }
    };

    if (loading) return <div className={styles.loader}><Loader2 className={styles.spin} size={40} /></div>;

    return (
        <LayoutShell headerTitle="Card Security" showBack>
            <div className={styles.mainContainer}>
                
                {/* --- VIRTUAL CARD --- */}
                <div className={`${styles.virtualCard} ${userData?.isFrozen ? styles.frozenOverlay : ''}`}>
                    {userData?.isFrozen && <div className={styles.frozenTag}>FROZEN</div>}
                    
                    <div className={styles.cardTop}>
                        <h2 className={styles.logoText}>FlowPay</h2>
                        <div className={styles.mastercircles}>
                            <div className={styles.circle1} /><div className={styles.circle2} />
                        </div>
                    </div>

                    {/* Card Number Display */}
                    <div className={styles.cardNumberDisplay}>
                        {showFullDetails ? (
                            formatCardNumber(userData?.number || "")
                        ) : (
                            <div >
                                <span>••••</span> <span>••••</span> <span>••••</span> <span>{userData?.number.slice(-4)}</span>
                            </div>
                        )}
                    </div>

                    <div className={styles.cardBottom}>
                        <div className={styles.holderInfo}>
                            <span className={styles.value}>{userData?.holder.toUpperCase()}</span>
                        </div>
                        
                        {/* Expiry Section */}
                        <div className={styles.holderInfo}>
                            <span className={styles.label}>Expiry </span>
                            <span className={styles.value}>{userData?.expiry}</span>
                        </div>

                        {/* CVV Section */}
                        <div className={styles.holderInfo}>
                            <span className={styles.label}>CVV </span>
                            <span className={styles.value} style={{ letterSpacing: showFullDetails ? '2px' : '0' }}>
                                {showFullDetails ? userData?.cvv : "•••"}
                            </span>
                        </div>

                        {/* Toggle Button for Masking */}
                        <button className={styles.toggleBtn} onClick={() => setShowFullDetails(!showFullDetails)}>
                            {showFullDetails ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>

                {/* --- QUICK ACTIONS --- */}
                <div className={styles.actionGridSmall} style={{marginTop: '20px'}}>
                    <div className={styles.tile} onClick={() => setActiveModal('limit')}>
                        <div className={styles.tileIcon}><Landmark size={20} /></div>
                        <div className={styles.tileText}>
                            <span className={styles.tileLabel}>Daily Limit</span>
                            <span className={styles.tileValue}>{userData?.limit.toLocaleString()} PKR</span>
                        </div>
                    </div>
                    <div className={`${styles.tile} ${userData?.isFrozen ? styles.activeFreezeTile : ''}`} 
                         onClick={async () => {
                             try {
                                 const userRef = doc(db, "users", auth.currentUser!.uid);
                                 await updateDoc(userRef, { "cardDetails.isFrozen": !userData?.isFrozen });
                                 toast.success(userData?.isFrozen ? "Card Unfrozen" : "Card Frozen");
                             } catch { toast.error("Failed"); }
                         }}>
                        <div className={styles.tileIcon}><Snowflake size={20} /></div>
                        <div className={styles.tileText}>
                            <span className={styles.tileLabel}>Status</span>
                            <span className={styles.tileValue}>{userData?.isFrozen ? "Frozen" : "Active"}</span>
                        </div>
                    </div>
                </div>

                {/* --- PIN MANAGEMENT --- */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' }}>
                    <button className={styles.setPinBtn} onClick={() => setActiveModal('pin')}>
                        <Lock size={18} />
                        <span>{userData?.pin ? "Update Card PIN" : "Setup Card PIN"}</span>
                        <PlusCircle size={18} />
                    </button>
                    {userData?.pin && (
                        <button className={styles.setPinBtn} onClick={() => setActiveModal('reset-pin')} style={{background: '#64748b'}}>
                            <RefreshCcw size={18} />
                            <span>Forgot PIN? Reset with Password</span>
                        </button>
                    )}
                </div>

                {/* --- MODALS LOGIC --- */}
                {activeModal && (
                    <div className={styles.modalOverlay} onClick={resetForm}>
                        <div className={styles.modalSheet} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.sheetHeader}>
                                <h3>{activeModal === 'reset-pin' ? 'Security' : 'Settings'}</h3>
                                <button className={styles.closeBtn} onClick={resetForm}><X size={20}/></button>
                            </div>
                            <div className={styles.sheetBody}>
                                {activeModal === 'limit' && (
                                    <>
                                        <div className={styles.inputWrapper}>
                                            <label>New Limit (PKR)</label>
                                            <input type="text" value={formData.amount} onChange={(e) => handleNumberInput(e.target.value, 'amount')} className={styles.modalInput} placeholder="50000"/>
                                        </div>
                                        <div className={styles.inputWrapper}>
                                            <label>Card PIN</label>
                                            <div className={styles.inputContainer}>
                                                <input type={showPinText ? "text" : "password"} maxLength={4} value={formData.securityPin} onChange={(e) => handleNumberInput(e.target.value, 'securityPin')} className={styles.modalInput} placeholder="••••" style={{letterSpacing: '8px'}}/>
                                                <button onClick={() => setShowPinText(!showPinText)} className={styles.eyeInside}>{showPinText ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
                                            </div>
                                        </div>
                                        <button className={styles.confirmBtn} onClick={handleUpdateLimit} disabled={isVerifying}>
                                            {isVerifying ? <Loader2 className={styles.spin} size={18}/> : <ShieldCheck size={18}/>}
                                            Update Limit
                                        </button>
                                    </>
                                )}

                                {activeModal === 'pin' && (
                                    <>
                                        {userData?.pin && (
                                            <div className={styles.inputWrapper}>
                                                <label>Old Card PIN</label>
                                                <input type="password" maxLength={4} value={formData.oldPin} onChange={(e) => handleNumberInput(e.target.value, 'oldPin')} className={styles.modalInput} placeholder="••••" style={{letterSpacing: '8px'}}/>
                                            </div>
                                        )}
                                        <div className={styles.inputWrapper}>
                                            <label>New 4-Digit PIN</label>
                                            <div className={styles.inputContainer}>
                                                <input type={showPinText ? "text" : "password"} maxLength={4} value={formData.newPin} onChange={(e) => handleNumberInput(e.target.value, 'newPin')} className={styles.modalInput} placeholder="••••" style={{letterSpacing: '8px'}}/>
                                                <button onClick={() => setShowPinText(!showPinText)} className={styles.eyeInside}>{showPinText ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
                                            </div>
                                        </div>
                                        <button className={styles.confirmBtn} onClick={handleFinalReset} disabled={isVerifying}>Save PIN</button>
                                    </>
                                )}

                                {activeModal === 'reset-pin' && (
                                    resetStep === 1 ? (
                                        <div>
                                            <div className={styles.inputWrapper}>
                                                <label>Login Password</label>
                                                <div className={styles.inputContainer}>
                                                    <input type={showPassText ? "text" : "password"} value={formData.loginPassword} onChange={e => setFormData({...formData, loginPassword: e.target.value})} className={styles.modalInput} placeholder="Account Password"/>
                                                    <button onClick={() => setShowPassText(!showPassText)} className={styles.eyeInside}>{showPassText ? <EyeOff size={18}/> : <Eye size={18}/>}</button>
                                                </div>
                                            </div>
                                            <button className={styles.confirmBtn} onClick={verifyLoginPassword} disabled={isVerifying}>Verify Identity</button>
                                        </div>
                                    ) : (
                                        <div>
                                            <div className={styles.inputWrapper}>
                                                <label>New 4-Digit PIN</label>
                                                <input type="password" maxLength={4} value={formData.newPin} onChange={(e) => handleNumberInput(e.target.value, 'newPin')} className={styles.modalInput} placeholder="••••" style={{letterSpacing: '8px'}}/>
                                            </div>
                                            <button className={styles.confirmBtn} onClick={handleFinalReset} disabled={isVerifying}>Reset PIN Now</button>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </LayoutShell>
    );
}