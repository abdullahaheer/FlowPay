'use client';

import React from 'react';
import { BottomNav } from './BottomNav';
import { Header } from './Header';

interface LayoutShellProps {
    children: React.ReactNode;
    headerTitle?: string;
    showBack?: boolean;
}

export const LayoutShell: React.FC<LayoutShellProps> = ({ children, headerTitle, showBack }) => {
    return (
        <div className="container">
            <BottomNav />
            <div className="mainContent">
                <Header title={headerTitle} showBack={showBack} />
                <main style={{ flex: 1, paddingBottom: 80 }}>
                    {children}
                </main>
            </div>
        </div>
    );
};
