
import React, { useState, useEffect } from 'react';
import { Booking, User, Role, BookingStatus, Shift } from '../types';
import { useSafeContext } from '../App';
import { TIME_OPTIONS } from '../constants';
import { XCircleIcon, TrashIcon } from './Icons';

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    date: Date;
    bookingToEdit?: Booking | null;
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, date, bookingToEdit }) => {
    const { users, addBooking, updateBooking, deleteBooking, currentUser, shifts } = useSafeContext();
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [bookingDate, setBookingDate] = useState(date.toISOString().split('T')[0]);
    const [shiftType, setShiftType] = useState<'preset' | 'custom'>('preset');
    const [selectedShiftId, setSelectedShiftId] = useState<string>(shifts.length > 0 ? shifts[0].id : '');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (bookingToEdit) {
            setSelectedUserId(bookingToEdit.userId);
            setBookingDate(bookingToEdit.date);
            setNotes(bookingToEdit.notes || '');
            
            const matchingShift = shifts.find(s => s.startTime === bookingToEdit.startTime && s.endTime === bookingToEdit.endTime);

            if (matchingShift) {
                setShiftType('preset');
                setSelectedShiftId(matchingShift.id);
            } else {
                setShiftType('custom');
                setStartTime(bookingToEdit.startTime);
                setEndTime(bookingToEdit.endTime);
            }
        } else {
            // Reset form
            setSelectedUserId(currentUser?.id || (users.length > 0 ? users[0].id : ''));
            setBookingDate(date.toISOString().split('T')[0]);
            setShiftType('preset');
            setSelectedShiftId(shifts.length > 0 ? shifts[0].id : '');
            setStartTime('09:00');
            setEndTime('17:00');
            setNotes('');
            setError('');
        }
    }, [bookingToEdit, isOpen, users, shifts, currentUser, date]);


    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!selectedUserId) {
            setError('Por favor, seleccione un usuario.');
            return;
        }

        let finalStartTime = startTime;
        let finalEndTime = endTime;

        if (shiftType === 'preset') {
            const selectedShift = shifts.find(s => s.id === selectedShiftId);
            if(selectedShift) {
                finalStartTime = selectedShift.startTime;
                finalEndTime = selectedShift.endTime;
            } else {
                 setError('Turno preestablecido no válido.');
                 return;
            }
        }
        
        if (finalStartTime >= finalEndTime && finalEndTime !== '00:00') {
            setError('La hora de inicio debe ser anterior a la hora de finalización.');
            return;
        }

        if (!currentUser) return; // Should not happen

        const newBookingData: Omit<Booking, 'id' | 'status'> = {
            userId: selectedUserId,
            date: bookingDate,
            startTime: finalStartTime,
            endTime: finalEndTime,
            bookedBy: currentUser.id,
            notes,
        };

        if (bookingToEdit) {
            updateBooking({ ...bookingToEdit, ...newBookingData });
        } else {
             const status = currentUser.role === Role.MATEHOST ? BookingStatus.PENDING : BookingStatus.APPROVED;
            addBooking({...newBookingData, status});
        }
        onClose();
    };

    const handleDelete = () => {
        if (!bookingToEdit || !currentUser) return;

        if (currentUser.role === Role.MATEHOST) {
            if (window.confirm('¿Desea solicitar la eliminación de esta reserva? Un administrador deberá aprobarlo.')) {
                updateBooking({ ...bookingToEdit, status: BookingStatus.PENDING_DELETION });
                onClose();
            }
        } else {
            if (window.confirm('¿Está seguro de que desea eliminar esta reserva permanentemente?')) {
                deleteBooking(bookingToEdit.id);
                onClose();
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 relative animate-fade-in-down">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-800">
                    <XCircleIcon className="h-7 w-7"/>
                </button>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">{bookingToEdit ? 'Editar' : 'Nueva'} Reserva para {new Date(bookingDate + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    {bookingToEdit && (
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                            <input
                                type="date"
                                value={bookingDate}
                                onChange={(e) => setBookingDate(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                        <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                            {users.map(user => <option key={user.id} value={user.id}>{user.firstName} {user.lastName} ({user.role})</option>)}
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Turno</label>
                        <div className="flex rounded-md shadow-sm">
                            <button type="button" onClick={() => setShiftType('preset')} className={`flex-1 p-2 rounded-l-md transition-colors ${shiftType === 'preset' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}>Preestablecido</button>
                            <button type="button" onClick={() => setShiftType('custom')} className={`flex-1 p-2 rounded-r-md transition-colors ${shiftType === 'custom' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}>Personalizado</button>
                        </div>
                    </div>

                    {shiftType === 'preset' ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Turno Preestablecido</label>
                            <select value={selectedShiftId} onChange={e => setSelectedShiftId(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm">
                                {shifts.map(shift => <option key={shift.id} value={shift.id}>{shift.name} ({shift.startTime} - {shift.endTime})</option>)}
                            </select>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                                <select value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm">
                                    {TIME_OPTIONS.map(time => <option key={time} value={time}>{time}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                                <select value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm">
                                    {TIME_OPTIONS.map(time => <option key={time} value={time}>{time}</option>)}
                                </select>
                            </div>
                        </div>
                    )}
                   
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notas (opcional)</label>
                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"></textarea>
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    
                    <div className="flex justify-between items-center pt-4">
                        <div>
                            {bookingToEdit && (
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    className="py-2 px-4 bg-red-100 text-red-700 rounded-md hover:bg-red-200 flex items-center transition-colors disabled:opacity-50"
                                >
                                    <TrashIcon className="h-5 w-5 mr-2" />
                                    {currentUser?.role === Role.MATEHOST ? 'Solicitar Eliminación' : 'Eliminar Reserva'}
                                </button>
                            )}
                        </div>
                        <div className="flex justify-end">
                            <button type="button" onClick={onClose} className="mr-3 py-2 px-4 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Cancelar</button>
                            <button type="submit" className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700">{bookingToEdit ? 'Guardar Cambios' : 'Crear Reserva'}</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BookingModal;
