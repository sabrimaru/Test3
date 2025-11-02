import { Role, BookingStatus } from './types';

export const ROLE_COLORS: Record<Role, { bg: string; text: string; border: string; }> = {
  [Role.ADMINISTRADOR]: { bg: 'bg-sky-100', text: 'text-sky-800', border: 'border-sky-500' },
  [Role.ASISTENTE]: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-500' },
  [Role.MATEHOST]: { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-500' },
};

export const STATUS_COLORS: Partial<Record<BookingStatus, { bg: string; text: string; border: string; }>> = {
  [BookingStatus.PENDING]: { bg: 'bg-gray-200', text: 'text-gray-700', border: 'border-gray-400' },
  [BookingStatus.REJECTED]: { bg: 'bg-red-200', text: 'text-red-800', border: 'border-red-500' },
  [BookingStatus.PENDING_DELETION]: { bg: 'bg-orange-200', text: 'text-orange-800', border: 'border-orange-500' },
};

export const VACATION_COLOR = { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-500' };

export const TIME_OPTIONS = Array.from({ length: 24 * 4 }, (_, i) => {
    const hours = Math.floor(i / 4).toString().padStart(2, '0');
    const minutes = ((i % 4) * 15).toString().padStart(2, '0');
    return `${hours}:${minutes}`;
});