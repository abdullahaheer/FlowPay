"use client";
import { useEffect } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react"; // Spinner icon

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push("/dashboard");
      } else {
        router.push("/auth");
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <div style={{
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: '#001E3C',
      color: 'white',
      fontFamily: 'sans-serif'
    }}>
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Animated Spinner */}
        <Loader2 size={48} className="animate-spin" style={{ color: '#4CAF50', marginBottom: '20px' }} />
        
        <h2 style={{ marginBottom: '5px', fontSize: '24px', fontWeight: '700' }}>FlowPay</h2>
        <p style={{ opacity: 0.6, fontSize: '14px' }}>Verifying secure session...</p>
      </div>

      {/* Spinner ki animation ke liye CSS */}
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}