import React from 'react';
import { useSafeContext } from '../App';
import { XCircleIcon, NewspaperIcon } from './Icons';

interface NotificationsHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const NotificationsHistoryModal: React.FC<NotificationsHistoryModalProps> = ({ isOpen, onClose }) => {
    const { currentUser, notifications } = useSafeContext();
    if (!isOpen || !currentUser) return null;

    const userNotifications = notifications
        .filter(n => n.userId === currentUser.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 relative animate-fade-in-down">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-800">
                    <XCircleIcon className="h-7 w-7"/>
                </button>
                <div className="flex items-center mb-6">
                    <NewspaperIcon className="h-8 w-8 text-blue-600 mr-3" />
                    <h2 className="text-2xl font-bold text-gray-800">Historial de Novedades</h2>
                </div>
                
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2 border-t pt-4">
                    {userNotifications.length > 0 ? (
                        userNotifications.map(notification => (
                            <div key={notification.id} className={`p-3 rounded-lg border ${notification.seen ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-200'}`}>
                                 <p className="text-sm text-gray-800">{notification.message}</p>
                                 <p className="text-xs text-gray-500 text-right mt-1">{new Date(notification.createdAt).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 py-4">No tienes novedades en tu historial.</p>
                    )}
                </div>
                
                <div className="flex justify-end pt-6">
                    <button type="button" onClick={onClose} className="py-2 px-6 bg-blue-600 text-white rounded-md hover:bg-blue-700">Cerrar</button>
                </div>
            </div>
        </div>
    );
};

export default NotificationsHistoryModal;
