'use client';
import React from 'react';
import { useRouter } from 'next/navigation';

export default function TermsPage() {
    const router = useRouter();

    return (
        <div style={{ padding: '24px', backgroundColor: '#ffffff', minHeight: '100vh', fontFamily: 'sans-serif' }}>
            <header style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <button onClick={() => router.back()} style={{ border: 'none', background: '#f1f5f9', padding: '10px 15px', borderRadius: '10px', cursor: 'pointer' }}>←</button>
                <h2 style={{ fontSize: '20px', fontWeight: '700', margin: 0 }}>Terms & Conditions</h2>
            </header>
            
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
                <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ color: '#1e293b', marginBottom: '8px' }}>1. Usage Policy</h4>
                    <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6' }}>By using FlowPay, you agree to our secure transaction policy. We monitor accounts for suspicious activity to ensure your safety.</p>
                </div>
                <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ color: '#1e293b', marginBottom: '8px' }}>2. Fees & Charges</h4>
                    <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6' }}>Transaction fees may apply depending on the service. These will always be shown before you confirm a payment.</p>
                </div>
                <div style={{ marginBottom: '0' }}>
                    <h4 style={{ color: '#1e293b', marginBottom: '8px' }}>3. Data Privacy</h4>
                    <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6' }}>We value your privacy. Your personal information is encrypted and never sold to third parties.</p>
                </div>
            </div>
        </div>
    );
}