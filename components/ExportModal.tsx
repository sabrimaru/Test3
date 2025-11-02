
import React, { useState } from 'react';
import { useSafeContext } from '../App';
import { Booking, BookingStatus, Vacation } from '../types';
import { XCircleIcon } from './Icons';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type ReportType = 'bookings' | 'vacations';
type ExportFormat = 'pdf' | 'xls';

const calculateHours = (startTime: string, endTime: string): number => {
    const start = new Date(`1970-01-01T${startTime}:00`);
    let end = new Date(`1970-01-01T${endTime}:00`);
    if (end < start) {
        end.setDate(end.getDate() + 1);
    }
    const diffMs = end.getTime() - start.getTime();
    return diffMs / (1000 * 60 * 60);
};

const calculateDays = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
    const { bookings, users, vacations } = useSafeContext();
    const today = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [reportType, setReportType] = useState<ReportType>('bookings');
    const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf');
    const [error, setError] = useState('');

    if (!isOpen) return null;
    
    const handleExport = () => {
        setError('');
        if (new Date(startDate) > new Date(endDate)) {
            setError('La fecha de inicio no puede ser posterior a la fecha de finalización.');
            return;
        }

        const start = new Date(startDate + 'T00:00:00');
        const end = new Date(endDate + 'T23:59:59');

        if (exportFormat === 'pdf') {
            generatePdf(start, end);
        } else {
            generateXls(start, end);
        }
        onClose();
    };

    const generatePdf = (start: Date, end: Date) => {
        let reportContent = '';
        if (reportType === 'bookings') {
            reportContent = generateBookingsReportHtml(start, end);
        } else {
            reportContent = generateVacationsReportHtml(start, end);
        }
        
        const reportHtml = `
            <html><head><title>Reporte</title><style>
                body { font-family: sans-serif; margin: 2rem; }
                h1 { text-align: center; color: #333; }
                .person-section { margin-bottom: 2rem; page-break-inside: avoid; }
                h2 { color: #555; border-bottom: 2px solid #eee; padding-bottom: 5px; }
                table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                tr:nth-child(even) { background-color: #f9f9f9; }
                .total-row { font-weight: bold; background-color: #e8e8e8; }
            </style></head><body>${reportContent}</body></html>
        `;

        const reportWindow = window.open('', '_blank');
        reportWindow?.document.write(reportHtml);
        reportWindow?.document.close();
        reportWindow?.print();
    };
    
    const generateXls = (start: Date, end: Date) => {
        let reportHtml = '';
        let fileName = '';

        if (reportType === 'bookings') {
            fileName = `reporte_turnos_${startDate}_a_${endDate}.xls`;
            reportHtml = generateBookingsReportHtml(start, end);
        } else {
            fileName = `reporte_vacaciones_${startDate}_a_${endDate}.xls`;
            reportHtml = generateVacationsReportHtml(start, end);
        }
        
        const template = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Reporte</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
                <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
                <style>
                    table { border-collapse: collapse; }
                    th, td { border: 1px solid black; padding: 8px; }
                    th { background-color: #f2f2f2; font-weight: bold; }
                    .total-row td { font-weight: bold; background-color: #e8e8e8; }
                </style>
            </head>
            <body>${reportHtml}</body>
            </html>
        `;

        const base64 = (s: string) => window.btoa(unescape(encodeURIComponent(s)));
        const uri = 'data:application/vnd.ms-excel;base64,';
        const link = document.createElement("a");
        link.href = uri + base64(template);
        link.download = fileName;
        link.click();
    };

    const generateBookingsReportHtml = (start: Date, end: Date) => {
        const filteredBookings = bookings.filter(b => {
            const bookingDate = new Date(b.date + 'T00:00:00');
            return b.status === BookingStatus.APPROVED && bookingDate >= start && bookingDate <= end;
        });

        const groupedByUser = filteredBookings.reduce((acc, booking) => {
            (acc[booking.userId] = acc[booking.userId] || []).push(booking);
            return acc;
        }, {} as Record<string, Booking[]>);
        
        let reportHtml = `<h1>Reporte de Turnos (${start.toLocaleDateString()} - ${end.toLocaleDateString()})</h1>`;

        Object.keys(groupedByUser).forEach(userId => {
            const user = users.find(u => u.id === userId);
            if (!user) return;

            const userBookings = groupedByUser[userId].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            let totalHours = 0;

            reportHtml += `<div class="person-section"><h2>${user.firstName} ${user.lastName}</h2><table><thead><tr><th>Día</th><th>Horario</th><th>Cant. Horas</th><th>Observaciones</th></tr></thead><tbody>`;
            userBookings.forEach(booking => {
                const hours = calculateHours(booking.startTime, booking.endTime);
                totalHours += hours;
                const bookingDate = new Date(booking.date + 'T00:00:00');
                const dayString = bookingDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' });
                reportHtml += `<tr><td>${dayString}</td><td>${booking.startTime} - ${booking.endTime}</td><td>${hours.toFixed(2)}</td><td>${booking.notes || ''}</td></tr>`;
            });
            reportHtml += `<tr class="total-row"><td colspan="2"><strong>Total: ${userBookings.length} Turnos</strong></td><td><strong>${totalHours.toFixed(2)} Horas</strong></td><td></td></tr></tbody></table></div>`;
        });
        return reportHtml;
    };
    
    const generateVacationsReportHtml = (start: Date, end: Date) => {
        const filteredVacations = vacations.filter(v => {
            const vacStart = new Date(v.startDate + 'T00:00:00');
            const vacEnd = new Date(v.endDate + 'T23:59:59');
            return vacStart <= end && vacEnd >= start;
        });

        const groupedByUser = filteredVacations.reduce((acc, vacation) => {
            (acc[vacation.userId] = acc[vacation.userId] || []).push(vacation);
            return acc;
        }, {} as Record<string, Vacation[]>);
        
        let reportHtml = `<h1>Reporte de Vacaciones (${start.toLocaleDateString()} - ${end.toLocaleDateString()})</h1>`;

        Object.keys(groupedByUser).forEach(userId => {
            const user = users.find(u => u.id === userId);
            if (!user) return;

            const userVacations = groupedByUser[userId].sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
            let totalDays = 0;

            reportHtml += `<div class="person-section"><h2>${user.firstName} ${user.lastName}</h2><table><thead><tr><th>Período</th><th>Total Días</th><th>Estado</th></tr></thead><tbody>`;
            userVacations.forEach(vacation => {
                const days = calculateDays(vacation.startDate, vacation.endDate);
                if(vacation.status === 'Aprobado') totalDays += days;
                const startStr = new Date(vacation.startDate + 'T00:00:00').toLocaleDateString();
                const endStr = new Date(vacation.endDate + 'T00:00:00').toLocaleDateString();
                reportHtml += `<tr><td>${startStr} - ${endStr}</td><td>${days}</td><td>${vacation.status}</td></tr>`;
            });
            reportHtml += `<tr class="total-row"><td><strong>Total</strong></td><td><strong>${userVacations.length} Solicitudes</strong></td><td><strong>${totalDays} Días Aprobados</strong></td></tr></tbody></table></div>`;
        });
        return reportHtml;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative animate-fade-in-down">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-800">
                    <XCircleIcon className="h-7 w-7"/>
                </button>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Exportar Reporte</h2>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">1. Tipo de Reporte</label>
                         <div className="flex rounded-md shadow-sm">
                            <button type="button" onClick={() => setReportType('bookings')} className={`flex-1 p-2 rounded-l-md transition-colors ${reportType === 'bookings' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}>Turnos</button>
                            <button type="button" onClick={() => setReportType('vacations')} className={`flex-1 p-2 rounded-r-md transition-colors ${reportType === 'vacations' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}>Vacaciones</button>
                        </div>
                    </div>
                    
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">2. Rango de Fechas</label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                            </div>
                            <div>
                                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} required className="w-full p-2 border border-gray-300 rounded-md shadow-sm" />
                            </div>
                        </div>
                    </div>

                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">3. Formato</label>
                         <div className="flex rounded-md shadow-sm">
                            <button type="button" onClick={() => setExportFormat('pdf')} className={`flex-1 p-2 rounded-l-md transition-colors ${exportFormat === 'pdf' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}>PDF</button>
                            <button type="button" onClick={() => setExportFormat('xls')} className={`flex-1 p-2 rounded-r-md transition-colors ${exportFormat === 'xls' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}>Excel</button>
                        </div>
                    </div>
                    
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    
                    <div className="flex justify-end pt-4">
                        <button type="button" onClick={onClose} className="mr-3 py-2 px-4 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">Cancelar</button>
                        <button type="button" onClick={handleExport} className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700">Generar y Exportar</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExportModal;
