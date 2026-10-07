import { createFileRoute } from '@tanstack/react-router';
import { AdminCustomerServiceEditor } from '@/components/admin-customer-service-editor';

export const Route = createFileRoute('/admin/layanan')({ component: AdminCustomerServiceEditor });
