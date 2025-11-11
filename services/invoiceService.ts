
import { Reservation } from '../types';

declare global {
    interface Window {
        jspdf: any;
        JSZip: any;
    }
}

const { jsPDF } = window.jspdf;
const JSZip = window.JSZip;

const parseDate = (dateStr: string): Date => {
    const parts = dateStr.split('.');
    // new Date(year, monthIndex, day)
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
};

const formatDateForPDF = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}.`;
};

export const generateInvoicesZip = async (reservations: Reservation[]): Promise<void> => {
    if (!JSZip) {
        throw new Error('JSZip library is not loaded.');
    }
    if (!jsPDF) {
        throw new Error('jsPDF library is not loaded.');
    }

    const zip = new JSZip();

    for (const reservation of reservations) {
        const doc = new jsPDF();

        // jsPDF uses a limited character set by default. Special Croatian characters might not render perfectly.
        // For full support, a custom font would be needed. This is a best-effort with standard fonts.
        doc.setFont('Helvetica', 'normal');

        // Header
        doc.setFontSize(10);
        doc.text('IZDAVATELJ RAČUNA:', 10, 20);
        doc.setFont('Helvetica', 'bold');
        doc.text('Blue Tree Rooms, Sandra Orlić', 10, 25);
        doc.setFont('Helvetica', 'normal');
        doc.text('Požeška 18, 21000 Split', 10, 30);

        // Invoice Title
        doc.setFontSize(18);
        doc.setFont('Helvetica', 'bold');
        doc.text(`RAČUN br. ${reservation.bookingNumber}`, 105, 50, { align: 'center' });

        // Guest Info
        doc.setFontSize(10);
        doc.setFont('Helvetica', 'normal');
        doc.text('PRIMATELJ RAČUNA:', 10, 70);
        doc.setFont('Helvetica', 'bold');
        doc.text(reservation.guestName, 10, 75);
        
        // Dates
        doc.setFontSize(10);
        doc.setFont('Helvetica', 'normal');
        doc.text(`Datum izdavanja: ${formatDateForPDF(parseDate(reservation.checkOutDate))}`, 140, 70);
        doc.text(`Datum usluge: ${reservation.checkInDate} - ${reservation.checkOutDate}`, 140, 75);

        // Table Header
        doc.setLineWidth(0.5);
        doc.line(10, 95, 200, 95); // Top border
        doc.setFont('Helvetica', 'bold');
        doc.text('Opis usluge', 15, 102);
        doc.text('Iznos', 185, 102, { align: 'right' });
        doc.line(10, 107, 200, 107); // Bottom border
        
        // Table Content
        doc.setFont('Helvetica', 'normal');
        doc.text('Usluga smještaja', 15, 114);
        doc.text(`${reservation.grossAmount.toFixed(2)} EUR`, 185, 114, { align: 'right' });
        doc.line(10, 120, 200, 120);

        // Total
        doc.setFontSize(12);
        doc.setFont('Helvetica', 'bold');
        doc.text('UKUPNO ZA PLATITI:', 130, 130);
        doc.text(`${reservation.grossAmount.toFixed(2)} EUR`, 185, 130, { align: 'right' });

        // Footer Notes
        doc.setFontSize(9);
        doc.setFont('Helvetica', 'normal');
        doc.text("Napomena: Iznajmljivač nije u sustavu PDV-a.", 10, 260);
        doc.text("Usluga smještaja rezervirana putem platforme Booking.com.", 10, 265);


        // Generate PDF as blob and add to zip
        const pdfBlob = doc.output('blob');
        const checkInDate = reservation.checkInDate.replace(/\./g, '');
        const guestName = reservation.guestName.replace(/\s/g, '');
        const fileName = `BlueTreeRooms_${checkInDate}_${guestName}.pdf`;
        zip.file(fileName, pdfBlob);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(zipBlob);
    link.download = 'Racuni_BlueTreeRooms_Listopad2025.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
