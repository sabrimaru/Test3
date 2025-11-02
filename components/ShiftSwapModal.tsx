import React, { useState, useMemo } from 'react';
import { useSafeContext } from '../App';
import { Booking, BookingStatus } from '../types';
import { XCircleIcon, SwapIcon } from './Icons';

interface ShiftSwapModalProps {
    isOpen: boolean;
    onClose: () => void;
    bookingToSwap: Booking | null;
}

const ShiftSwapModal: React.FC<ShiftSwapModalProps> = ({ isOpen, onClose, bookingToSwap }) => {
    const { currentUser, users, bookings, addShiftSwap } = useSafeContext();
    const [selectedBookingId, setSelectedBookingId] = useState<string>('');
    const [error, setError] = useState('');

    const availableSwaps = useMemo(() => {
        if (!currentUser || !bookingToSwap) return [];
        return bookings.filter(b => 
            b.id !== bookingToSwap.id &&
            b.userId !== currentUser.id &&
            b.status === BookingStatus.APPROVED
        ).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [bookings, currentUser, bookingToSwap]);

    if (!isOpen || !bookingToSwap || !currentUser) return null;

    const handleSubmit = () => {
        setError('');
        if (!selectedBookingId) {
            setError('Por favor, seleccione un turno para intercambiar.');
            return;
        }

        const requestedBooking = availableSwaps.find(b => b.id === selectedBookingId);
        if (!requestedBooking) {
            setError('El turno seleccionado no es válido.');
            return;
        }

        addShiftSwap({
            requesterId: currentUser.id,
            requestedFromId: requestedBooking.userId,
            requesterBookingId: bookingToSwap.id,
            requestedBookingId: selectedBookingId,
        });

        onClose();
    };
    
    const userForMyBooking = users.find(u => u.id === bookingToSwap.userId);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 relative animate-fade-in-down flex flex-col h-[90vh]">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-800">
                    <XCircleIcon className="h-7 w-7"/>
                </button>
                <div className="flex items-center mb-4 pb-4 border-b">
                    <SwapIcon className="h-8 w-8 text-purple-600 mr-3" />
                    <h2 className="text-2xl font-bold text-gray-800">Solicitar Intercambio de Turno</h2>
                </div>

                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="font-semibold text-blue-800">Tu turno a intercambiar:</p>
                    <p className="text-sm text-blue-700">
                        {userForMyBooking?.firstName} {userForMyBooking?.lastName} - {new Date(bookingToSwap.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })} ({bookingToSwap.startTime} - {bookingToSwap.endTime})
                    </p>
                </div>
                
                <p className="text-sm font-medium text-gray-700 mb-2">Selecciona un turno disponible para proponer el intercambio:</p>
                
                <div className="flex-grow overflow-y-auto border rounded-lg">
                    <ul className="divide-y divide-gray-200">
                        {availableSwaps.length > 0 ? availableSwaps.map(booking => {
                            const user = users.find(u => u.id === booking.userId);
                            return (
                                <li key={booking.id} className={`p-3 cursor-pointer transition-colors ${selectedBookingId === booking.id ? 'bg-purple-100' : 'hover:bg-gray-50'}`} onClick={() => setSelectedBookingId(booking.id)}>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold">{user?.firstName} {user?.lastName}</p>
                                            <p className="text-sm text-gray-600">
                                                {new Date(booking.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                                            </p>
                                        </div>
                                        <p className="text-sm font-mono text-gray-800">{booking.startTime} - {booking.endTime}</p>
                                    </div>
                                </li>
                            );
                        }) : <p className="p-4 text-center text-gray-500">No hay turnos disponibles para intercambiar.</p>}
                    </ul>
                </div>

                {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                
                <div className="flex justify-end pt-6 border-t mt-4">
                    <button type="button" onClick={onClose} className="mr-3 py-2 px-4 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button type="button" onClick={handleSubmit} disabled={!selectedBookingId} className="py-2 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed">Enviar Solicitud</button>
                </div>
            </div>
        </div>
    );
};

export default ShiftSwapModal;