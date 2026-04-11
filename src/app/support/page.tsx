'use client';
import React from 'react';
import { useRouter } from 'next/navigation';

export default function SupportPage() {
    const router = useRouter();

    return (
        <div style={{ padding: '24px', backgroundColor: '#ffffff', minHeight: '100vh', fontFamily: 'sans-serif', color: '#1e293b' }}>
            <header style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <button onClick={() => router.back()} style={{ border: 'none', background: '#f1f5f9', padding: '10px 15px', borderRadius: '10px', fontSize: '18px', cursor: 'pointer' }}>←</button>
                <h2 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Support</h2>
            </header>
            
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '40px', background: '#ecfdf5', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '1px solid #10b981' }}>🎧</div>
                <h3 style={{ fontSize: '22px', marginBottom: '8px' }}>How can we help?</h3>
                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '32px' }}>Our support team is available to assist you.</p>
                
                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', marginBottom: '16px', textAlign: 'left', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>Email Support</h4>
                    <p style={{ margin: 0, color: '#10b981', fontWeight: '600' }}>support@flowpay.com</p>
                </div>
                
                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', marginBottom: '16px', textAlign: 'left', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>Helpline</h4>
                    <p style={{ margin: 0, color: '#10b981', fontWeight: '600' }}>+92 300 0000111</p>
                </div>
            </div>
        </div>
    );
}