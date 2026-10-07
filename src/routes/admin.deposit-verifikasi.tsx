import { createFileRoute } from '@tanstack/react-router';
import { AdminDepositVerification } from '@/components/admin-deposit-verification';

export const Route = createFileRoute('/admin/deposit-verifikasi')({ component: AdminDepositVerification });
