
import React from 'react';
import { useSafeContext } from '../App';
import { XCircleIcon, MailIcon } from './Icons';
import { User } from '../types';

interface EmailSummaryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const EmailSummaryModal: React.FC<EmailSummaryModalProps> = ({ isOpen, onClose }) => {
    const { users, notifications } = useSafeContext();

    if (!isOpen) return null;

    const usersWithNews = users.filter(user => 
        notifications.some(n => n.userId === user.id)
    );

    const generateEmailBody = (user: User) => {
        const userNews = notifications
            .filter(n => n.userId === user.id)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        if (userNews.length === 0) {
            return <p className="text-sm text-gray-500 italic">Sin novedades para este usuario.</p>;
        }

        return (
            <div className="text-sm">
                <p>Hola {user.firstName},</p>
                <p className="mt-2">Este es tu resumen de novedades:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                    {userNews.map(n => (
                        <li key={n.id}>
                            {n.message}
                            <span className="text-xs text-gray-400 ml-2">({new Date(n.createdAt).toLocaleTimeString('es-ES')})</span>
                        </li>
                    ))}
                </ul>
                <p className="mt-4">Saludos,</p>
                <p>El equipo de Matehost.</p>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6 relative animate-fade-in-down h-[90vh] flex flex-col">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-800">
                    <XCircleIcon className="h-7 w-7"/>
                </button>
                <div className="flex items-center mb-4 pb-4 border-b">
                    <MailIcon className="h-8 w-8 text-blue-600 mr-3" />
                    <h2 className="text-2xl font-bold text-gray-800">Simulación de Resumen Diario por Email</h2>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                    A continuación se muestra una vista previa del correo que recibiría cada usuario con novedades. En la vida real, esto se enviaría automáticamente a las 22:00.
                </p>
                <div className="flex-grow overflow-y-auto space-y-6 pr-2">
                    {usersWithNews.length > 0 ? usersWithNews.map(user => (
                        <div key={user.id} className="border rounded-lg">
                            <div className="bg-gray-50 p-3 rounded-t-lg border-b">
                                <p className="font-semibold text-gray-800">Para: {user.firstName} {user.lastName} &lt;{user.email}&gt;</p>
                            </div>
                            <div className="p-4 bg-white rounded-b-lg">
                                {generateEmailBody(user)}
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-10">
                            <p className="text-gray-500">No hay novedades para enviar a ningún usuario.</p>
                        </div>
                    )}
                </div>
                <div className="flex justify-end pt-6 border-t mt-4">
                    <button type="button" onClick={onClose} className="py-2 px-6 bg-blue-600 text-white rounded-md hover:bg-blue-700">Cerrar</button>
                </div>
            </div>
        </div>
    );
};

export default EmailSummaryModal;
