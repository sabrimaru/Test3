import React, { useState } from 'react';
import { Role } from '../types';
import { useSafeContext } from '../App';
import { CalendarIcon } from './Icons';

type View = 'login' | 'register' | 'forgot';

const LoginView: React.FC = () => {
    const { login, registerAdmin, users } = useSafeContext();
    const [view, setView] = useState<View>('login');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [loginUsername, setLoginUsername] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    const [regFirstName, setRegFirstName] = useState('');
    const [regLastName, setRegLastName] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regUsername, setRegUsername] = useState('');
    const [regPassword, setRegPassword] = useState('');
    
    const [forgotEmail, setForgotEmail] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const loggedIn = login(loginUsername, loginPassword);
        if (!loggedIn) {
            setError('Usuario o contraseña incorrectos.');
        }
    };

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            registerAdmin({
                firstName: regFirstName,
                lastName: regLastName,
                email: regEmail,
                username: regUsername,
                password: regPassword,
            });
            setSuccess(`¡Registro exitoso! Se ha enviado un correo de confirmación a ${regEmail}. Por favor, inicie sesión.`);
            // Simulate sending email
            console.log(`Email sent to ${regEmail} with registration details.`);
            setView('login');
        } catch (err) {
            if(err instanceof Error){
                 setError(err.message);
            } else {
                setError("An unknown error occurred.");
            }
        }
    };
    
    const handleForgotPassword = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        // Simulate sending password reset email
        console.log(`Password reset link sent to ${forgotEmail}`);
        alert(`Si existe una cuenta con el email ${forgotEmail}, se ha enviado un enlace para restablecer la contraseña.`);
        setSuccess(`Si existe una cuenta con el email ${forgotEmail}, se ha enviado un enlace para restablecer la contraseña.`);
        setView('login');
    };

    const hasAdmin = users.some(u => u.role === Role.ADMINISTRADOR);

    const renderForm = () => {
        switch (view) {
            case 'register':
                return (
                    <form onSubmit={handleRegister} className="space-y-4">
                        <h2 className="text-2xl font-bold text-center text-gray-700">Registrar Administrador</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" placeholder="Nombre" value={regFirstName} onChange={e => setRegFirstName(e.target.value)} required className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            <input type="text" placeholder="Apellido" value={regLastName} onChange={e => setRegLastName(e.target.value)} required className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <input type="email" placeholder="Email" value={regEmail} onChange={e => setRegEmail(e.target.value)} required className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <input type="text" placeholder="Nombre de usuario" value={regUsername} onChange={e => setRegUsername(e.target.value)} required className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <input type="password" placeholder="Contraseña" value={regPassword} onChange={e => setRegPassword(e.target.value)} required className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <button type="submit" className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300">Registrar</button>
                        <p className="text-center text-sm">
                            <a href="#" onClick={(e) => { e.preventDefault(); setView('login');}} className="text-blue-600 hover:underline">Volver a inicio de sesión</a>
                        </p>
                    </form>
                );
            case 'forgot':
                 return (
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                        <h2 className="text-2xl font-bold text-center text-gray-700">Olvidé mi contraseña</h2>
                         <p className="text-center text-sm text-gray-500">Ingrese su email para recibir un enlace de recuperación.</p>
                        <input type="email" placeholder="Email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <button type="submit" className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300">Enviar enlace</button>
                        <p className="text-center text-sm">
                            <a href="#" onClick={(e) => { e.preventDefault(); setView('login');}} className="text-blue-600 hover:underline">Volver a inicio de sesión</a>
                        </p>
                    </form>
                );
            case 'login':
            default:
                return (
                    <form onSubmit={handleLogin} className="space-y-4">
                        <h2 className="text-2xl font-bold text-center text-gray-700">Iniciar Sesión</h2>
                        <input type="text" placeholder="Nombre de usuario" value={loginUsername} onChange={e => setLoginUsername(e.target.value)} required className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <input type="password" placeholder="Contraseña" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} required className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <button type="submit" className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300">Entrar</button>
                        <div className="flex justify-between items-center text-sm">
                           {!hasAdmin ? (
                             <a href="#" onClick={(e) => { e.preventDefault(); setView('register'); }} className="text-blue-600 hover:underline">Registrar Admin</a>
                           ) : (
                             <span /> // Placeholder to keep forgot password link on the right
                           )}
                            <a href="#" onClick={(e) => { e.preventDefault(); setView('forgot'); }} className="text-blue-600 hover:underline">Olvidé mi contraseña</a>
                        </div>
                    </form>
                );
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md">
                <div className="flex justify-center items-center mb-6 text-center">
                    <div>
                        <CalendarIcon className="h-10 w-10 text-blue-600 mx-auto" />
                        <h1 className="mt-2 text-3xl font-bold text-gray-800">Matehost - agenda de turnos</h1>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-xl shadow-lg">
                    {error && <p className="mb-4 text-center text-red-600 bg-red-100 p-2 rounded-lg">{error}</p>}
                    {success && <p className="mb-4 text-center text-green-600 bg-green-100 p-2 rounded-lg">{success}</p>}
                    {renderForm()}
                </div>
            </div>
        </div>
    );
};

export default LoginView;