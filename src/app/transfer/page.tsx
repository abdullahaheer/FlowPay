'use client';

import React, { useState } from 'react';
import { LayoutShell } from '@/components/Layout/LayoutShell';
import { Button } from '@/components/UI/Button';
import styles from './Transfer.module.css';

type Step = 'contacts' | 'amount' | 'summary' | 'verification' | 'success';

export default function TransferFlow() {
    const [step, setStep] = useState<Step>('contacts');
    const [amount, setAmount] = useState('150.00');

    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('');

    const contactGroups = [
        {
            letter: 'A',
            contacts: [
                { name: 'Abrar Mohammed', phone: '0543048521', type: 'direct' },
                { name: 'Ahlam Mustafa', phone: '0509371057', type: 'invite' },
                { name: 'Anwar Zeyad', phone: '0592750174', type: 'invite' },
                { name: 'Asmaa Ali', phone: '0500203055', type: 'direct' },
            ]
        },
        {
            letter: 'B',
            contacts: [
                { name: 'Basma Abdulaziz', phone: '+966553030123', type: 'direct' },
                { name: 'Bayan Rayan', phone: '0548090701', type: 'invite' },
            ]
        },
        {
            letter: 'C',
            contacts: [
                { name: 'Camelia Jalal', phone: '0535678901', type: 'direct' },
                { name: 'Casie', phone: '0569483720', type: 'invite' },
            ]
        },
        {
            letter: 'D',
            contacts: [
                { name: 'Dania Abdulqader', phone: '0547044205', type: 'direct' },
            ]
        }
    ];

    const renderContacts = () => (
        <div className={styles.contactsList}>
            <div className={styles.searchBar} style={{ marginBottom: 16 }}>
                <span>🔍</span>
                <input type="text" placeholder="Search by name or number" />
                <span className={styles.qrIcon}>🔳</span>
            </div>

            <button className={styles.unsavedNumberBtn}>
                <span style={{ fontSize: 20 }}>👤+</span> Transfer to Unsaved Number
            </button>

            {contactGroups.map(group => (
                <div key={group.letter}>
                    <div className={styles.sectionHeader}>{group.letter}</div>
                    <div className={styles.contactCard}>
                        {group.contacts.map((contact, idx) => (
                            <div
                                key={idx}
                                className={styles.contactRow}
                                onClick={() => contact.type === 'direct' && setStep('amount')}
                            >
                                <div className={styles.avatar}>
                                    {contact.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div className={styles.contactInfo}>
                                    <span className={styles.contactName}>{contact.name}</span>
                                    <span className={styles.contactPhone}>{contact.phone}</span>
                                </div>
                                {contact.type === 'direct' ? (
                                    <span style={{ color: 'var(--medium-grey)' }}>&gt;</span>
                                ) : (
                                    <button className={styles.inviteBtn}>+ invite</button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            <div className={styles.sidebarContainer}>
                {alphabet.map(letter => (
                    <span key={letter} className={styles.alphabetLetter}>{letter}</span>
                ))}
            </div>
        </div>
    );

    const renderAmount = () => (
        <div className={styles.amountContainer}>
            <div className={styles.balanceInfo}>
                <span style={{ color: 'var(--medium-grey)' }}>Available Account Balance</span>
                <span style={{ fontWeight: 600 }}>1099.25 PKR</span>
            </div>
            <div className={styles.amountInput}>
                <span style={{ fontSize: 12, color: 'var(--medium-grey)' }}>Transfer amount</span>
                <div className={styles.amountVal}>
                    <input
                        type="text"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                    <span>PKR</span>
                    <span style={{ fontSize: 18 }}>✏️</span>
                </div>
            </div>
            <div className={styles.purposeSelect}>
                <div style={{ fontSize: 12, color: 'var(--medium-grey)', marginBottom: 8 }}>Purpose of transfer</div>
                <div style={{ fontWeight: 600 }}>Friends and family expenses</div>
            </div>
            <Button fullWidth onClick={() => setStep('summary')} style={{ marginTop: 'auto' }}>
                Continue
            </Button>
        </div>
    );

    const renderSummary = () => (
        <div className={styles.amountContainer}>
            <div className={styles.summaryCard}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: 'var(--medium-grey)' }}>Transfer amount</div>
                    <div style={{ fontSize: 24, fontWeight: 700 }}>{amount} PKR</div>
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid var(--bg-grey)' }} />
                <div>
                    <div style={{ fontSize: 12, color: 'var(--medium-grey)' }}>To</div>
                    <div style={{ fontWeight: 600 }}>Abrar Mohammed</div>
                </div>
                <div>
                    <div style={{ fontSize: 12, color: 'var(--medium-grey)' }}>Purpose Of Transfer</div>
                    <div style={{ fontWeight: 600 }}>Friends And Family Expenses</div>
                </div>
                <div>
                    <div style={{ fontSize: 12, color: 'var(--medium-grey)' }}>Transfer Fee</div>
                    <div style={{ fontWeight: 600, color: 'var(--secondary-green)' }}>Free</div>
                </div>
            </div>
            <Button fullWidth onClick={() => setStep('verification')} style={{ marginTop: 24 }}>
                Confirm
            </Button>
        </div >
    );

    const renderVerification = () => (
        <div className={styles.amountContainer}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>📱</div>
                <div style={{ fontWeight: 600 }}>Verification</div>
                <div style={{ fontSize: 14, color: 'var(--medium-grey)', marginTop: 8 }}>
                    Please enter the SMS code sent to <br /> 0540540540
                </div>
            </div>
            <div className={styles.otpGrid}>
                <div className={styles.otpBox}>0</div>
                <div className={styles.otpBox}></div>
                <div className={styles.otpBox}></div>
                <div className={styles.otpBox}></div>
            </div>
            <div style={{ textAlign: 'center', fontSize: 14, color: 'var(--medium-grey)' }}>
                Time remaining: 04m 58s
            </div>
            <Button fullWidth onClick={() => setStep('success')} style={{ marginTop: 24 }}>
                Verify
            </Button>
        </div>
    );

    const renderSuccess = () => (
        <div className={styles.successScreen}>
            <div className={styles.successIcon}>✓</div>
            <h2 style={{ fontSize: 24, fontWeight: 700 }}>Transfer Sent</h2>
            <div className={styles.summaryCard} style={{ textAlign: 'left' }}>
                <div>
                    <div style={{ fontSize: 10, color: 'var(--medium-grey)' }}>Amount</div>
                    <div style={{ fontWeight: 600 }}>{amount} PKR</div>
                </div>
                <div>
                    <div style={{ fontSize: 10, color: 'var(--medium-grey)' }}>To</div>
                    <div style={{ fontWeight: 600 }}>Abrar Mohammed</div>
                </div>
            </div>
            <Button fullWidth variant="primary" onClick={() => window.location.href = '/'}>
                Go Home
            </Button>
        </div>
    );

    const getTitle = () => {
        switch (step) {
            case 'contacts': return 'Transfer to Contacts';
            case 'amount': return 'Transfer to Contacts';
            case 'summary': return 'Transfer summary';
            case 'verification': return 'Verification';
            case 'success': return '';
            default: return 'Transfer';
        }
    }

    return (
        <LayoutShell headerTitle={getTitle()} showBack={step !== 'success'}>
            {step === 'contacts' && renderContacts()}
            {step === 'amount' && renderAmount()}
            {step === 'summary' && renderSummary()}
            {step === 'verification' && renderVerification()}
            {step === 'success' && renderSuccess()}
        </LayoutShell>
    );
}
