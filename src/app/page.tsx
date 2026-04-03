"use client";
import { useEffect } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Ye check karega ke user pehle se login hai ya nahi
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Agar login hai to Dashboard par bhej do
        router.push("/dashboard");
      } else {
        // Agar login nahi hai to Auth page par bhej do
        router.push("/auth");
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Loading screen jab tak check ho raha ho
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
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ marginBottom: '10px' }}>TapPay Vault</h2>
        <p style={{ opacity: 0.6 }}>Verifying session...</p>
      </div>
    </div>
  );
}