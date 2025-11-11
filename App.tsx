
import React, { useState, useCallback } from 'react';
import { Reservation } from './types';
import { extractDataFromFile, generateFinancialAnalysis } from './services/geminiService';
import { generateInvoicesZip } from './services/invoiceService';
import { ImageUploader } from './components/ImageUploader';
import { AnalysisReport } from './components/AnalysisReport';
import { Spinner } from './components/Spinner';

const App: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [fileBase64, setFileBase64] = useState<string | null>(null);
    const [fileType, setFileType] = useState<'image' | 'pdf' | null>(null);
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (selectedFile: File | null) => {
        if (selectedFile) {
            setFile(selectedFile);
            setError(null);
            setAnalysisResult(null);
            setReservations([]);

            if (selectedFile.type.startsWith('image/')) {
                setFileType('image');
            } else if (selectedFile.type === 'application/pdf') {
                setFileType('pdf');
            } else {
                setError('Nepodržani format datoteke. Molimo odaberite sliku ili PDF.');
                setFile(null);
                setFileType(null);
                setFileBase64(null);
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                setFileBase64(reader.result as string);
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleAnalyzeClick = useCallback(async () => {
        if (!file || !fileBase64) {
            setError('Molimo odaberite datoteku za analizu.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);
        setReservations([]);

        try {
            const extractedData = await extractDataFromFile(fileBase64.split(',')[1], file.type);
            if (!extractedData || extractedData.length === 0) {
                throw new Error("Nije moguće izdvojiti podatke iz datoteke. Pokušajte s jasnijom slikom ili dokumentom.");
            }
            setReservations(extractedData);

            const report = await generateFinancialAnalysis(extractedData);
            setAnalysisResult(report);

        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : 'Došlo je do nepoznate pogreške.';
            setError(`Greška pri analizi: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    }, [file, fileBase64]);

    const handleDownloadZip = useCallback(async () => {
        if (reservations.length === 0) {
            setError('Nema podataka o rezervacijama za generiranje računa.');
            return;
        }
        setIsDownloading(true);
        setError(null);
        try {
            await generateInvoicesZip(reservations);
        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : 'Došlo je do nepoznate pogreške.';
            setError(`Greška pri generiranju ZIP datoteke: ${errorMessage}`);
        } finally {
            setIsDownloading(false);
        }
    }, [reservations]);

    return (
        <div className="min-h-screen container mx-auto p-4 sm:p-6 lg:p-8">
            <header className="text-center mb-8">
                <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
                    Booking.com Financijski Analizator
                </h1>
                <p className="mt-2 text-md sm:text-lg text-gray-400">
                    Pokreće Gemini API za analizu i optimizaciju vašeg poslovanja.
                </p>
            </header>

            <main className="max-w-4xl mx-auto">
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-2xl p-6 border border-gray-700">
                    
                    <div className="bg-blue-900/30 border border-blue-700 text-blue-200 px-4 py-3 rounded-lg mb-6 flex items-start shadow-inner">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <h3 className="font-bold">Važna Uputa</h3>
                            <p className="text-sm mt-1">Za ispravnu analizu, molimo prenesite PDF dokument **"Tablica isplate"** koji možete preuzeti iz odjeljka **Financije → Izvodi** na vašem Booking.com ekstranetu.</p>
                        </div>
                    </div>

                    <ImageUploader 
                        onFileChange={handleFileChange}
                        previewUrl={fileBase64}
                        fileName={file?.name ?? null}
                        fileType={fileType}
                    />

                    {error && (
                        <div className="mt-4 bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center">
                            {error}
                        </div>
                    )}

                    <div className="mt-6 text-center">
                        <button
                            onClick={handleAnalyzeClick}
                            disabled={!file || isLoading}
                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500/50 flex items-center justify-center mx-auto"
                        >
                            {isLoading ? <Spinner /> : 'Analiziraj Sada'}
                        </button>
                    </div>

                    {isLoading && (
                       <div className="text-center mt-6 text-gray-400">
                           <p>Analiziram podatke... Ovo može potrajati trenutak.</p>
                       </div>
                    )}
                    
                    {analysisResult && reservations.length > 0 && !isLoading && (
                        <AnalysisReport 
                            analysisResult={analysisResult}
                            onDownloadZip={handleDownloadZip}
                            isDownloading={isDownloading}
                        />
                    )}
                </div>
            </main>

            <footer className="text-center mt-12 text-gray-500 text-sm">
                <p>
                    Created by AppsBYDenisOrlić - <a href="https://wa.me/38598667806" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-500 transition-colors">Kontaktirajte nas</a>
                </p>
            </footer>
        </div>
    );
};

export default App;
