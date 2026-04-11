'use client';
import React from 'react';
import { useRouter } from 'next/navigation';

export default function AboutPage() {
    const router = useRouter();

    return (
        <div style={{ padding: '24px', backgroundColor: '#ffffff', minHeight: '100vh', fontFamily: 'sans-serif', textAlign: 'center' }}>
            <header style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '60px', textAlign: 'left' }}>
                <button onClick={() => router.back()} style={{ border: 'none', background: '#f1f5f9', padding: '10px 15px', borderRadius: '10px', cursor: 'pointer' }}>←</button>
                <h2 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>About</h2>
            </header>
            
            <div style={{ width: '100px', height: '100px', background: '#10b981', color: '#fff', fontSize: '32px', fontWeight: 'bold', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 10px 20px rgba(16, 185, 129, 0.2)' }}>
                FP
            </div>
            
            <h3 style={{ fontSize: '24px', color: '#1e293b', marginBottom: '4px' }}>FlowPay</h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '32px' }}>Version 1.0.4 (Beta)</p>
            
            <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.6', maxWidth: '300px', margin: '0 auto' }}>
                The fastest and most secure way to send money, and manage your finances in Pakistan.
            </p>
            
            <div style={{ marginTop: 'auto', paddingTop: '100px', fontSize: '12px', color: '#94a3b8' }}>
                <p>© 2026 FlowPay Technologies Ltd.</p>
                <p>Made for the future of Digital Banking.</p>
            </div>
        </div>
    );
}