"use client";
import React, { useState } from 'react';
import { Mail, Lock, User, Wallet, Eye, EyeOff, Loader2 } from 'lucide-react';
import { initializeApp, getApps, getApp, FirebaseError } from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendEmailVerification,
  signOut 
} from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import toast, { Toaster } from 'react-hot-toast';

// Firebase Configuration
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  // --- Helper: Generate Random Card & Account Details ---
  const generateVaultDetails = () => {
    // 16 digit card: 4444 (FlowPay bin) + 12 random digits
    const cardNumber = "4444" + Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0');
    // Unique ID like FLP-XJ92
    const accountNumber = "FLP-" + Math.random().toString(36).toUpperCase().substring(2, 7);
    const cvv = Math.floor(100 + Math.random() * 900).toString();
    return { cardNumber, accountNumber, cvv };
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !name)) {
      toast.error("Please fill all fields");
      return;
    }
    setLoading(true);

    try {
      if (isLogin) {
        const res = await signInWithEmailAndPassword(auth, email.trim(), password);
        
        if (!res.user.emailVerified) {
          toast.error("Email not verified! Check your inbox.");
          await signOut(auth);
          setLoading(false);
          return;
        }

        setTimeout(() => router.push("/dashboard"), 1200); 
      } else {
        const res = await createUserWithEmailAndPassword(auth, email.trim(), password);
        
        // Email verification link bhejain
        await sendEmailVerification(res.user);
        
        // Vault (Card & Account) details generate karein
        const { cardNumber, accountNumber, cvv } = generateVaultDetails();

        // Firestore mein user document create karein
        await setDoc(doc(db, "users", res.user.uid), {
          uid: res.user.uid,
          name: name,
          email: email.trim(),
          balance: 1099.25, // Starting balance
          accountNumber: accountNumber,
          cardDetails: {
            number: cardNumber,
            expiry: "12/28",
            cvv: cvv,
            status: "active",
            cardHolder: name
          },
          isVerified: false,
          createdAt: new Date()
        });

        toast.success("Vault Created! Verify email to access your card.");
        setIsLogin(true); 
      }
    } catch (err) {
      const error = err as FirebaseError;
      if (error.code === 'auth/email-already-in-use') toast.error("Email already in use!");
      else if (error.code === 'auth/invalid-email') toast.error("Invalid email format!");
      else if (error.code === 'auth/invalid-credential') toast.error("Wrong email or password!");
      else toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Styles ---
  const styles: { [key: string]: React.CSSProperties } = {
    wrapper: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', width: '100%', backgroundColor: '#001E3C', padding: '20px', boxSizing: 'border-box', fontFamily: 'sans-serif' },
    card: { width: '100%', maxWidth: '400px', backgroundColor: 'white', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' },
    header: { padding: '40px 20px 20px', textAlign: 'center' },
    logoBox: { background: '#4CAF50', width: '60px', height: '60px', borderRadius: '18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px', boxShadow: '0 8px 16px rgba(76, 175, 80, 0.2)' },
    formArea: { padding: '20px 30px 40px' },
    tabContainer: { display: 'flex', backgroundColor: '#F3F4F6', padding: '5px', borderRadius: '14px', marginBottom: '25px' },
    inputWrapper: { position: 'relative', marginBottom: '16px' },
    input: { width: '100%', padding: '14px 45px 14px 45px', borderRadius: '12px', border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB', outline: 'none', boxSizing: 'border-box', fontSize: '15px', color: '#333' },
    iconLeft: { position: 'absolute', left: '15px', top: '15px', color: '#9CA3AF' },
    iconRight: { position: 'absolute', right: '15px', top: '15px', color: '#9CA3AF', cursor: 'pointer' },
    submitBtn: { width: '100%', padding: '15px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '600', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: '0.3s' }
  };

  const getTabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '10px', border: 'none', borderRadius: '10px', cursor: 'pointer',
    backgroundColor: active ? 'white' : 'transparent',
    fontWeight: '600', color: active ? '#001E3C' : '#6B7280',
    transition: '0.3s'
  });

  return (
    <div style={styles.wrapper}>
      <Toaster position="top-center" />
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoBox}><Wallet color="white" size={32} /></div>
          <h2 style={{ margin: 0, color: '#001E3C', fontSize: '26px', fontWeight: 'bold' }}>FlowPay</h2>
          <p style={{ margin: '5px 0 0', color: '#6B7280', fontSize: '14px' }}>Your Secure Digital Vault</p>
        </div>

        <div style={styles.formArea}>
          <div style={styles.tabContainer}>
            <button onClick={() => setIsLogin(true)} style={getTabStyle(isLogin)}>Login</button>
            <button onClick={() => setIsLogin(false)} style={getTabStyle(!isLogin)}>Sign Up</button>
          </div>

          <form onSubmit={handleAuth} autoComplete="off">
            {!isLogin && (
              <div style={styles.inputWrapper}>
                <User style={styles.iconLeft} size={20} />
                <input type="text" placeholder="Full Name" style={styles.input} onChange={(e) => setName(e.target.value)} required />
              </div>
            )}
            
            <div style={styles.inputWrapper}>
              <Mail style={styles.iconLeft} size={20} />
              <input type="email" placeholder="Email Address" style={styles.input} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div style={styles.inputWrapper}>
              <Lock style={styles.iconLeft} size={20} />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Password" 
                style={styles.input} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
              <div onClick={() => setShowPassword(!showPassword)} style={styles.iconRight}>
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </div>
            </div>

            <button 
              type="submit"
              style={{...styles.submitBtn, opacity: loading ? 0.7 : 1}} 
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? 'Sign In' : 'Create Vault')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}