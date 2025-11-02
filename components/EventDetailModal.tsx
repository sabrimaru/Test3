import React from 'react';
import { Booking, Vacation, Role, BookingStatus, VacationStatus } from '../types';
import { useSafeContext } from '../App';
import { XCircleIcon, TrashIcon, CheckIcon, XIcon, SunIcon, ClockIcon, SwapIcon } from './Icons';
import { ROLE_COLORS, STATUS_COLORS, VACATION_COLOR } from '../constants';

interface EventDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: Booking | Vacation | null;
    onEdit: (event: Booking | Vacation) => void;
    onSwap: (booking: Booking) => void;
}

const EventDetailModal: React.FC<EventDetailModalProps> = ({ isOpen, onClose, event, onEdit, onSwap }) => {
    const { currentUser, users, updateBooking, deleteBooking, updateVacation, deleteVacation } = useSafeContext();

    if (!isOpen || !event || !currentUser) return null;

    const isBooking = 'date' in event;
    const eventUser = users.find(u => u.id === event.userId);
    const canManage = currentUser.role === Role.ADMINISTRADOR || currentUser.role === Role.ASISTENTE;
    const isOwner = currentUser.id === event.userId;

    // --- Action Handlers ---
    const handleApprove = () => {
        if (isBooking && event.status === BookingStatus.PENDING) {
            updateBooking({ ...event, status: BookingStatus.APPROVED });
        } else if (!isBooking && event.status === VacationStatus.PENDING) {
            updateVacation({ ...event, status: VacationStatus.APPROVED });
        } else if (isBooking && event.status === BookingStatus.PENDING_DELETION) {
            deleteBooking(event.id);
        }
        onClose();
    };

    const handleReject = () => {
        if (isBooking && event.status === BookingStatus.PENDING) {
            updateBooking({ ...event, status: BookingStatus.REJECTED });
        } else if (!isBooking && event.status === VacationStatus.PENDING) {
            updateVacation({ ...event, status: VacationStatus.REJECTED });
        } else if (isBooking && event.status === BookingStatus.PENDING_DELETION) {
            updateBooking({ ...event, status: BookingStatus.APPROVED }); // Revert
        }
        onClose();
    };
    
    const handleDelete = () => {
        if (isBooking) {
            if (currentUser.role === Role.MATEHOST && isOwner) {
                if(window.confirm('¿Desea solicitar la eliminación de esta reserva? Un administrador deberá aprobarlo.')) {
                    updateBooking({ ...event, status: BookingStatus.PENDING_DELETION });
                }
            } else if (canManage) {
                 if(window.confirm('¿Está seguro de que desea eliminar esta reserva permanentemente?')) {
                    deleteBooking(event.id);
                }
            }
        } else { // Vacation
            if(window.confirm('¿Está seguro de que desea eliminar esta solicitud de vacaciones?')) {
                deleteVacation(event.id);
            }
        }
        onClose();
    };


    // --- Render Logic ---
    const renderTitle = () => {
        const title = isBooking ? 'Detalles de la Reserva' : 'Detalles de Vacaciones';
        const icon = isBooking ? <ClockIcon className="h-7 w-7 mr-3" /> : <SunIcon className="h-7 w-7 mr-3" />;
        const statusColor = STATUS_COLORS[event.status as BookingStatus];
        const roleColor = eventUser ? ROLE_COLORS[eventUser.role] : null;
        
        const colors = isBooking ? (statusColor || roleColor) : VACATION_COLOR;
        
        return (
            <div className={`p-4 rounded-t-lg flex items-center ${colors?.bg} ${colors?.text}`}>
                {icon}
                <h2 className="text-2xl font-bold">{title}</h2>
            </div>
        );
    };

    const renderDetails = () => {
        if (!eventUser) return null;
        const bookedBy = isBooking ? users.find(u => u.id === event.bookedBy) : null;

        return (
             <div className="p-6 space-y-3 text-gray-700">
                <p><strong>Usuario:</strong> {eventUser.firstName} {eventUser.lastName}</p>
                {isBooking ? (
                    <>
                        <p><strong>Fecha:</strong> {new Date(event.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                        <p><strong>Horario:</strong> {event.startTime} - {event.endTime}</p>
                    </>
                ) : (
                    <>
                        <p><strong>Desde:</strong> {new Date(event.startDate + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        <p><strong>Hasta:</strong> {new Date(event.endDate + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </>
                )}
                <p><strong>Estado:</strong> <span className="font-semibold">{event.status}</span></p>
                {bookedBy && <p><strong>Reservado por:</strong> {bookedBy.firstName} {bookedBy.lastName}</p>}
                {isBooking && event.notes && <div className="pt-2"><strong>Notas:</strong><p className="p-2 bg-gray-100 rounded-md text-sm">{event.notes}</p></div>}
            </div>
        );
    };

    const renderActions = () => {
        const canEdit = isBooking ? canManage : isOwner; // Admins can edit any booking. Users can edit their own vacations.
        const canDelete = isBooking 
            ? ((isOwner && currentUser.role === Role.MATEHOST) || canManage) 
            : (isOwner || canManage);
        
        const canSwap = isBooking && isOwner && event.status === BookingStatus.APPROVED;
        const isPending = event.status === BookingStatus.PENDING || event.status === VacationStatus.PENDING;
        const showApprovalActions = canManage && (isPending || event.status === BookingStatus.PENDING_DELETION);

        return (
            <div className="bg-gray-50 p-4 rounded-b-lg flex flex-wrap justify-end items-center gap-3">
                {showApprovalActions && (
                    <>
                        <button onClick={handleReject} className="py-2 px-4 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center"><XIcon className="h-5 w-5 mr-2" /> Rechazar</button>
                        <button onClick={handleApprove} className="py-2 px-4 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center"><CheckIcon className="h-5 w-5 mr-2" /> Aprobar</button>
                    </>
                )}
                {canSwap && <button onClick={() => onSwap(event)} className="py-2 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center"><SwapIcon className="h-5 w-5 mr-2" /> Intercambiar</button>}
                {canEdit && <button onClick={() => onEdit(event)} className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700">Editar</button>}
                {canDelete && <button onClick={handleDelete} className="py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center"><TrashIcon className="h-5 w-5 mr-2" /> Eliminar</button>}
            </div>
        );
    }
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg relative animate-fade-in-down">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 z-10">
                    <XCircleIcon className="h-8 w-8"/>
                </button>
                {renderTitle()}
                {renderDetails()}
                {renderActions()}
            </div>
        </div>
    );
};

export default EventDetailModal;