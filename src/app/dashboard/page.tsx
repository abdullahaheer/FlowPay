"use client"; 

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { LayoutShell } from '@/components/Layout/LayoutShell';
import { BalanceCard, ServicesGrid, PromoBanner, QuickServices } from '@/components/Banking/Dashboard';

export default function DashboardPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    // Session check karne wala listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Agar user login hai to page dikhao
        setAuthenticated(true);
      } else {
        // Agar logout hai ya session expire hai to foran auth par bhejo
        router.push('/auth');
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Jab tak authentication confirm nahi hoti, khali screen ya loader dikhao
  if (!authenticated) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        backgroundColor: '#001E3C',
        color: 'white' 
      }}>
        Verifying Session...
      </div>
    );
  }

  return (
    
    <LayoutShell>
      <BalanceCard />
      <div style={{ padding: '0 16px' }}>
      <PromoBanner />
      <ServicesGrid />
      <QuickServices />
      </div>
    </LayoutShell>
  );
}