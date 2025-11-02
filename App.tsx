
import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { User, Booking, Role, Shift, Vacation, VacationStatus, BookingStatus, Notification, ShiftSwapRequest, ShiftSwapStatus } from './types';
import LoginView from './components/LoginView';
import CalendarView from './components/CalendarView';

// Allow using the global firebase object from the script tag
declare var firebase: any;

// --- FIREBASE INITIALIZATION ---
// TODO: Replace with your project's Firebase credentials
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

// --- APP CONTEXT ---
interface AppContextType {
    currentUser: User | null;
    users: User[];
    bookings: Booking[];
    shifts: Shift[];
    vacations: Vacation[];
    notifications: Notification[];
    shiftSwaps: ShiftSwapRequest[];
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    registerAdmin: (data: Omit<User, 'id' | 'role'> & { password_NOT_SAVED: string }) => Promise<void>;
    addUser: (data: Omit<User, 'id'> & { password_NOT_SAVED: string, vacationApproverId?: string }) => Promise<void>;
    updateUser: (user: User) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
    addBooking: (booking: Omit<Booking, 'id'>) => Promise<void>;
    updateBooking: (booking: Booking) => Promise<void>;
    deleteBooking: (bookingId: string) => Promise<void>;
    addShift: (shift: Omit<Shift, 'id'>) => Promise<void>;
    updateShift: (shift: Shift) => Promise<void>;
    deleteShift: (shiftId: string) => Promise<void>;
    addVacation: (vacation: Omit<Vacation, 'id' | 'status'>) => Promise<void>;
    updateVacation: (vacation: Vacation) => Promise<void>;
    deleteVacation: (vacationId: string) => Promise<void>;
    markNotificationsAsSeen: (userId: string) => Promise<void>;
    addShiftSwap: (swap: Omit<ShiftSwapRequest, 'id'|'status'|'createdAt'>) => Promise<void>;
    updateShiftSwap: (swap: ShiftSwapRequest) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const useSafeContext = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useSafeContext must be used within an AppProvider');
    return context;
};

// --- MAIN APP COMPONENT ---
const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [vacations, setVacations] = useState<Vacation[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [shiftSwaps, setShiftSwaps] = useState<ShiftSwapRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged(async (userAuth) => {
            if (userAuth) {
                const userDoc = await db.collection('users').doc(userAuth.uid).get();
                if (userDoc.exists) {
                    setCurrentUser({ id: userDoc.id, ...userDoc.data() } as User);
                } else {
                    setCurrentUser(null);
                }
            } else {
                setCurrentUser(null);
            }
            setIsLoading(false);
        });

        const unsubscribes: (() => void)[] = [];
        if (currentUser) {
            const collections = ['users', 'bookings', 'shifts', 'vacations', 'notifications', 'shiftSwaps'];
            const setters: any = { users: setUsers, bookings: setBookings, shifts: setShifts, vacations: setVacations, notifications: setNotifications, shiftSwaps: setShiftSwaps };

            collections.forEach(collection => {
                const unsubscribe = db.collection(collection).onSnapshot(snapshot => {
                    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setters[collection](data);
                });
                unsubscribes.push(unsubscribe);
            });
        }
        
        return () => {
            unsubscribeAuth();
            unsubscribes.forEach(unsub => unsub());
        };
    }, [currentUser?.id]);
    
    // --- CONTEXT FUNCTIONS ---
    const login = async (email: string, password: string) => {
        await auth.signInWithEmailAndPassword(email, password);
    };

    const logout = async () => {
        await auth.signOut();
    };
    
    const createNotification = async (userId: string, message: string, options?: { requestType: 'shiftSwap', requestId: string }) => {
        const newNotification = {
            userId,
            message,
            seen: false,
            createdAt: new Date().toISOString(),
            ...options
        };
        await db.collection('notifications').add(newNotification);
    };

    const registerAdmin = async (data: Omit<User, 'id' | 'role'> & { password_NOT_SAVED: string }) => {
        const usersSnapshot = await db.collection('users').where('role', '==', Role.ADMINISTRADOR).get();
        if (!usersSnapshot.empty) { throw new Error("Ya existe un administrador registrado."); }

        const userCredential = await auth.createUserWithEmailAndPassword(data.email, data.password_NOT_SAVED);
        const newId = userCredential.user.uid;
        
        const newUser: Omit<User, 'id'> = {
            username: data.username,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            role: Role.ADMINISTRADOR,
            vacationApproverId: newId
        };
        await db.collection('users').doc(newId).set(newUser);
    };

    const addUser = async (data: Omit<User, 'id'> & { password_NOT_SAVED: string, vacationApproverId?: string }) => {
       // Note: In a real app, user creation would be handled by a secure backend function.
       // This is a simplified client-side version for demonstration.
       alert("La creación de usuarios debe ser manejada por un administrador desde una función de backend segura por razones de seguridad. Esta función está deshabilitada en este ejemplo.");
    };

    const updateUser = async (updatedUser: User) => {
        const { id, ...userData } = updatedUser;
        await db.collection('users').doc(id).update(userData);
    };
    
    const deleteUser = async (userId: string) => {
       alert("La eliminación de usuarios debe ser manejada por un administrador desde una función de backend segura para garantizar la integridad de los datos (ej: reasignar turnos).");
    };

    const addBooking = async (booking: Omit<Booking, 'id'>) => {
        const newBooking = await db.collection('bookings').add(booking);
        if (booking.bookedBy !== booking.userId) {
             const booker = users.find(u => u.id === booking.bookedBy);
            const dateStr = new Date(booking.date + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
            if (booker) {
                await createNotification(booking.userId, `${booker.firstName} ${booker.lastName} te ha asignado un turno el ${dateStr} de ${booking.startTime} a ${booking.endTime}.`);
            }
        }
    };

    const updateBooking = async (updatedBooking: Booking) => {
        const { id, ...bookingData } = updatedBooking;
        await db.collection('bookings').doc(id).update(bookingData);
    };

    const deleteBooking = async (bookingId: string) => {
        await db.collection('bookings').doc(bookingId).delete();
    };
    
    const addShift = async (shift: Omit<Shift, 'id'>) => { await db.collection('shifts').add(shift); };
    const updateShift = async (updatedShift: Shift) => { const { id, ...shiftData } = updatedShift; await db.collection('shifts').doc(id).update(shiftData); };
    const deleteShift = async (shiftId: string) => { await db.collection('shifts').doc(shiftId).delete(); };
    
    const addVacation = async (data: Omit<Vacation, 'id' | 'status'>) => {
        const requestingUser = users.find(u => u.id === data.userId);
        if (!requestingUser) return;
        
        const status = requestingUser.id === requestingUser.vacationApproverId ? VacationStatus.APPROVED : VacationStatus.PENDING;
        await db.collection('vacations').add({ ...data, status });
    };

    const updateVacation = async (updatedVacation: Vacation) => { const { id, ...vacationData } = updatedVacation; await db.collection('vacations').doc(id).update(vacationData); };
    const deleteVacation = async (vacationId: string) => { await db.collection('vacations').doc(vacationId).delete(); };

    const markNotificationsAsSeen = async (userId: string) => {
        const unseenNotifs = await db.collection('notifications').where('userId', '==', userId).where('seen', '==', false).get();
        const batch = db.batch();
        unseenNotifs.docs.forEach(doc => {
            batch.update(doc.ref, { seen: true });
        });
        await batch.commit();
    };

    const addShiftSwap = async (swap: Omit<ShiftSwapRequest, 'id'|'status'|'createdAt'>) => {
        const newSwapData = { ...swap, status: ShiftSwapStatus.PENDING, createdAt: new Date().toISOString() };
        const newSwapRef = await db.collection('shiftSwaps').add(newSwapData);
        
        const requester = users.find(u => u.id === swap.requesterId);
        if (requester) {
            await createNotification(
                swap.requestedFromId, 
                `${requester.firstName} ${requester.lastName} te ha propuesto un intercambio de turno.`,
                { requestType: 'shiftSwap', requestId: newSwapRef.id }
            );
        }
    };
    
    const updateShiftSwap = async (updatedSwap: ShiftSwapRequest) => {
        const { id, ...swapData } = updatedSwap;
        await db.collection('shiftSwaps').doc(id).update(swapData);

        // Logic for swapping bookings if approved
        if (updatedSwap.status === ShiftSwapStatus.APPROVED) {
            const requesterBookingRef = db.collection('bookings').doc(updatedSwap.requesterBookingId);
            const requestedBookingRef = db.collection('bookings').doc(updatedSwap.requestedBookingId);
            
            await db.runTransaction(async (transaction) => {
                const reqBookingDoc = await transaction.get(requesterBookingRef);
                const requestedBookingDoc = await transaction.get(requestedBookingRef);
                if (!reqBookingDoc.exists || !requestedBookingDoc.exists) { throw "Booking not found!"; }

                const originalRequesterId = reqBookingDoc.data()?.userId;
                const originalRequestedId = requestedBookingDoc.data()?.userId;
                
                transaction.update(requesterBookingRef, { userId: originalRequestedId });
                transaction.update(requestedBookingRef, { userId: originalRequesterId });
            });
        }
    };

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
        return <div className="min-h-screen flex items-center justify-center bg-gray-100"><div className="text-xl font-semibold text-gray-700">Cargando aplicación...</div></div>;
    }

    return (
        <AppContext.Provider value={contextValue}>
            {currentUser ? <CalendarView /> : <LoginView />}
        </AppContext.Provider>
    );
};

export default App;
