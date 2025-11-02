
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSafeContext } from '../App';
import { Role, Booking, BookingStatus, User, Vacation, VacationStatus, Notification, ShiftSwapRequest, ShiftSwapStatus } from '../types';
import { ROLE_COLORS, STATUS_COLORS, VACATION_COLOR } from '../constants';
import BookingModal from './BookingModal';
import SettingsModal from './SettingsModal';
import VacationModal from './VacationModal';
import ExportModal from './ExportModal';
import NewsModal from './NewsModal';
import EventDetailModal from './EventDetailModal';
import NotificationsHistoryModal from './NotificationsHistoryModal';
import ShiftSwapModal from './ShiftSwapModal';
import { ChevronLeftIcon, ChevronRightIcon, CogIcon, LogoutIcon, BellIcon, CheckIcon, XIcon, ChevronDownIcon, CalendarIcon, SunIcon, DownloadIcon, NewspaperIcon } from './Icons';

type CalendarViewType = 'month' | 'week' | 'day' | 'agenda';
type SelectedEvent = Booking | Vacation;

const VIEWS: { id: CalendarViewType, label: string }[] = [
    { id: 'month', label: 'Mes' },
    { id: 'week', label: 'Semana' },
    { id: 'day', label: 'Día' },
    { id: 'agenda', label: 'Agenda' },
];

const ApprovalsDropdown: React.FC<{
    pendingBookings: Booking[],
    pendingDeletions: Booking[],
    pendingVacations: Vacation[],
    pendingSwaps: ShiftSwapRequest[],
    users: User[],
    bookings: Booking[],
    onApproveBooking: (b: Booking) => void,
    onRejectBooking: (b: Booking) => void,
    onConfirmDelete: (id: string) => void,
    onRejectDelete: (b: Booking) => void,
    onApproveVacation: (v: Vacation) => void,
    onRejectVacation: (v: Vacation) => void,
    onApproveSwap: (s: ShiftSwapRequest) => void,
    onRejectSwap: (s: ShiftSwapRequest) => void,
}> = ({ pendingBookings, pendingDeletions, pendingVacations, pendingSwaps, users, bookings, onApproveBooking, onRejectBooking, onConfirmDelete, onRejectDelete, onApproveVacation, onRejectVacation, onApproveSwap, onRejectSwap }) => {
    
    const allPending = [...pendingBookings, ...pendingDeletions, ...pendingVacations, ...pendingSwaps];
    allPending.sort((a, b) => {
        const dateA = 'createdAt' in a ? a.createdAt : ('date' in a ? a.date : a.startDate);
        const dateB = 'createdAt' in b ? b.createdAt : ('date' in b ? b.date : b.startDate);
        return new Date(dateB).getTime() - new Date(dateA).getTime();
    });


    const getRequestContent = (item: Booking | Vacation | ShiftSwapRequest) => {
        if ('date' in item) { // Booking
            const user = users.find(u => u.id === item.userId);
            const isDeletion = item.status === BookingStatus.PENDING_DELETION;
            return (<><p className={`font-semibold ${isDeletion ? 'text-orange-700' : 'text-gray-700'}`}>{isDeletion ? 'Solicitud de Eliminación' : 'Nueva Reserva'}</p><p className="font-medium text-gray-600">{user?.firstName} {user?.lastName}</p><p className="text-gray-500">{new Date(item.date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}: {item.startTime} - {item.endTime}</p></>);
        } else if ('startDate' in item) { // Vacation
             const user = users.find(u => u.id === item.userId);
            return (<><p className="font-semibold text-indigo-700">Solicitud de Vacaciones</p><p className="font-medium text-gray-600">{user?.firstName} {user?.lastName}</p><p className="text-gray-500">{new Date(item.startDate + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - {new Date(item.endDate + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</p></>);
        } else { // Shift Swap
            const requester = users.find(u => u.id === item.requesterId);
            const requestedFrom = users.find(u => u.id === item.requestedFromId);
            const requesterBooking = bookings.find(b => b.id === item.requesterBookingId);
            const requestedBooking = bookings.find(b => b.id === item.requestedBookingId);
            return (<><p className="font-semibold text-purple-700">Intercambio de Turno</p><p className="font-medium text-gray-600">{requester?.firstName} &harr; {requestedFrom?.firstName}</p><p className="text-gray-500 text-xs">{requester?.firstName} ofrece: {requesterBooking ? `${new Date(requesterBooking.date + 'T00:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'short'})} ${requesterBooking.startTime}`: 'N/A'}</p><p className="text-gray-500 text-xs">{requestedFrom?.firstName} ofrece: {requestedBooking ? `${new Date(requestedBooking.date + 'T00:00:00').toLocaleDateString('es-ES',{day:'numeric',month:'short'})} ${requestedBooking.startTime}`: 'N/A'}</p></>);
        }
    };
    
    const getRequestActions = (item: Booking | Vacation | ShiftSwapRequest) => {
        if ('date' in item) { // Booking
            return item.status === BookingStatus.PENDING_DELETION ? (
                <><button onClick={() => onRejectDelete(item)} className="p-1.5 rounded-full hover:bg-red-100" title="Rechazar Eliminación"><XIcon className="h-4 w-4 text-red-600" /></button><button onClick={() => onConfirmDelete(item.id)} className="p-1.5 rounded-full hover:bg-green-100" title="Confirmar Eliminación"><CheckIcon className="h-4 w-4 text-green-600" /></button></>
            ) : (
                 <><button onClick={() => onRejectBooking(item)} className="p-1.5 rounded-full hover:bg-red-100" title="Rechazar"><XIcon className="h-4 w-4 text-red-600" /></button><button onClick={() => onApproveBooking(item)} className="p-1.5 rounded-full hover:bg-green-100" title="Aprobar"><CheckIcon className="h-4 w-4 text-green-600" /></button></>
            );
        } else if ('startDate' in item) { // Vacation
            return (
                 <><button onClick={() => onRejectVacation(item)} className="p-1.5 rounded-full hover:bg-red-100" title="Rechazar"><XIcon className="h-4 w-4 text-red-600" /></button><button onClick={() => onApproveVacation(item)} className="p-1.5 rounded-full hover:bg-green-100" title="Aprobar"><CheckIcon className="h-4 w-4 text-green-600" /></button></>
            );
        } else { // Shift Swap
            return (
                 <><button onClick={() => onRejectSwap(item)} className="p-1.5 rounded-full hover:bg-red-100" title="Rechazar"><XIcon className="h-4 w-4 text-red-600" /></button><button onClick={() => onApproveSwap(item)} className="p-1.5 rounded-full hover:bg-green-100" title="Aprobar"><CheckIcon className="h-4 w-4 text-green-600" /></button></>
            );
        }
    }

    return (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-gray-200 z-30">
            <div className="p-3 border-b"><h3 className="text-sm font-semibold text-gray-800">Solicitudes Pendientes</h3></div>
            <div className="max-h-80 overflow-y-auto">
                {allPending.length === 0 ? (<p className="text-center text-gray-500 text-sm p-4">No hay solicitudes pendientes.</p>) : (
                    <ul className="divide-y divide-gray-100">{allPending.map(item => (<li key={item.id} className="p-3 text-sm flex justify-between items-center"><div>{getRequestContent(item)}</div><div className="flex flex-col space-y-2">{getRequestActions(item)}</div></li>))}</ul>
                )}
            </div>
        </div>
    );
};


const CalendarView: React.FC = () => {
    const { currentUser, logout, bookings, users, updateBooking, deleteBooking, vacations, updateVacation, notifications, markNotificationsAsSeen, shiftSwaps, updateShiftSwap } = useSafeContext();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<CalendarViewType>('month');

    // Modal states
    const [isBookingModalOpen, setBookingModalOpen] = useState(false);
    const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
    const [isVacationModalOpen, setVacationModalOpen] = useState(false);
    const [isExportModalOpen, setExportModalOpen] = useState(false);
    const [isNewsModalOpen, setNewsModalOpen] = useState(false);
    const [isEventDetailModalOpen, setEventDetailModalOpen] = useState(false);
    const [isNotificationsHistoryModalOpen, setNotificationsHistoryModalOpen] = useState(false);
    const [isShiftSwapModalOpen, setShiftSwapModalOpen] = useState(false);
    
    // Dropdown states
    const [isApprovalsOpen, setApprovalsOpen] = useState(false);
    const [isViewSwitcherOpen, setViewSwitcherOpen] = useState(false);
    
    // Data for modals
    const [selectedDateForBooking, setSelectedDateForBooking] = useState(new Date());
    const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
    const [editingVacation, setEditingVacation] = useState<Vacation | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<SelectedEvent | null>(null);
    const [bookingToSwap, setBookingToSwap] = useState<Booking | null>(null);

    const unseenNotificationsRef = useRef<Notification[]>([]);
    const approvalsRef = useRef<HTMLDivElement>(null);
    const viewSwitcherRef = useRef<HTMLDivElement>(null);

    const canManageSettings = currentUser?.role === Role.ADMINISTRADOR || currentUser?.role === Role.ASISTENTE;
    
    const pendingBookings = useMemo(() => bookings.filter(b => b.status === BookingStatus.PENDING), [bookings]);
    const pendingDeletions = useMemo(() => bookings.filter(b => b.status === BookingStatus.PENDING_DELETION), [bookings]);
    const pendingVacations = useMemo(() => vacations.filter(v => v.status === VacationStatus.PENDING), [vacations]);
    const pendingSwaps = useMemo(() => shiftSwaps.filter(s => s.status === ShiftSwapStatus.PENDING), [shiftSwaps]);
    const totalPending = pendingBookings.length + pendingDeletions.length + pendingVacations.length + pendingSwaps.length;

    // --- Effects ---
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (approvalsRef.current && !approvalsRef.current.contains(event.target as Node)) setApprovalsOpen(false);
            if (viewSwitcherRef.current && !viewSwitcherRef.current.contains(event.target as Node)) setViewSwitcherOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (currentUser) {
            const unseen = notifications.filter(n => n.userId === currentUser.id && !n.seen);
            if (unseen.length > 0) {
                unseenNotificationsRef.current = unseen.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setNewsModalOpen(true);
            }
        }
    }, [currentUser, notifications]);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (canManageSettings && totalPending > 0) {
                e.preventDefault();
                e.returnValue = ''; // Required for Chrome
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [canManageSettings, totalPending]);
    
    const { calendarDays, startOfWeek, endOfWeek } = useMemo(() => {
        const d = new Date(currentDate);
        if (view === 'month') {
            const year = d.getFullYear();
            const month = d.getMonth();
            const firstDayOfMonth = new Date(year, month, 1);
            const startDay = new Date(firstDayOfMonth);
            startDay.setDate(startDay.getDate() - firstDayOfMonth.getDay()); // Start on Sunday
             return { calendarDays: Array.from({ length: 42 }, (_, i) => {
                const day = new Date(startDay);
                day.setDate(day.getDate() + i);
                return day;
            })};
        }
        const start = new Date(d);
        start.setDate(start.getDate() - start.getDay());
        const end = new Date(start);
        end.setDate(end.getDate() + 6);

        return {
            startOfWeek: start,
            endOfWeek: end,
            calendarDays: Array.from({ length: view === 'day' ? 1 : 7 }, (_, i) => {
                const day = new Date(start);
                day.setDate(day.getDate() + (view === 'day' ? d.getDay() : i));
                return day;
            })
        };
    }, [currentDate, view]);
    

    // --- Handlers ---
    const handleCloseNewsModal = () => {
        if (currentUser) markNotificationsAsSeen(currentUser.id);
        setNewsModalOpen(false);
    };

    const navigatePeriod = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentDate);
        const amount = direction === 'prev' ? -1 : 1;
        if (view === 'day') newDate.setDate(newDate.getDate() + amount);
        else if (view === 'week' || view === 'agenda') newDate.setDate(newDate.getDate() + (amount * 7));
        else newDate.setMonth(newDate.getMonth() + amount);
        setCurrentDate(newDate);
    };

    const getHeaderText = () => {
        if (view === 'day') return currentDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
        if (view === 'week' || view === 'agenda') {
            const start = view === 'agenda' ? startOfWeek! : calendarDays[0];
            const end = view === 'agenda' ? endOfWeek! : calendarDays[6];
            return `${start.getDate()} de ${start.toLocaleDateString('es-ES', { month: 'short' })} - ${end.getDate()} de ${end.toLocaleDateString('es-ES', { month: 'short' })}, ${end.getFullYear()}`;
        }
        return currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    };

    const openNewBookingModal = (date: Date) => {
        setSelectedDateForBooking(date);
        setEditingBooking(null);
        setBookingModalOpen(true);
    };

    const handleEventClick = (event: SelectedEvent) => {
        setSelectedEvent(event);
        setEventDetailModalOpen(true);
    };

    const handleEditEvent = (event: SelectedEvent) => {
        setEventDetailModalOpen(false);
        if ('date' in event) { // Booking
            setEditingBooking(event);
            setBookingModalOpen(true);
        } else { // Vacation
            setEditingVacation(event);
            setVacationModalOpen(true);
        }
    };
    
    const handleSwapEvent = (booking: Booking) => {
        setEventDetailModalOpen(false);
        setBookingToSwap(booking);
        setShiftSwapModalOpen(true);
    };
    
    const handleLogout = async () => {
        if (canManageSettings && totalPending > 0) {
            if (!window.confirm('Hay solicitudes pendientes. ¿Está seguro de que desea salir?')) {
                return;
            }
        }
        await logout();
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    };

    const approveBooking = (booking: Booking) => updateBooking({ ...booking, status: BookingStatus.APPROVED });
    const rejectBooking = (booking: Booking) => updateBooking({ ...booking, status: BookingStatus.REJECTED });
    const confirmDelete = (bookingId: string) => deleteBooking(bookingId);
    const rejectDelete = (booking: Booking) => updateBooking({ ...booking, status: BookingStatus.APPROVED }); // Revert to approved
    const approveVacation = (vacation: Vacation) => updateVacation({ ...vacation, status: VacationStatus.APPROVED });
    const rejectVacation = (vacation: Vacation) => updateVacation({ ...vacation, status: VacationStatus.REJECTED });
    const approveSwap = (swap: ShiftSwapRequest) => updateShiftSwap({ ...swap, status: ShiftSwapStatus.APPROVED });
    const rejectSwap = (swap: ShiftSwapRequest) => updateShiftSwap({ ...swap, status: ShiftSwapStatus.REJECTED });
    
    const formatTime = (time: string) => time.slice(0, 5);
    const sortedBookings = useMemo(() => [...bookings].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.startTime.localeCompare(b.startTime)), [bookings]);

    return (
        <div className="h-screen flex flex-col bg-white text-gray-900 font-sans">
            <header className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center z-20">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="h-7 w-7 text-blue-600" />
                        <h1 className="text-xl font-bold text-gray-800">Matehost</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-sm font-semibold text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Hoy</button>
                        <button onClick={() => navigatePeriod('prev')} className="p-2 rounded-full text-gray-500 hover:bg-gray-100"><ChevronLeftIcon className="h-5 w-5" /></button>
                        <button onClick={() => navigatePeriod('next')} className="p-2 rounded-full text-gray-500 hover:bg-gray-100"><ChevronRightIcon className="h-5 w-5" /></button>
                         <h2 className="text-lg font-medium text-gray-600 w-64 text-left capitalize">{getHeaderText()}</h2>
                    </div>
                </div>
                <div className="flex items-center gap-1.5">
                     <div ref={viewSwitcherRef} className="relative">
                        <button onClick={() => setViewSwitcherOpen(v => !v)} className="flex items-center gap-1 px-3 py-1.5 text-sm font-semibold text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                            {VIEWS.find(v => v.id === view)?.label}
                            <ChevronDownIcon className="h-4 w-4" />
                        </button>
                        {isViewSwitcherOpen && (
                            <div className="absolute top-full right-0 mt-2 w-36 bg-white rounded-md shadow-lg border border-gray-200 z-30">
                                {VIEWS.map(v => (
                                    <button key={v.id} onClick={() => { setView(v.id); setViewSwitcherOpen(false); }} className={`block w-full text-left px-4 py-2 text-sm ${view === v.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                                        {v.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button onClick={() => setNotificationsHistoryModalOpen(true)} className="p-2 rounded-full hover:bg-gray-100" title="Historial de Novedades"><NewspaperIcon className="h-6 w-6 text-gray-500" /></button>
                    <button onClick={() => setExportModalOpen(true)} className="p-2 rounded-full hover:bg-gray-100" title="Exportar"><DownloadIcon className="h-6 w-6 text-gray-500" /></button>
                    <button onClick={() => setVacationModalOpen(true)} className="p-2 rounded-full hover:bg-gray-100" title="Solicitar Vacaciones"><SunIcon className="h-6 w-6 text-gray-500" /></button>
                    
                    {canManageSettings && (
                        <div ref={approvalsRef} className="relative">
                            <button onClick={() => setApprovalsOpen(o => !o)} className="p-2 rounded-full hover:bg-gray-100 relative" title="Aprobaciones">
                                <BellIcon className="h-6 w-6 text-gray-500" />
                                {totalPending > 0 && <span className="absolute top-1 right-1 block h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white"></span>}
                            </button>
                            {isApprovalsOpen && <ApprovalsDropdown 
                                pendingBookings={pendingBookings}
                                pendingDeletions={pendingDeletions}
                                pendingVacations={pendingVacations}
                                pendingSwaps={pendingSwaps}
                                users={users} 
                                bookings={bookings}
                                onApproveBooking={approveBooking} 
                                onRejectBooking={rejectBooking}
                                onConfirmDelete={confirmDelete}
                                onRejectDelete={rejectDelete}
                                onApproveVacation={approveVacation}
                                onRejectVacation={rejectVacation}
                                onApproveSwap={approveSwap}
                                onRejectSwap={rejectSwap}
                                />}
                        </div>
                    )}
                    {canManageSettings && <button onClick={() => setSettingsModalOpen(true)} className="p-2 rounded-full hover:bg-gray-100" title="Ajustes"><CogIcon className="h-6 w-6 text-gray-500" /></button>}
                    <button onClick={handleLogout} className="p-2 rounded-full hover:bg-gray-100" title="Cerrar Sesión"><LogoutIcon className="h-6 w-6 text-gray-500" /></button>
                </div>
            </header>

            {view === 'agenda' ? (
                 <main className="flex-grow overflow-y-auto p-6">
                    <h2 className="text-2xl font-bold mb-4">Próximas Reservas</h2>
                     <ul className="space-y-4">
                        {sortedBookings.filter(b => new Date(b.date) >= new Date(new Date().toDateString())).map(booking => {
                            const user = users.find(u => u.id === booking.userId);
                            if (!user) return null;
                            const statusColor = STATUS_COLORS[booking.status];
                            const roleColor = ROLE_COLORS[user.role];
                            const colors = statusColor || roleColor;
                            const isRejected = booking.status === BookingStatus.REJECTED;

                            return (
                                <li key={booking.id} onClick={() => handleEventClick(booking)} className={`p-4 rounded-lg flex items-center justify-between cursor-pointer border-l-4 ${colors.border} ${colors.bg}`}>
                                    <div>
                                        <p className={`font-bold ${colors.text} ${isRejected ? 'line-through' : ''}`}>{user.firstName} {user.lastName}</p>
                                        <p className={`text-sm ${colors.text}`}>{new Date(booking.date + "T00:00:00").toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                                        <p className={`text-sm ${colors.text}`}>{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</p>
                                    </div>
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${colors.bg} ${colors.text}`}>{booking.status}</span>
                                </li>
                            );
                        })}
                    </ul>
                 </main>
            ) : (
                <main className="flex-grow grid grid-cols-1 grid-rows-[auto,1fr] overflow-hidden border-t border-gray-200">
                    <div className="grid grid-cols-7 border-b border-gray-200 bg-white">
                        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day, i) =>
                            <div key={day} className={`text-center py-2 text-xs font-semibold text-gray-500 border-l ${i === 0 ? 'border-l-0' : 'border-gray-200'}`}>{day}</div>
                        )}
                    </div>
                    <div className={`grid overflow-auto ${view === 'month' ? 'grid-cols-7 grid-rows-6' : 'grid-cols-7'}`}>
                        {calendarDays.map((day, dayIdx) => {
                            const dayString = day.toISOString().split('T')[0];
                            const bookingsForDay = bookings.filter(b => b.date === dayString).sort((a, b) => a.startTime.localeCompare(b.startTime));
                            const vacationsForDay = vacations.filter(v => {
                                const dayTime = day.setHours(0,0,0,0);
                                const startTime = new Date(v.startDate + 'T00:00:00').getTime();
                                const endTime = new Date(v.endDate + 'T00:00:00').getTime();
                                return dayTime >= startTime && dayTime <= endTime && v.status === VacationStatus.APPROVED;
                            });
                            const isCurrentMonth = day.getMonth() === currentDate.getMonth();

                            return (
                                <div key={day.toISOString()} onClick={() => openNewBookingModal(day)} className={`border-b border-l border-gray-200 p-1 flex flex-col cursor-pointer transition-colors hover:bg-gray-50/50 relative group ${dayIdx % 7 === 0 ? 'border-l-0' : ''} ${!isCurrentMonth && view === 'month' ? 'bg-gray-50' : ''}`}>
                                    <span className={`self-end w-7 h-7 flex items-center justify-center text-sm font-medium rounded-full mb-1 ${isToday(day) ? 'bg-blue-600 text-white' : !isCurrentMonth && view === 'month' ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {day.getDate()}
                                    </span>
                                    <div className="flex-grow space-y-1 text-[11px] overflow-y-auto">
                                        {vacationsForDay.map(vacation => {
                                            const user = users.find(u => u.id === vacation.userId);
                                            return (
                                                <div key={vacation.id} onClick={(e) => { e.stopPropagation(); handleEventClick(vacation);}} className={`px-1.5 py-0.5 rounded ${VACATION_COLOR.bg} ${VACATION_COLOR.text} font-semibold truncate flex items-center gap-1`}>
                                                    <SunIcon className="h-3 w-3" /> {user?.firstName}
                                                </div>
                                            );
                                        })}
                                        {bookingsForDay.map(booking => {
                                            const user = users.find(u => u.id === booking.userId);
                                            if (!user) return null;
                                            const statusColor = STATUS_COLORS[booking.status];
                                            const roleColor = ROLE_COLORS[user.role];
                                            const colors = statusColor || roleColor;
                                            const isRejected = booking.status === BookingStatus.REJECTED;
                                            return (
                                                <div key={booking.id} onClick={(e) => { e.stopPropagation(); handleEventClick(booking); }} className={`px-1.5 py-0.5 rounded ${colors.bg} ${colors.text} font-semibold truncate ${isRejected ? 'line-through opacity-70' : ''}`}>
                                                    {booking.startTime.split(':')[0]}-{booking.endTime.split(':')[0]} {user.firstName} {user.lastName}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </main>
            )}

            {isEventDetailModalOpen && <EventDetailModal isOpen={isEventDetailModalOpen} onClose={() => setEventDetailModalOpen(false)} event={selectedEvent} onEdit={handleEditEvent} onSwap={handleSwapEvent} />}
            {isBookingModalOpen && <BookingModal isOpen={isBookingModalOpen} onClose={() => setBookingModalOpen(false)} date={selectedDateForBooking} bookingToEdit={editingBooking}/>}
            {isSettingsModalOpen && <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setSettingsModalOpen(false)} />}
            {isVacationModalOpen && <VacationModal isOpen={isVacationModalOpen} onClose={() => { setVacationModalOpen(false); setEditingVacation(null); }} vacationToEdit={editingVacation} />}
            {isExportModalOpen && <ExportModal isOpen={isExportModalOpen} onClose={() => setExportModalOpen(false)} />}
            {isNewsModalOpen && <NewsModal isOpen={isNewsModalOpen} onClose={handleCloseNewsModal} notifications={unseenNotificationsRef.current} />}
            {isNotificationsHistoryModalOpen && <NotificationsHistoryModal isOpen={isNotificationsHistoryModalOpen} onClose={() => setNotificationsHistoryModalOpen(false)} />}
            {isShiftSwapModalOpen && <ShiftSwapModal isOpen={isShiftSwapModalOpen} onClose={() => setShiftSwapModalOpen(false)} bookingToSwap={bookingToSwap} />}
        </div>
    );
};

export default CalendarView;
