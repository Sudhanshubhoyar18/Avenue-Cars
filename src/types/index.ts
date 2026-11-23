export type Role = "ADMIN" | "VENDOR";

export type VendorStatus = "ACTIVE" | "DISABLED";

export type CarStatus = "AVAILABLE" | "ON_BOOKING" | "MAINTENANCE" | "INACTIVE";

export type PaymentStatus = "PAID" | "PARTIALLY_PAID" | "UNPAID";

export type BookingStatus = "CONFIRMED" | "COMPLETED" | "CANCELLED";

export type CustomerTag = "VIP" | "REGULAR" | "NEW" | "CAUTION";

export type CustomerStatus = "ACTIVE" | "INACTIVE" | "BLACKLISTED";

export type NotificationChannel = "EMAIL" | "TELEGRAM";

export type NotificationStatus = "SENT" | "FAILED" | "PENDING";

export type PaymentMethod = "UPI" | "BANK_TRANSFER" | "CASH" | "OTHER";

export interface CustomerData {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  city?: string | null;
  licenseNumber?: string | null;
  idProofType?: string | null;
  idProofNumber?: string | null;
  tag: CustomerTag;
  status: CustomerStatus;
  notes?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  bookings?: BookingData[];
  totalSpent?: number;
  totalPaid?: number;
  totalUnpaid?: number;
  tripsCount?: number;
  lastTrip?: BookingData | null;
}

export interface VendorData {
  id: string;
  name: string;
  email: string;
  phone: string;
  telegramChatId: string | null;
  telegramLinkToken: string;
  status: VendorStatus;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  cars?: CarData[];
  bookings?: BookingData[];
  payouts?: VendorPayoutData[];
  _count?: {
    cars: number;
    bookings: number;
  };
}

export interface CarData {
  id: string;
  vendorId: string;
  makeModel: string;
  variant: string;
  color: string;
  registrationNumber: string;
  status: CarStatus;
  fuelType?: string;
  transmission?: string;
  seatingCapacity?: number;
  dailyRate?: number;
  imageUrl?: string | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
  vendor?: VendorData;
  bookings?: BookingData[];
}

export interface BookingData {
  id: string;
  carId: string;
  vendorId: string;
  customerId?: string | null;
  customerName?: string | null;
  pickupDatetime: Date | string;
  returnDatetime?: Date | string | null;
  destination: string;
  totalAmount: number;
  amountPaid: number;
  amountUnpaid: number;
  paymentStatus: PaymentStatus;
  mightExtend: boolean;
  vendorPayoutAmount: number;
  bookingStatus: BookingStatus;
  notes?: string | null;
  createdBy?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  car?: CarData;
  vendor?: VendorData;
  customer?: CustomerData;
}

export interface VendorPayoutData {
  id: string;
  vendorId: string;
  amount: number;
  paymentDate: Date | string;
  paymentMethod: PaymentMethod;
  referenceId?: string | null;
  notes?: string | null;
  createdBy?: string | null;
  createdAt: Date | string;
}

export interface NotificationLogData {
  id: string;
  bookingId: string;
  vendorId: string;
  channel: NotificationChannel;
  eventType: string;
  status: NotificationStatus;
  recipient: string;
  errorMessage?: string | null;
  payload?: string | null;
  retryCount: number;
  lastAttemptedAt?: Date | string | null;
  createdAt: Date | string;
}

export interface AuditLogData {
  id: string;
  userId?: string | null;
  userEmail: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: string | null;
  ipAddress?: string | null;
  createdAt: Date | string;
}
