import { LayoutShell } from '@/components/Layout/LayoutShell';
import { CreditCard, CardControls, CardActions } from '@/components/Banking/Card';

export default function CardsPage() {
    return (
        <LayoutShell headerTitle="Cards" showBack>
            <div style={{ marginTop: 24 }}>
                <CreditCard />
                <CardControls />
                <CardActions />
            </div>
        </LayoutShell>
    );
}
