import { create } from 'zustand';

export interface Pool {
  pool: string;
  day: boolean;
  night: boolean;
  dayRate: number;
  nightRate: number;
  depositRate: number;
  colorDay: string;
  colorNight: string;
}

export interface BookingSlot {
  pool: string;
  type: 'DAY' | 'NIGHT';
  rate: number;
}

export interface Booking {
  bookingNo: string;
  bookingDate: string;
  slots: BookingSlot[];
  customer: string;
  email: string;
  phone: string;
  subTotal: number;
  discount: number;
  total: number;
  reserveFee: number;
  status: string;
  createdBy: string;
}

export interface MenuItem {
  icon: string;
  title: string;
  route: string;
  restricted: boolean;
}

const INITIAL_POOLS: Pool[] = [
  { pool: '01-Corazon',     day: false, night: false, dayRate: 15000, nightRate: 17000, depositRate: 5000, colorDay: 'yellow', colorNight: 'yellow' },
  { pool: '02-Isabel',      day: false, night: false, dayRate: 16000, nightRate: 18000, depositRate: 5000, colorDay: 'yellow', colorNight: 'yellow' },
  { pool: '03-Cristina',    day: false, night: false, dayRate: 13000, nightRate: 15000, depositRate: 5000, colorDay: 'yellow', colorNight: 'yellow' },
  { pool: '04-Dominique',   day: false, night: false, dayRate: 15000, nightRate: 17000, depositRate: 5000, colorDay: 'yellow', colorNight: 'yellow' },
  { pool: '05-Maricor',     day: false, night: false, dayRate: 16000, nightRate: 18000, depositRate: 5000, colorDay: 'yellow', colorNight: 'yellow' },
  { pool: '06-Catherine',   day: false, night: false, dayRate: 11000, nightRate: 13000, depositRate: 0,    colorDay: 'yellow', colorNight: 'yellow' },
  { pool: '07-Arabella',    day: false, night: false, dayRate: 11000, nightRate: 13000, depositRate: 0,    colorDay: 'yellow', colorNight: 'yellow' },
  { pool: '08-Patricia',    day: false, night: false, dayRate: 7000,  nightRate: 8000,  depositRate: 3000, colorDay: 'yellow', colorNight: 'yellow' },
  { pool: '09-Imelda',      day: false, night: false, dayRate: 7000,  nightRate: 8000,  depositRate: 3000, colorDay: 'yellow', colorNight: 'yellow' },
  { pool: '10-Barbara',     day: false, night: false, dayRate: 8000,  nightRate: 9000,  depositRate: 3000, colorDay: 'yellow', colorNight: 'yellow' },
  { pool: '11-Rafael',      day: false, night: false, dayRate: 8000,  nightRate: 9000,  depositRate: 3000, colorDay: 'yellow', colorNight: 'yellow' },
  { pool: '12-Gabriel',     day: false, night: false, dayRate: 9000,  nightRate: 10000, depositRate: 4000, colorDay: 'yellow', colorNight: 'yellow' },
  { pool: '14-Daniel',      day: false, night: false, dayRate: 9000,  nightRate: 10000, depositRate: 4000, colorDay: 'yellow', colorNight: 'yellow' },
  { pool: '15-Chito',       day: false, night: false, dayRate: 4000,  nightRate: 5000,  depositRate: 2000, colorDay: 'yellow', colorNight: 'yellow' },
  { pool: '16-David',       day: false, night: false, dayRate: 4000,  nightRate: 5000,  depositRate: 2000, colorDay: 'yellow', colorNight: 'yellow' },
  { pool: '17-Troy',        day: false, night: false, dayRate: 4000,  nightRate: 5000,  depositRate: 2000, colorDay: 'yellow', colorNight: 'yellow' },
  { pool: '18-Luis',        day: false, night: false, dayRate: 4000,  nightRate: 5000,  depositRate: 2000, colorDay: 'yellow', colorNight: 'yellow' },
  { pool: '19-Marco',       day: false, night: false, dayRate: 4000,  nightRate: 5000,  depositRate: 2000, colorDay: 'yellow', colorNight: 'yellow' },
];

const MENU_ITEMS: MenuItem[] = [
  { icon: 'CalendarDays',  title: 'Calendar View',   route: '/calendar-view',   restricted: false },
  { icon: 'BookOpen',      title: 'Reserve',         route: '/reserve',         restricted: false },
  { icon: 'CalendarCheck', title: 'Slots',           route: '/slots',           restricted: false },
  { icon: 'Waves',         title: 'Slots per Pool',  route: '/poolslot',        restricted: false },
  { icon: 'List',          title: 'Bookings',        route: '/bookings',        restricted: false },
  { icon: 'Search',        title: 'Search Bookings', route: '/bookings-search', restricted: false },
  { icon: 'CreditCard',    title: 'Payments',        route: '/payments',        restricted: true  },
  { icon: 'BarChart2',     title: 'Reports',         route: '/reports',         restricted: true  },
];

interface AppState {
  pools: Pool[];
  cart: BookingSlot[];
  booking: Booking;
  bookingDocId: string;
  user: string;
  bookingsSearchDate: string;
  paymentsSearchDate: string;
  slotsSearchDate: string;
  menus: MenuItem[];
  setPools: (pools: Pool[]) => void;
  setCart: (cart: BookingSlot[]) => void;
  setBooking: (booking: Partial<Booking>) => void;
  setBookingDocId: (id: string) => void;
  setUser: (user: string) => void;
  setBookingsSearchDate: (date: string) => void;
  setPaymentsSearchDate: (date: string) => void;
  setSlotsSearchDate: (date: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  pools: INITIAL_POOLS,
  cart: [],
  booking: {
    bookingNo: '', bookingDate: '', slots: [], customer: '', email: '',
    phone: '', subTotal: 0, discount: 0, total: 0, reserveFee: 0, status: '', createdBy: '',
  },
  bookingDocId: '',
  user: '',
  bookingsSearchDate: '',
  paymentsSearchDate: '',
  slotsSearchDate: '',
  menus: MENU_ITEMS,
  setPools: (pools) => set({ pools }),
  setCart: (cart) => set({ cart }),
  setBooking: (booking) => set((s) => ({ booking: { ...s.booking, ...booking } })),
  setBookingDocId: (id) => set({ bookingDocId: id }),
  setUser: (user) => set({ user }),
  setBookingsSearchDate: (date) => set({ bookingsSearchDate: date }),
  setPaymentsSearchDate: (date) => set({ paymentsSearchDate: date }),
  setSlotsSearchDate: (date) => set({ slotsSearchDate: date }),
}));
