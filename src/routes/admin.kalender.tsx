import { createFileRoute } from '@tanstack/react-router';
import { AdminCalendarEditor } from '@/components/admin-calendar-editor';

export const Route = createFileRoute('/admin/kalender')({ component: AdminCalendarEditor });
