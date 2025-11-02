export enum Role {
  MATEHOST = 'Matehost',
  ASISTENTE = 'Asistente',
  ADMINISTRADOR = 'Administrador',
}

export interface User {
  id: string;
  username: string;
  password: string; // NOTE: In a real app, this should be a secure hash.
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  vacationApproverId?: string;
}

export interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
}

export enum BookingStatus {
  PENDING = 'Pendiente',
  APPROVED = 'Aprobado',
  REJECTED = 'Rechazado',
  PENDING_DELETION = 'Eliminación Pendiente',
}

export interface Booking {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: BookingStatus;
  bookedBy: string; // userId of the user who created the booking
  notes?: string;
}

export enum VacationStatus {
    PENDING = 'Pendiente',
    APPROVED = 'Aprobado',
    REJECTED = 'Rechazado',
}

export interface Vacation {
    id: string;
    userId: string;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    status: VacationStatus;
    requestedBy: string; // userId
}

export interface Notification {
  id: string;
  userId: string; // The user who should see this notification
  message: string;
  seen: boolean;
  createdAt: string; // ISO string
  requestType?: 'shiftSwap';
  requestId?: string;
}

export enum ShiftSwapStatus {
    PENDING = 'Pendiente',
    APPROVED = 'Aprobado',
    REJECTED = 'Rechazado',
}

export interface ShiftSwapRequest {
    id: string;
    requesterId: string; // User who wants to swap
    requestedFromId: string; // User they want to swap with
    requesterBookingId: string; // The booking the requester is offering
    requestedBookingId: string; // The booking the requester wants
    status: ShiftSwapStatus;
    createdAt: string; // ISO string
}