import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { User, Booking, Role, Shift, Vacation, VacationStatus, BookingStatus, Notification, ShiftSwapRequest, ShiftSwapStatus } from './types';
import LoginView from './components/LoginView';
import CalendarView from './components/CalendarView';

// AppContext Type
interface AppContextType {
    currentUser: User | null;
    users: User[];
    bookings: Booking[];
    shifts: Shift[];
    vacations: Vacation[];
    notifications: Notification[];
    shiftSwaps: ShiftSwapRequest[];
    login: (username: string, password: string) => boolean;
    logout: () => void;
    registerAdmin: (data: Omit<User, 'id' | 'role'>) => void;
    addUser: (data: Omit<User, 'id'> & { vacationApproverId?: string }) => void;
    updateUser: (user: User) => void;
    deleteUser: (userId: string) => void;
    addBooking: (booking: Omit<Booking, 'id'>) => void;
    updateBooking: (booking: Booking) => void;
    deleteBooking: (bookingId: string) => void;
    addShift: (shift: Omit<Shift, 'id'>) => void;
    updateShift: (shift: Shift) => void;
    deleteShift: (shiftId: string) => void;
    addVacation: (vacation: Omit<Vacation, 'id' | 'status'>) => void;
    updateVacation: (vacation: Vacation) => void;
    deleteVacation: (vacationId: string) => void;
    markNotificationsAsSeen: (userId: string) => void;
    addShiftSwap: (swap: Omit<ShiftSwapRequest, 'id'|'status'|'createdAt'>) => void;
    updateShiftSwap: (swap: ShiftSwapRequest) => void;
}

// Create Context
const AppContext = createContext<AppContextType | null>(null);

// Custom hook for safe context usage
export const useSafeContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useSafeContext must be used within an AppProvider');
    }
    return context;
};

// Main App component with Provider logic
const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [vacations, setVacations] = useState<Vacation[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [shiftSwaps, setShiftSwaps] = useState<ShiftSwapRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load data from localStorage on initial render
    useEffect(() => {
        try {
            // One-time cleanup script for launching the app fresh.
            const isCleaned = localStorage.getItem('calendar_launch_clean_v2');
            if (!isCleaned) {
                console.log("Performing one-time data cleanup for launch...");
                localStorage.removeItem('calendar_currentUser');
                localStorage.removeItem('calendar_users');
                localStorage.removeItem('calendar_bookings');
                localStorage.removeItem('calendar_shifts');
                localStorage.removeItem('calendar_vacations');
                localStorage.removeItem('calendar_notifications');
                localStorage.removeItem('calendar_shiftSwaps');
                localStorage.setItem('calendar_launch_clean_v2', 'true');
            }

            // Load current user first
            const storedCurrentUser = localStorage.getItem('calendar_currentUser');
            if (storedCurrentUser) {
                setCurrentUser(JSON.parse(storedCurrentUser));
            }
            
            const storedUsers = localStorage.getItem('calendar_users');
            const storedBookings = localStorage.getItem('calendar_bookings');
            const storedShifts = localStorage.getItem('calendar_shifts');
            const storedVacations = localStorage.getItem('calendar_vacations');
            const storedNotifications = localStorage.getItem('calendar_notifications');
            const storedShiftSwaps = localStorage.getItem('calendar_shiftSwaps');
            
            if (storedUsers) setUsers(JSON.parse(storedUsers));
            if (storedBookings) setBookings(JSON.parse(storedBookings));
            if (storedShifts) setShifts(JSON.parse(storedShifts));
            if (storedVacations) setVacations(JSON.parse(storedVacations));
            if (storedNotifications) setNotifications(JSON.parse(storedNotifications));
            if (storedShiftSwaps) setShiftSwaps(JSON.parse(storedShiftSwaps));
            
        } catch (error) {
            console.error("Failed to load data", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Persist data to localStorage whenever it changes
    const useLocalStorage = <T,>(key: string, data: T) => {
        useEffect(() => {
            try {
                if(!isLoading) {
                    localStorage.setItem(key, JSON.stringify(data));
                }
            } catch (error) {
                console.error(`Failed to save ${key} to localStorage`, error);
            }
        }, [data, isLoading, key]);
    };

    useLocalStorage('calendar_users', users);
    useLocalStorage('calendar_bookings', bookings);
    useLocalStorage('calendar_shifts', shifts);
    useLocalStorage('calendar_vacations', vacations);
    useLocalStorage('calendar_notifications', notifications);
    useLocalStorage('calendar_shiftSwaps', shiftSwaps);


    // --- Auth Functions ---
    const login = useCallback((username: string, password: string): boolean => {
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
            setCurrentUser(user);
            localStorage.setItem('calendar_currentUser', JSON.stringify(user));
            return true;
        }
        return false;
    }, [users]);

    const logout = useCallback(() => {
        setCurrentUser(null);
        localStorage.removeItem('calendar_currentUser');
    }, []);

    // --- Notification Management ---
    const createNotification = useCallback((userId: string, message: string, options?: { requestType: 'shiftSwap', requestId: string }) => {
        const newNotification: Notification = {
            id: `${Date.now()}-${Math.random()}`,
            userId,
            message,
            seen: false,
            createdAt: new Date().toISOString(),
            ...options
        };
        setNotifications(prev => [newNotification, ...prev]);
    }, []);

    const markNotificationsAsSeen = useCallback((userId: string) => {
        setNotifications(prev =>
            prev.map(n => (n.userId === userId && !n.seen ? { ...n, seen: true } : n))
        );
    }, []);


    // --- User Management ---
    const registerAdmin = useCallback((data: Omit<User, 'id' | 'role'>) => {
        if (users.some(u => u.role === Role.ADMINISTRADOR)) { throw new Error("Ya existe un administrador registrado."); }
        if (users.some(u => u.username === data.username)) { throw new Error("El nombre de usuario ya está en uso."); }
        const newId = Date.now().toString();
        const newUser: User = { ...data, id: newId, role: Role.ADMINISTRADOR, vacationApproverId: newId };
        setUsers(prev => [...prev, newUser]);
    }, [users]);
    
    const addUser = useCallback((data: Omit<User, 'id'> & { vacationApproverId?: string }) => {
        if (users.some(u => u.username === data.username)) { throw new Error("El nombre de usuario ya está en uso."); }
        const newId = Date.now().toString();
        const newUser: User = { 
            ...data, 
            id: newId,
            vacationApproverId: data.vacationApproverId === 'self' ? newId : data.vacationApproverId 
        };
        setUsers(prev => [...prev, newUser]);
    }, [users]);

    const updateUser = useCallback((updatedUser: User) => {
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
        if (currentUser?.id === updatedUser.id) {
            setCurrentUser(updatedUser);
            localStorage.setItem('calendar_currentUser', JSON.stringify(updatedUser));
        }
    }, [currentUser]);

    const deleteUser = useCallback((userId: string) => {
        // Clean up any vacation approver references to the deleted user
        setUsers(prev => {
            const remainingUsers = prev.filter(u => u.id !== userId);
            return remainingUsers.map(u => {
                if (u.vacationApproverId === userId) {
                    return { ...u, vacationApproverId: undefined }; // Revert to default flow
                }
                return u;
            });
        });
        setBookings(prev => prev.filter(b => b.userId !== userId && b.bookedBy !== userId));
        setVacations(prev => prev.filter(v => v.userId !== userId && v.requestedBy !== userId));
        setShiftSwaps(prev => prev.filter(s => s.requesterId !== userId && s.requestedFromId !== userId));
    }, []);

    // --- Booking Management ---
    const addBooking = useCallback((booking: Omit<Booking, 'id'>) => {
        const newBooking: Booking = { ...booking, id: Date.now().toString() };
        setBookings(prev => [...prev, newBooking]);

        if (booking.bookedBy !== booking.userId) {
            const booker = users.find(u => u.id === booking.bookedBy);
            const dateStr = new Date(booking.date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
            if (booker) {
                createNotification(booking.userId, `${booker.firstName} ${booker.lastName} te ha asignado un turno el ${dateStr} de ${booking.startTime} a ${booking.endTime}.`);
            }
        }
    }, [users, createNotification]);

    const updateBooking = useCallback((updatedBooking: Booking) => {
        const oldBooking = bookings.find(b => b.id === updatedBooking.id);
        setBookings(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b));

        if (!oldBooking) return;
        
        const isStatusChange = oldBooking.status !== updatedBooking.status;
        const isEditByAdmin = oldBooking.userId !== currentUser?.id;

        const dateStr = new Date(updatedBooking.date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
        let message = '';
        let notifyUser = '';

        if (isStatusChange) {
            notifyUser = updatedBooking.bookedBy;
            if (oldBooking.status === BookingStatus.PENDING && updatedBooking.status === BookingStatus.APPROVED) {
                message = `Tu reserva para el ${dateStr} ha sido APROBADA.`;
            } else if (oldBooking.status === BookingStatus.PENDING && updatedBooking.status === BookingStatus.REJECTED) {
                message = `Tu reserva para el ${dateStr} ha sido RECHAZADA.`;
            } else if (oldBooking.status === BookingStatus.PENDING_DELETION && updatedBooking.status === BookingStatus.APPROVED) {
                message = `Tu solicitud para eliminar la reserva del ${dateStr} fue RECHAZADA. La reserva sigue activa.`;
            }
        } else if (isEditByAdmin) {
            // It's not a status change, so it's an edit by someone else
            notifyUser = oldBooking.userId;
            const editor = users.find(u => u.id === currentUser?.id);
            if (editor) {
                 message = `${editor.firstName} ha modificado tu turno del ${dateStr}. Ahora es de ${updatedBooking.startTime} a ${updatedBooking.endTime}.`;
            }
        }

        if (message && notifyUser !== currentUser?.id) {
            createNotification(notifyUser, message);
        }
    }, [bookings, currentUser?.id, createNotification, users]);

    const deleteBooking = useCallback((bookingId: string) => {
        const bookingToDelete = bookings.find(b => b.id === bookingId);
        if (bookingToDelete && bookingToDelete.status === BookingStatus.PENDING_DELETION && bookingToDelete.bookedBy !== currentUser?.id) {
            const dateStr = new Date(bookingToDelete.date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
            const message = `Tu solicitud para eliminar la reserva del ${dateStr} ha sido APROBADA.`;
            createNotification(bookingToDelete.bookedBy, message);
        }
        setBookings(prev => prev.filter(b => b.id !== bookingId));
    }, [bookings, currentUser?.id, createNotification]);

    // --- Shift Management ---
    const addShift = useCallback((data: Omit<Shift, 'id'>) => {
        if (shifts.some(s => s.name.toLowerCase() === data.name.toLowerCase())) { throw new Error("El nombre del turno ya está en uso."); }
        const newShift: Shift = { ...data, id: Date.now().toString() };
        setShifts(prev => [...prev, newShift].sort((a,b) => a.startTime.localeCompare(b.startTime)));
    }, [shifts]);

    const updateShift = useCallback((updatedShift: Shift) => {
        if (shifts.some(s => s.id !== updatedShift.id && s.name.toLowerCase() === updatedShift.name.toLowerCase())) { throw new Error("El nombre del turno ya está en uso."); }
        setShifts(prev => prev.map(s => s.id === updatedShift.id ? updatedShift : s).sort((a,b) => a.startTime.localeCompare(b.startTime)));
    }, [shifts]);

    const deleteShift = useCallback((shiftId: string) => {
        setShifts(prev => prev.filter(s => s.id !== shiftId));
    }, []);
    
    // --- Vacation Management ---
    const addVacation = useCallback((data: Omit<Vacation, 'id' | 'status'>) => {
        const requestingUser = users.find(u => u.id === data.userId);
        if (!requestingUser) return;
        
        const status = requestingUser.id === requestingUser.vacationApproverId
            ? VacationStatus.APPROVED
            : VacationStatus.PENDING;

        const newVacation: Vacation = { ...data, id: Date.now().toString(), status };
        setVacations(prev => [...prev, newVacation]);
    }, [users]);

    const updateVacation = useCallback((updatedVacation: Vacation) => {
        const oldVacation = vacations.find(v => v.id === updatedVacation.id);
        setVacations(prev => prev.map(v => v.id === updatedVacation.id ? updatedVacation : v));

        if (oldVacation && oldVacation.status !== updatedVacation.status && updatedVacation.requestedBy !== currentUser?.id) {
            const startDateStr = new Date(updatedVacation.startDate + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
            const endDateStr = new Date(updatedVacation.endDate + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
            let message = '';

            if (updatedVacation.status === VacationStatus.APPROVED) {
                message = `Tu solicitud de vacaciones (${startDateStr} - ${endDateStr}) ha sido APROBADA.`;
            } else if (updatedVacation.status === VacationStatus.REJECTED) {
                message = `Tu solicitud de vacaciones (${startDateStr} - ${endDateStr}) ha sido RECHAZADA.`;
            }

            if (message) {
                createNotification(updatedVacation.requestedBy, message);
            }
        }
    }, [vacations, currentUser?.id, createNotification]);

    const deleteVacation = useCallback((vacationId: string) => {
        setVacations(prev => prev.filter(v => v.id !== vacationId));
    }, []);

    // --- Shift Swap Management ---
    const addShiftSwap = useCallback((swap: Omit<ShiftSwapRequest, 'id'|'status'|'createdAt'>) => {
        const newSwap: ShiftSwapRequest = {
            ...swap,
            id: Date.now().toString(),
            status: ShiftSwapStatus.PENDING,
            createdAt: new Date().toISOString()
        };
        setShiftSwaps(prev => [newSwap, ...prev]);
        
        const requester = users.find(u => u.id === swap.requesterId);
        if (requester) {
            createNotification(
                swap.requestedFromId, 
                `${requester.firstName} ${requester.lastName} te ha propuesto un intercambio de turno.`,
                { requestType: 'shiftSwap', requestId: newSwap.id }
            );
        }

    }, [createNotification, users]);
    
    const updateShiftSwap = useCallback((updatedSwap: ShiftSwapRequest) => {
        setShiftSwaps(prev => prev.map(s => s.id === updatedSwap.id ? updatedSwap : s));

        // Remove the interactive notification once handled
        setNotifications(prev => prev.filter(n => n.requestId !== updatedSwap.id));

        if (updatedSwap.status === ShiftSwapStatus.APPROVED) {
            const requesterBooking = bookings.find(b => b.id === updatedSwap.requesterBookingId);
            const requestedBooking = bookings.find(b => b.id === updatedSwap.requestedBookingId);

            if (requesterBooking && requestedBooking) {
                const updatedRequesterBooking = { ...requesterBooking, userId: requestedBooking.userId };
                const updatedRequestedBooking = { ...requestedBooking, userId: requesterBooking.userId };
                
                setBookings(prev => prev.map(b => {
                    if (b.id === updatedRequesterBooking.id) return updatedRequesterBooking;
                    if (b.id === updatedRequestedBooking.id) return updatedRequestedBooking;
                    return b;
                }));
                
                createNotification(updatedSwap.requesterId, "Tu solicitud de intercambio de turno ha sido APROBADA.");
                if (currentUser?.id !== updatedSwap.requestedFromId) {
                    createNotification(updatedSwap.requestedFromId, "Un intercambio de turno que te involucraba ha sido APROBADO por un administrador.");
                }
            }
        } else if (updatedSwap.status === ShiftSwapStatus.REJECTED) {
             createNotification(updatedSwap.requesterId, "Tu solicitud de intercambio de turno ha sido RECHAZADA.");
             if (currentUser?.id !== updatedSwap.requestedFromId) {
                createNotification(updatedSwap.requestedFromId, "Un intercambio de turno que te involucraba ha sido RECHAZADO.");
            }
        }

    }, [bookings, createNotification, currentUser?.id]);


    const contextValue: AppContextType = {
        currentUser, users, bookings, shifts, vacations, notifications, shiftSwaps,
        login, logout, registerAdmin, addUser, updateUser, deleteUser,
        addBooking, updateBooking, deleteBooking,
        addShift, updateShift, deleteShift,
        addVacation, updateVacation, deleteVacation,
        markNotificationsAsSeen,
        addShiftSwap, updateShiftSwap
    };

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
    }

    return (
        <AppContext.Provider value={contextValue}>
            {currentUser ? <CalendarView /> : <LoginView />}
        </AppContext.Provider>
    );
};

export default App;