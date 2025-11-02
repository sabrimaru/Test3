import React, { useState, useEffect } from 'react';
import { Notification, ShiftSwapStatus } from '../types';
import { XCircleIcon, BellIcon, CheckIcon, XIcon } from './Icons';
import { useSafeContext } from '../App';

interface NewsModalProps {
    isOpen: boolean;
    onClose: () => void;
    notifications: Notification[];
}

const NewsModal: React.FC<NewsModalProps> = ({ isOpen, onClose, notifications }) => {
    const { shiftSwaps, updateShiftSwap } = useSafeContext();
    const [unhandledSwaps, setUnhandledSwaps] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (isOpen) {
            const pendingSwapIds = new Set(
                notifications.filter(n => n.requestType === 'shiftSwap').map(n => n.requestId || '')
            );
            setUnhandledSwaps(pendingSwapIds);
        }
    }, [isOpen, notifications]);

    if (!isOpen) return null;

    const handleAction = (swapId: string, status: ShiftSwapStatus.APPROVED | ShiftSwapStatus.REJECTED) => {
        const swap = shiftSwaps.find(s => s.id === swapId);
        if (swap) {
            updateShiftSwap({ ...swap, status });
        }
        setUnhandledSwaps(prev => {
            const next = new Set(prev);
            next.delete(swapId);
            return next;
        });
    };

    const handleClose = () => {
        if (unhandledSwaps.size > 0) {
            if (!window.confirm('Tienes solicitudes de intercambio pendientes. ¿Estás seguro de que quieres cerrar y decidir más tarde?')) {
                return;
            }
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 relative animate-fade-in-down">
                <button onClick={handleClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-800">
                    <XCircleIcon className="h-7 w-7"/>
                </button>
                <div className="flex items-center mb-6">
                    <BellIcon className="h-8 w-8 text-blue-600 mr-3" />
                    <h2 className="text-2xl font-bold text-gray-800">Novedades</h2>
                </div>
                
                <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                    {notifications.length > 0 ? (
                        notifications.map(notification => {
                            const isSwap = notification.requestType === 'shiftSwap' && notification.requestId;
                            const swapRequest = isSwap ? shiftSwaps.find(s => s.id === notification.requestId) : null;
                            const showActions = isSwap && swapRequest?.status === ShiftSwapStatus.PENDING;

                            return (
                                <div key={notification.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <p className="text-sm text-gray-700">{notification.message}</p>
                                    <div className="flex justify-between items-center mt-1">
                                        <p className="text-xs text-gray-400">{new Date(notification.createdAt).toLocaleString('es-ES')}</p>
                                        {showActions && notification.requestId && (
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => handleAction(notification.requestId!, ShiftSwapStatus.REJECTED)} className="p-1.5 rounded-full bg-red-100 hover:bg-red-200" title="Rechazar">
                                                    <XIcon className="h-4 w-4 text-red-600" />
                                                </button>
                                                <button onClick={() => handleAction(notification.requestId!, ShiftSwapStatus.APPROVED)} className="p-1.5 rounded-full bg-green-100 hover:bg-green-200" title="Aprobar">
                                                    <CheckIcon className="h-4 w-4 text-green-600" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-center text-gray-500 py-4">No tienes novedades.</p>
                    )}
                </div>
                
                <div className="flex justify-end pt-6">
                    <button type="button" onClick={handleClose} className="py-2 px-6 bg-blue-600 text-white rounded-md hover:bg-blue-700">Entendido</button>
                </div>
            </div>
        </div>
    );
};

export default NewsModal;