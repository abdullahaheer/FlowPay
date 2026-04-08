"use client";
import React, { useState } from 'react';
import { LayoutShell } from '@/components/Layout/LayoutShell';
import toast from 'react-hot-toast';

export default function BankTransferPage() {
    const [bank, setBank] = useState('UBL');
    
    return (
        <LayoutShell headerTitle="Local Bank Transfer" showBack>
            <div style={{ padding: '25px', color: 'white' }}>
                <label>Select Bank</label>
                <select style={{ width: '100%', padding: '15px', margin: '10px 0 20px', borderRadius: '10px', background: '#112233', color: 'white' }} onChange={(e)=>setBank(e.target.value)}>
                    <option>UBL</option>
                    <option>HBL</option>
                    <option>SadaPay</option>
                    <option>NayaPay</option>
                </select>
                
                <label>IBAN / Account Number</label>
                <input style={{ width: '100%', padding: '15px', margin: '10px 0 20px', borderRadius: '10px', background: '#112233', color: 'white' }} placeholder="PK00XXXX..." />
                
                <button 
                    onClick={() => toast.success(`Request sent to ${bank}. Will be processed in 24h.`)}
                    style={{ width: '100%', padding: '15px', backgroundColor: '#4CAF50', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 'bold' }}
                >
                    Transfer to Bank
                </button>
            </div>
        </LayoutShell>
    );
}