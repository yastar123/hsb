import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

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

const KEY = 'hsb-customer-service-v1';
type ServiceContextValue = {
  content: CustomerServiceContent;
  setContent: (content: CustomerServiceContent | ((previous: CustomerServiceContent) => CustomerServiceContent)) => void;
};
const ServiceContext = createContext<ServiceContextValue | null>(null);

export function CustomerServiceContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState(defaultCustomerServiceContent);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) setContent({ ...defaultCustomerServiceContent, ...JSON.parse(saved) });
    } catch { /* keep defaults when saved content is unreadable */ }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) {
      try { localStorage.setItem(KEY, JSON.stringify(content)); } catch { /* keep the page usable if browser storage is full */ }
    }
  }, [content, loaded]);
  return <ServiceContext.Provider value={{ content, setContent }}>{children}</ServiceContext.Provider>;
}

export function useCustomerServiceContent() {
  const context = useContext(ServiceContext);
  if (!context) throw new Error('CustomerServiceContentProvider missing');
  return context;
}
