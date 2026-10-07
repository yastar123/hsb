import { createContext, useContext, type ReactNode } from 'react';
import { useServerContent, type SaveStatus } from '@/lib/site-content';

export type CustomerServiceItem = {
  id: string;
  title: string;
  value: string;
  buttonLabel: string;
  href: string;
};
export type CustomerServiceContent = {
  items: CustomerServiceItem[];
  officeName: string;
  officeBuilding: string;
  officeAddress: string;
};

export const defaultCustomerServiceContent: CustomerServiceContent = {
  items: [
    { id: 'phone', title: 'Nomor Telepon', value: '(+62) 21-501-22288', buttonLabel: 'Telepon', href: 'tel:+622150122288' },
    { id: 'whatsapp', title: 'WhatsApp', value: 'http://wa.me/628211019087', buttonLabel: 'Hubungi', href: 'https://wa.me/628211019087' },
    { id: 'email', title: 'Email', value: 'cs@hsb.co.id', buttonLabel: 'Hubungi', href: 'mailto:cs@hsb.co.id' },
    { id: 'chat', title: 'Ngobrol dengan Agen kami', value: 'Live Chat', buttonLabel: 'Hubungi', href: '' },
  ],
  officeName: 'PT. Handal Semesta Berjangka',
  officeBuilding: 'Mayapada Tower 2',
  officeAddress: 'Jl. Jenderal Sudirman No.27 Lantai 14, RT.4/RW.2, Kuningan, Kecamatan Setiabudi, Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12920',
};

type ServiceContextValue = {
  content: CustomerServiceContent;
  setContent: (content: CustomerServiceContent | ((previous: CustomerServiceContent) => CustomerServiceContent)) => void;
  status: SaveStatus;
  error: string;
};
const ServiceContext = createContext<ServiceContextValue | null>(null);

export function CustomerServiceContentProvider({ children }: { children: ReactNode }) {
  const remote = useServerContent<CustomerServiceContent>('customer-service', defaultCustomerServiceContent);
  return <ServiceContext.Provider value={{ content: remote.value, setContent: remote.setValue, status: remote.status, error: remote.error }}>{children}</ServiceContext.Provider>;
}

export function useCustomerServiceContent() {
  const context = useContext(ServiceContext);
  if (!context) throw new Error('CustomerServiceContentProvider missing');
  return context;
}
