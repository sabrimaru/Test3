import React, { useState, useMemo, useEffect } from 'react';
import { useSafeContext } from '../App';
import { XCircleIcon } from './Icons';
import { Vacation, VacationStatus } from '../types';

interface VacationModalProps {
    isOpen: boolean;
    onClose: () => void;
    vacationToEdit?: Vacation | null;
}

const VacationModal: React.FC<VacationModalProps> = ({ isOpen, onClose, vacationToEdit }) => {
    const { currentUser, users, addVacation, updateVacation } = useSafeContext();
    const today = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [error, setError] = useState('');

    useEffect(() => {
        if (vacationToEdit) {
            setStartDate(vacationToEdit.startDate);
            setEndDate(vacationToEdit.endDate);
        } else {
            setStartDate(today);
            setEndDate(today);
        }
        setError('');
    }, [vacationToEdit, isOpen, today]);

    const approverInfo = useMemo(() => {
        if (!currentUser || vacationToEdit) return null; // Don't show on edit
        if (currentUser.id === currentUser.vacationApproverId) {
            return { text: "Su solicitud será aprobada automáticamente." };
        }
        const approver = users.find(u => u.id === currentUser.vacationApproverId);
        if (approver) {
            return { text: `Su solicitud será enviada a ${approver.firstName} ${approver.lastName} para su aprobación.` };
        }
        return { text: "Su solicitud deberá ser aprobada por un Asistente o Administrador." };
    }, [currentUser, users, vacationToEdit]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!currentUser) return;
        
        if (new Date(startDate) > new Date(endDate)) {
            setError('La fecha de inicio no puede ser posterior a la fecha de finalización.');
            return;
        }

        if (vacationToEdit) {
            // If the vacation was already approved or rejected, changing it should reset the status to pending.
            const isAlreadyDecided = vacationToEdit.status === VacationStatus.APPROVED || vacationToEdit.status === VacationStatus.REJECTED;
            const newStatus = isAlreadyDecided ? VacationStatus.PENDING : vacationToEdit.status;

            updateVacation({ ...vacationToEdit, startDate, endDate, status: newStatus });
        } else {
            addVacation({
                userId: currentUser.id,
                startDate,
                endDate,
                requestedBy: currentUser.id,
            });
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative animate-fade-in-down">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-800">
                    <XCircleIcon className="h-7 w-7"/>
                </button>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">{vacationToEdit ? 'Editar' : 'Solicitar'} Vacaciones</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                            <input
                                type="date"
                                id="start-date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                min={vacationToEdit ? undefined : today}
                                required
                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                            <input
                                type="date"
                                id="end-date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                min={startDate}
                                required
                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
                            />
                        </div>
                    </div>
                    
                    {approverInfo && <p className="text-gray-600 text-sm bg-gray-100 p-3 rounded-md mt-2">{approverInfo.text}</p>}
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    
                    <div className="flex justify-end pt-4">
                        <button type="button" onClick={onClose} className="mr-3 py-2 px-4 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Cancelar</button>
                        <button type="submit" className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700">{vacationToEdit ? 'Guardar Cambios' : 'Enviar Solicitud'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VacationModal;