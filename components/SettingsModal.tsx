
import React, { useState } from 'react';
import { User, Role, Shift } from '../types';
import { useSafeContext } from '../App';
import { XCircleIcon, ClockIcon, UserGroupIcon, ChipIcon } from './Icons';
import { TIME_OPTIONS } from '../constants';

// --- User Form Component ---
interface UserFormData {
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: Role;
    vacationApproverId: string;
}

interface UserFormProps {
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    editingUser: User | null;
    formData: UserFormData;
    setFormData: React.Dispatch<React.SetStateAction<UserFormData>>;
    formError: string;
}

const UserForm: React.FC<UserFormProps> = ({
    onClose,
    onSubmit,
    editingUser,
    formData,
    setFormData,
    formError
}) => {
    const { users } = useSafeContext();
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative animate-fade-in-down">
                 <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-800">
                    <XCircleIcon className="h-7 w-7"/>
                </button>
                <h3 className="text-xl font-bold mb-4">{editingUser ? 'Editar' : 'Agregar'} Usuario</h3>
                <form onSubmit={onSubmit} className="space-y-3">
                    <input type="text" name="username" placeholder="Nombre de usuario" value={formData.username} onChange={handleChange} required className="w-full p-2 border rounded" />
                    <input type="text" name="firstName" placeholder="Nombre" value={formData.firstName} onChange={handleChange} required className="w-full p-2 border rounded" />
                    <input type="text" name="lastName" placeholder="Apellido" value={formData.lastName} onChange={handleChange} required className="w-full p-2 border rounded" />
                    <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required className="w-full p-2 border rounded" />
                    <input type="password" name="password" placeholder={editingUser ? 'Nueva Contraseña (dejar en blanco para no cambiar)' : 'Contraseña'} value={formData.password} onChange={handleChange} className="w-full p-2 border rounded" />
                    <select name="role" value={formData.role} onChange={handleChange} required className="w-full p-2 border rounded">
                        {Object.values(Role).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Aprobador de Vacaciones</label>
                        <select name="vacationApproverId" value={formData.vacationApproverId} onChange={handleChange} required className="w-full p-2 border rounded">
                            <option value="self">Auto-aprobado</option>
                            {users
                                .filter(u => u.id !== editingUser?.id)
                                .map(u => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)
                            }
                        </select>
                    </div>
                    {formError && <p className="text-red-500 text-sm">{formError}</p>}
                    <div className="flex justify-end pt-2">
                        <button type="button" onClick={onClose} className="mr-2 py-2 px-4 bg-gray-200 rounded">Cancelar</button>
                        <button type="submit" className="py-2 px-4 bg-blue-600 text-white rounded">{editingUser ? 'Guardar' : 'Crear'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Shift Form Component ---
interface ShiftFormData {
    name: string;
    startTime: string;
    endTime: string;
}

interface ShiftFormProps {
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    editingShift: Shift | null;
    formData: ShiftFormData;
    setFormData: React.Dispatch<React.SetStateAction<ShiftFormData>>;
    formError: string;
}

const ShiftForm: React.FC<ShiftFormProps> = ({
    onClose,
    onSubmit,
    editingShift,
    formData,
    setFormData,
    formError
}) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative animate-fade-in-down">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-800">
                    <XCircleIcon className="h-7 w-7"/>
                </button>
                <h3 className="text-xl font-bold mb-4">{editingShift ? 'Editar' : 'Agregar'} Turno</h3>
                <form onSubmit={onSubmit} className="space-y-3">
                    <input type="text" name="name" placeholder="Nombre del Turno" value={formData.name} onChange={handleChange} required className="w-full p-2 border rounded" />
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                            <select name="startTime" value={formData.startTime} onChange={handleChange} className="w-full p-2 border rounded">
                                {TIME_OPTIONS.map(time => <option key={`start-${time}`} value={time}>{time}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                            <select name="endTime" value={formData.endTime} onChange={handleChange} className="w-full p-2 border rounded">
                                {TIME_OPTIONS.map(time => <option key={`end-${time}`} value={time}>{time}</option>)}
                            </select>
                        </div>
                    </div>
                    {formError && <p className="text-red-500 text-sm">{formError}</p>}
                    <div className="flex justify-end pt-2">
                        <button type="button" onClick={onClose} className="mr-2 py-2 px-4 bg-gray-200 rounded">Cancelar</button>
                        <button type="submit" className="py-2 px-4 bg-blue-600 text-white rounded">{editingShift ? 'Guardar' : 'Crear'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Settings Modal Component ---
interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenEmailSummary: () => void;
}

const INITIAL_USER_FORM_STATE: UserFormData = { username: '', firstName: '', lastName: '', email: '', password: '', role: Role.MATEHOST, vacationApproverId: 'self' };
const INITIAL_SHIFT_FORM_STATE: ShiftFormData = { name: '', startTime: '08:00', endTime: '16:00' };

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onOpenEmailSummary }) => {
    const { users, addUser, updateUser, deleteUser, currentUser, shifts, addShift, updateShift, deleteShift } = useSafeContext();
    const [activeTab, setActiveTab] = useState('users');
    const [formError, setFormError] = useState('');

    // User Form State
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [isUserFormOpen, setIsUserFormOpen] = useState(false);
    const [userFormData, setUserFormData] = useState<UserFormData>(INITIAL_USER_FORM_STATE);
    
    // Shift Form State
    const [editingShift, setEditingShift] = useState<Shift | null>(null);
    const [isShiftFormOpen, setIsShiftFormOpen] = useState(false);
    const [shiftFormData, setShiftFormData] = useState<ShiftFormData>(INITIAL_SHIFT_FORM_STATE);

    if (!isOpen) return null;

    // --- User Management ---
    const openNewUserForm = () => {
        setEditingUser(null);
        setUserFormData(INITIAL_USER_FORM_STATE);
        setFormError('');
        setIsUserFormOpen(true);
    };

    const openEditUserForm = (user: User) => {
        setEditingUser(user);
        setUserFormData({ 
            username: user.username, 
            firstName: user.firstName, 
            lastName: user.lastName, 
            email: user.email, 
            password: '', 
            role: user.role,
            vacationApproverId: user.vacationApproverId || 'self'
        });
        setFormError('');
        setIsUserFormOpen(true);
    };

    const handleUserFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        const { password } = userFormData;

        try {
            if (editingUser) {
                if(password && password.length < 4){ throw new Error('La contraseña debe tener al menos 4 caracteres.'); }
                const updatedUserData: Partial<User> & { vacationApproverId?: string } = { ...userFormData };
                if(!password) delete updatedUserData.password;
                
                // Handle self-approval case for existing user
                if (updatedUserData.vacationApproverId === 'self') {
                    updatedUserData.vacationApproverId = editingUser.id;
                }
                updateUser({ ...editingUser, ...updatedUserData });

            } else {
                if(!password || password.length < 4){ throw new Error('La contraseña es requerida y debe tener al menos 4 caracteres.'); }
                addUser(userFormData);
            }
            setIsUserFormOpen(false);
        } catch (err) {
            if (err instanceof Error) { setFormError(err.message); }
        }
    };

    const handleDeleteUser = (userId: string) => {
        if (window.confirm('¿Está seguro que desea eliminar este usuario?')) {
            if(userId === currentUser?.id) { alert("No puede eliminarse a sí mismo."); return; }
            deleteUser(userId);
        }
    };

    // --- Shift Management ---
    const openNewShiftForm = () => {
        setEditingShift(null);
        setShiftFormData(INITIAL_SHIFT_FORM_STATE);
        setFormError('');
        setIsShiftFormOpen(true);
    };

    const openEditShiftForm = (shift: Shift) => {
        setEditingShift(shift);
        setShiftFormData({ name: shift.name, startTime: shift.startTime, endTime: shift.endTime });
        setFormError('');
        setIsShiftFormOpen(true);
    };
    
    const handleShiftFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        const { name, startTime, endTime } = shiftFormData;
        
        try {
            if (!name) throw new Error("El nombre del turno no puede estar vacío.");
            if (startTime >= endTime && endTime !== '00:00') throw new Error("La hora de inicio debe ser anterior a la hora de fin.");

            if (editingShift) {
                updateShift({ ...editingShift, ...shiftFormData });
            } else {
                addShift(shiftFormData);
            }
            setIsShiftFormOpen(false);
        } catch (err) {
            if (err instanceof Error) { setFormError(err.message); }
        }
    };

    const handleDeleteShift = (shiftId: string) => {
        if (window.confirm('¿Está seguro que desea eliminar este turno?')) {
            deleteShift(shiftId);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-40 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800">
                    <XCircleIcon className="h-8 w-8"/>
                </button>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Ajustes</h2>
                <div className="flex border-b">
                    <button onClick={() => setActiveTab('users')} className={`py-2 px-4 text-lg font-medium flex items-center ${activeTab === 'users' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>
                       <UserGroupIcon className="h-5 w-5 mr-2" /> Gestionar Usuarios
                    </button>
                    <button onClick={() => setActiveTab('shifts')} className={`py-2 px-4 text-lg font-medium flex items-center ${activeTab === 'shifts' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>
                        <ClockIcon className="h-5 w-5 mr-2" /> Gestionar Turnos
                    </button>
                     {currentUser?.role === Role.ADMINISTRADOR && (
                        <button onClick={() => setActiveTab('system')} className={`py-2 px-4 text-lg font-medium flex items-center ${activeTab === 'system' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>
                            <ChipIcon className="h-5 w-5 mr-2" /> Sistema
                        </button>
                    )}
                </div>

                <div className="flex-grow overflow-y-auto mt-4">
                    {activeTab === 'users' && (
                        <div>
                            <div className="flex justify-end mb-4">
                                <button onClick={openNewUserForm} className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700">Agregar Usuario</button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full bg-white">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="text-left py-3 px-4 font-semibold text-sm">Nombre</th><th className="text-left py-3 px-4 font-semibold text-sm">Usuario</th><th className="text-left py-3 px-4 font-semibold text-sm">Rol</th><th className="text-left py-3 px-4 font-semibold text-sm">Aprobador Vacaciones</th><th className="text-left py-3 px-4 font-semibold text-sm">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(user => {
                                            const approver = users.find(u => u.id === user.vacationApproverId);
                                            const approverName = user.id === user.vacationApproverId ? 'Auto-aprobado' : approver ? `${approver.firstName} ${approver.lastName}` : 'Superior';
                                            return (
                                                <tr key={user.id} className="border-b">
                                                    <td className="py-3 px-4">{user.firstName} {user.lastName}</td><td className="py-3 px-4">{user.username}</td><td className="py-3 px-4">{user.role}</td>
                                                    <td className="py-3 px-4">{approverName}</td>
                                                    <td className="py-3 px-4 space-x-2">
                                                        <button onClick={() => openEditUserForm(user)} className="text-blue-600 hover:underline text-sm">Editar</button>
                                                        <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:underline text-sm">Eliminar</button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    {activeTab === 'shifts' && (
                        <div>
                            <div className="flex justify-end mb-4">
                                <button onClick={openNewShiftForm} className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700">Agregar Turno</button>
                            </div>
                             <div className="overflow-x-auto">
                                <table className="min-w-full bg-white">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="text-left py-3 px-4 font-semibold text-sm">Nombre del Turno</th><th className="text-left py-3 px-4 font-semibold text-sm">Hora Inicio</th><th className="text-left py-3 px-4 font-semibold text-sm">Hora Fin</th><th className="text-left py-3 px-4 font-semibold text-sm">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {shifts.map(shift => (
                                            <tr key={shift.id} className="border-b">
                                                <td className="py-3 px-4">{shift.name}</td><td className="py-3 px-4">{shift.startTime}</td><td className="py-3 px-4">{shift.endTime}</td>
                                                <td className="py-3 px-4 space-x-2">
                                                    <button onClick={() => openEditShiftForm(shift)} className="text-blue-600 hover:underline text-sm">Editar</button>
                                                    <button onClick={() => handleDeleteShift(shift.id)} className="text-red-600 hover:underline text-sm">Eliminar</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    {activeTab === 'system' && (
                        <div className="p-4">
                            <h3 className="text-xl font-bold mb-4">Ajustes del Sistema</h3>
                            <p className="text-gray-600 mb-4">
                                Aquí puede realizar acciones administrativas a nivel de sistema.
                            </p>
                            <button 
                                onClick={onOpenEmailSummary} 
                                className="py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                            >
                                Simular Resumen Diario por Email
                            </button>
                            <p className="text-sm text-gray-500 mt-2">
                                Esto abrirá una vista previa del correo de resumen de novedades que se enviaría a las 22:00hs a cada usuario con notificaciones pendientes.
                            </p>
                        </div>
                    )}
                </div>
                {isUserFormOpen && <UserForm onClose={() => setIsUserFormOpen(false)} onSubmit={handleUserFormSubmit} editingUser={editingUser} formData={userFormData} setFormData={setUserFormData} formError={formError} />}
                {isShiftFormOpen && <ShiftForm onClose={() => setIsShiftFormOpen(false)} onSubmit={handleShiftFormSubmit} editingShift={editingShift} formData={shiftFormData} setFormData={setShiftFormData} formError={formError} />}
            </div>
        </div>
    );
};

export default SettingsModal;
