"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { LayoutShell } from '@/components/Layout/LayoutShell';
import { CreditCard, CardControls, CardActions } from '@/components/Banking/Card';

export default function CardsPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    // Firebase auth listener check karega ke user login hai ya nahi
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthenticated(true);
      } else {
        // Agar user login nahi hai to login page par bhej do
        router.push('/auth');
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Loading state jab tak authentication confirm na ho jaye
  if (!authenticated) {
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
        Verifying Session...
      </div>
    );
  }

  // Final UI jo sirf logged-in user ko dikhega
  return (
    <LayoutShell headerTitle="Cards" showBack>
      <div style={{ marginTop: 24, padding: '0 16px' }}>
        <CreditCard />
        <CardControls />
        <CardActions />
      </div>
    </LayoutShell>
  );
}