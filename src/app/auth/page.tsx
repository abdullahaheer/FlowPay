"use client";

import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, Loader2, CreditCard, Calendar, MapPin, ArrowLeft, Phone } from 'lucide-react';
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut 
} from "firebase/auth";
import { getFirestore, doc, setDoc, Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import toast, { Toaster } from 'react-hot-toast';
import Image from 'next/image';

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyAVTxHT-UL9YQuRpkARwYEfUlvvwTkN6Sk",
  authDomain: "nextjs-auth-96086.firebaseapp.com",
  projectId: "nextjs-auth-96086",
  storageBucket: "nextjs-auth-96086.firebasestorage.app",
  messagingSenderId: "558158470048",
  appId: "1:558158470048:web:eb3f6c984423b1380462c5",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    cnic: '',
    dob: '',
    city: '',
    phone: ''
  });

  // --- Validations ---
  const validateCNIC = (cnic: string) => /^[0-9]{5}-[0-9]{7}-[0-9]{1}$/.test(cnic);
  const validatePhone = (phone: string) => /^03[0-9]{9}$/.test(phone);
  const validateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age >= 18;
  };

  const handleCnicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 13) val = val.substring(0, 13);
    let formatted = val;
    if (val.length > 5 && val.length <= 12) formatted = `${val.slice(0, 5)}-${val.slice(5)}`;
    else if (val.length > 12) formatted = `${val.slice(0, 5)}-${val.slice(5, 12)}-${val.slice(12)}`;
    setFormData({...formData, cnic: formatted});
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) return toast.error("Please enter your email");
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, formData.email.trim());
      toast.success("Password reset link sent to your email!");
      setIsForgotMode(false);
    } catch  {
      toast.error( "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const res = await signInWithEmailAndPassword(auth, formData.email.trim(), formData.password);
        if (!res.user.emailVerified) {
          toast.error("Please verify your email first!");
          await signOut(auth);
          setLoading(false);
          return;
        }
        router.push("/dashboard");
      } else {
        // Sign Up Validations
        if (!validateCNIC(formData.cnic)) throw new Error("Invalid CNIC Format (XXXXX-XXXXXXX-X)");
        if (!validatePhone(formData.phone)) throw new Error("Invalid Phone (03xxxxxxxxx)");
        if (!validateAge(formData.dob)) throw new Error("Minimum age 18 required");
        
        const res = await createUserWithEmailAndPassword(auth, formData.email.trim(), formData.password);
        await sendEmailVerification(res.user);

        const accountNumber = "FLP-" + Math.random().toString(36).toUpperCase().substring(2, 7);

        await setDoc(doc(db, "users", res.user.uid), {
          uid: res.user.uid,
          name: formData.name,
          email: formData.email.trim(),
          phone: formData.phone,
          cnic: formData.cnic,
          dob: formData.dob,
          city: formData.city,
          balance: 1000.00,
          accountNumber,
          isVerified: false,
          createdAt: Timestamp.now()
        });

        toast.success("Verification email sent! Check inbox.");
        setIsLogin(true);
      }
    } catch {
      toast.error("Authentication Failed");
    } finally {
      setLoading(false);
    }
  };

  const styles: { [key: string]: React.CSSProperties } = {
    wrapper: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#001E3C', padding: '20px', fontFamily: 'sans-serif' },
    logoBox: { background: '#4CAF50', padding: '15px', borderRadius: '24px', display: 'inline-flex', marginBottom: '15px', boxShadow: '0 10px 25px rgba(76, 175, 80, 0.3)', border: '4px solid rgba(255, 255, 255, 0.1)' },
    card: { width: '100%', maxWidth: '450px', background: 'rgba(10, 22, 34, 0.85)', borderRadius: '32px', padding: '35px', border: '1px solid rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(12px)' },
    input: { width: '100%', padding: '14px 48px', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.05)', outline: 'none', color: 'white', fontSize: '14px' },
    inputWrapper: { position: 'relative', marginBottom: '14px' },
    iconLeft: { position: 'absolute', left: '16px', top: '14px', color: '#4CAF50' },
    btn: { width: '100%', padding: '16px', background: 'linear-gradient(135deg, #4CAF50, #2d5a2d)', color: 'white', border: 'none', borderRadius: '14px', fontWeight: '700', cursor: 'pointer', marginTop: '10px' }
  };

  return (
    <div style={styles.wrapper}>
      <Toaster position="top-center" />
      
      {/* --- Header Section --- */}
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <div style={styles.logoBox}>
          <Image src="/logo.png" alt="Logo" width={60} height={60} style={{ borderRadius: '12px' }} />
        </div>
        <h1 style={{ color: 'white', fontSize: '32px', fontWeight: '800', margin: 0 }}>FlowPay</h1>
        <p style={{ color: '#9CA3AF', fontSize: '15px', marginTop: '4px' }}>Your Secure Digital Vault</p>
      </div>

      <div style={styles.card}>
        {isForgotMode && (
          <button onClick={() => setIsForgotMode(false)} style={{ background: 'none', border: 'none', color: '#4CAF50', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', marginBottom: '20px', fontWeight: '600' }}>
            <ArrowLeft size={18} /> Back to Login
          </button>
        )}

        {!isForgotMode && (
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '5px', borderRadius: '14px', marginBottom: '25px' }}>
            <button onClick={() => setIsLogin(true)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: isLogin ? '#4CAF50' : 'transparent', color: 'white', fontWeight: '700', cursor: 'pointer' }}>Login</button>
            <button onClick={() => setIsLogin(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: !isLogin ? '#4CAF50' : 'transparent', color: 'white', fontWeight: '700', cursor: 'pointer' }}>Join Vault</button>
          </div>
        )}

        {isForgotMode ? (
          <form onSubmit={handleResetPassword}>
            <h2 style={{ color: 'white', fontSize: '20px', marginBottom: '10px' }}>Reset Password</h2>
            <p style={{ color: '#9CA3AF', fontSize: '13px', marginBottom: '20px' }}>Enter email for reset link.</p>
            <div style={styles.inputWrapper}><Mail style={styles.iconLeft} size={18} /><input type="email" placeholder="Email Address" style={styles.input} onChange={(e) => setFormData({...formData, email: e.target.value})} required /></div>
            <button type="submit" disabled={loading} style={styles.btn}>{loading ? <Loader2 className="animate-spin" /> : 'Send Reset Link'}</button>
          </form>
        ) : (
          <form onSubmit={handleAuth}>
            {!isLogin && (
              <>
                <div style={styles.inputWrapper}><User style={styles.iconLeft} size={18} /><input type="text" placeholder="Full Name" style={styles.input} onChange={(e) => setFormData({...formData, name: e.target.value})} required /></div>
                <div style={styles.inputWrapper}><Phone style={styles.iconLeft} size={18} /><input type="text" placeholder="Phone (03xxxxxxxxx)" style={styles.input} onChange={(e) => setFormData({...formData, phone: e.target.value})} required /></div>
                <div style={styles.inputWrapper}><CreditCard style={styles.iconLeft} size={18} /><input type="text" placeholder="CNIC (12345-1234567-1)" value={formData.cnic} style={styles.input} onChange={handleCnicChange} required /></div>
                <div style={styles.inputWrapper}><MapPin style={styles.iconLeft} size={18} /><input type="text" placeholder="City" style={styles.input} onChange={(e) => setFormData({...formData, city: e.target.value})} required /></div>
                <div style={styles.inputWrapper}><Calendar style={styles.iconLeft} size={18} /><input type="date" style={{...styles.input, colorScheme: 'dark'}} onChange={(e) => setFormData({...formData, dob: e.target.value})} required /></div>
              </>
            )}

            <div style={styles.inputWrapper}><Mail style={styles.iconLeft} size={18} /><input type="email" placeholder="Email Address" style={styles.input} onChange={(e) => setFormData({...formData, email: e.target.value})} required /></div>
            <div style={styles.inputWrapper}>
              <Lock style={styles.iconLeft} size={18} />
              <input type={showPassword ? "text" : "password"} placeholder="Password" style={styles.input} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
              <div onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '16px', top: '14px', cursor: 'pointer', color: '#9CA3AF' }}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</div>
            </div>

            {isLogin && (
              <div style={{ textAlign: 'right', marginBottom: '15px' }}>
                <span onClick={() => setIsForgotMode(true)} style={{ color: '#4CAF50', fontSize: '13px', cursor: 'pointer', fontWeight: '600' }}>Forgot Password?</span>
              </div>
            )}

            <button type="submit" disabled={loading} style={styles.btn}>
              {loading ? <Loader2 className="animate-spin" /> : (isLogin ? 'Sign In' : 'Secure My Vault')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}