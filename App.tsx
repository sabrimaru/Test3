
import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { User, Booking, Role, Shift, Vacation, VacationStatus, BookingStatus, Notification, ShiftSwapRequest, ShiftSwapStatus } from './types';
import LoginView from './components/LoginView';
import CalendarView from './components/CalendarView';

// Allow using the global firebase object from the script tag in index.html
declare var firebase: any;

// --- Firebase Configuration ---
// This configuration is loaded by the script tags in index.html
const firebaseConfig = {
  apiKey: "AIzaSyC6yDbJ-jZN1cYgaVpVDZy17yF4Abz9WTY",
  authDomain: "agenda-de-turnos---matehost.firebaseapp.com",
  projectId: "agenda-de-turnos---matehost",
  storageBucket: "agenda-de-turnos---matehost.firebasestorage.app",
  messagingSenderId: "1032623984553",
  appId: "1:1032623984553:web:942cd1a6d559261e1abeb8",
  measurementId: "G-80F58KNNCC"
};

// Initialize Firebase using the global object from the script tag
// This check prevents re-initializing the app on every hot-reload.
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Get Firebase services using the v8 SDK syntax
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
        const unsubscribeAuth = auth.onAuthStateChanged(async (userAuth: any) => {
            if (userAuth) {
                const userDoc = await db.collection('users').doc(userAuth.uid).get();
                if (userDoc.exists) {
                    setCurrentUser({ id: userDoc.id, ...userDoc.data() } as User);
                }
            } else {
                setCurrentUser(null);
            }
            setIsLoading(false);
        });

        const unsubscribes: (() => void)[] = [];
        // Only subscribe to Firestore collections if a user is logged in
        if (currentUser && currentUser.id) {
            const collections: { name: string; setter: React.Dispatch<React.SetStateAction<any[]>> }[] = [
                { name: 'users', setter: setUsers },
                { name: 'bookings', setter: setBookings },
                { name: 'shifts', setter: setShifts },
                { name: 'vacations', setter: setVacations },
                { name: 'notifications', setter: setNotifications },
                { name: 'shiftSwaps', setter: setShiftSwaps },
            ];

            collections.forEach(collection => {
                const unsubscribe = db.collection(collection.name).onSnapshot((snapshot: any) => {
                    const data = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
                    collection.setter(data);
                });
                unsubscribes.push(unsubscribe);
            });
        }
        
        return () => {
            unsubscribeAuth();
            unsubscribes.forEach(unsub => unsub());
        };
    }, [currentUser?.id]); // Rerun effect when currentUser.id changes (login/logout)
    
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
       // ADVERTENCIA: Esta es una implementación del lado del cliente solo para demostración.
       // La creación de usuarios en nombre de otros en el cliente NO es segura.
       // En una aplicación de producción, esto DEBE ser manejado por un entorno de backend seguro
       // (como Firebase Cloud Functions) para evitar exponer la lógica de creación de usuarios y
       // para gestionar los permisos correctamente.
       
       // Se crea una instancia de app de Firebase secundaria y temporal para crear el usuario.
       // Esto evita que el administrador actual cierre la sesión.
       const secondaryAppName = `secondary-app-${Date.now()}`;
       const secondaryApp = firebase.initializeApp(firebaseConfig, secondaryAppName);
       
       try {
        const userCredential = await secondaryApp.auth().createUserWithEmailAndPassword(data.email, data.password_NOT_SAVED);
        const newId = userCredential.user.uid;

        let approverId = data.vacationApproverId;
        if (approverId === 'self' || !approverId) {
            approverId = newId;
        }

        const newUser: Omit<User, 'id'> = {
            username: data.username,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            role: data.role,
            vacationApproverId: approverId
        };
        
        // Se usa la instancia principal de la BD para crear el documento en Firestore.
        await db.collection('users').doc(newId).set(newUser);
       } catch(error) {
           console.error("Error creating user:", error);
           if (error instanceof Error) {
               throw new Error(`Error al crear usuario: ${error.message}`);
           }
           throw new Error("Ocurrió un error desconocido al crear el usuario.");
       } finally {
           // Se limpia la instancia de la app secundaria.
           await secondaryApp.delete();
       }
    };

    const updateUser = async (updatedUser: User) => {
        const { id, ...userData } = updatedUser;
        await db.collection('users').doc(id).update(userData);
    };
    
    const deleteUser = async (userId: string) => {
       // ADVERTENCIA: Esto solo elimina los datos del usuario de Firestore.
       // NO elimina al usuario de Firebase Authentication.
       // Eliminar un usuario de autenticación requiere el SDK de Admin en un entorno de backend seguro
       // (como Firebase Cloud Functions).
       // Después de ejecutar esto, debe eliminar manualmente al usuario desde la Consola de Firebase.
       await db.collection('users').doc(userId).delete();
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
        unseenNotifs.docs.forEach((doc: any) => {
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
            
            await db.runTransaction(async (transaction: any) => {
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
