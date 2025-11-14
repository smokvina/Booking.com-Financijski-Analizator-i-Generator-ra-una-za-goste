import React, { useState, useCallback } from 'react';
import { Reservation } from './types';
import { extractDataFromFile, generateFinancialAnalysis } from './services/geminiService';
import { generateInvoicesZip } from './services/invoiceService';
import { ImageUploader } from './components/ImageUploader';
import { AnalysisReport } from './components/AnalysisReport';
import { Spinner } from './components/Spinner';

const App: React.FC = () => {
    const [files, setFiles] = useState<File[] | null>(null);
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isDownloading, setIsDownloading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState<string | null>(null);

    const handleFileChange = (selectedFiles: FileList | null) => {
        if (selectedFiles && selectedFiles.length > 0) {
            const validFiles = Array.from(selectedFiles).filter(file => {
                const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
                return (
                    file.type.startsWith('image/') ||
                    file.type === 'application/pdf' ||
                    file.type === 'text/csv' ||
                    file.type === 'application/vnd.ms-excel' ||
                    file.type === 'text/plain' ||
                    ['.csv', '.xls', '.txt'].includes(extension)
                );
            });
            
            if (validFiles.length !== selectedFiles.length) {
                 setError('Neke datoteke su nepodržanog formata. Prihvaćaju se slike, PDF, CSV, XLS i TXT datoteke.');
            } else {
                 setError(null);
            }
            
            setFiles(validFiles);
            setAnalysisResult(null);
            setReservations([]);
        } else {
            setFiles(null);
        }
    };

    const handleAnalyzeClick = useCallback(async () => {
        if (!files || files.length === 0) {
            setError('Molimo odaberite datoteke za analizu.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);
        setReservations([]);
        
        try {
            let completedCount = 0;
            const totalCount = files.length;
            setProgress(`Obrađujem datoteke... (0/${totalCount})`);
            
            const processingPromises = files.map(file => {
                return new Promise<{ base64: string, mimeType: string }>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve({ base64: (reader.result as string).split(',')[1], mimeType: file.type });
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                })
                .then(fileData => extractDataFromFile(fileData.base64, fileData.mimeType))
                .then(extractedData => {
                     completedCount++;
                     setProgress(`Obrađujem datoteke... (${completedCount}/${totalCount})`);
                     return { status: 'fulfilled' as const, value: extractedData, fileName: file.name };
                })
                .catch(error => {
                    completedCount++;
                    setProgress(`Obrađujem datoteke... (${completedCount}/${totalCount})`);
                    console.error(`Greška pri obradi datoteke ${file.name}:`, error);
                    return { status: 'rejected' as const, reason: error, fileName: file.name };
                });
            });

            const results = await Promise.all(processingPromises);

            const allReservations: Reservation[] = [];
            const failedFiles: string[] = [];

            results.forEach(result => {
                if (result.status === 'fulfilled') {
                    if (result.value && result.value.length > 0) {
                        allReservations.push(...result.value);
                    } else {
                        // File processed, but no data found is considered a failure for this file
                        failedFiles.push(result.fileName);
                    }
                } else {
                    failedFiles.push(result.fileName);
                }
            });
            
            if (allReservations.length === 0) {
                let errorMessage = "Nije moguće izdvojiti podatke iz priloženih datoteka. Provjerite jesu li ispravnog formata i sadržaja.";
                if (failedFiles.length > 0) {
                    errorMessage = `Obrada nije uspjela ni za jednu datoteku. Greške su se dogodile kod datoteka: ${failedFiles.join(', ')}.`;
                }
                throw new Error(errorMessage);
            }

            setReservations(allReservations);

            if (failedFiles.length > 0) {
                setError(`Uspješno su obrađeni podaci iz ${totalCount - failedFiles.length} od ${totalCount} datoteka. Obrada nije uspjela za: ${failedFiles.join(', ')}.`);
            }

            setProgress('Generiram financijsku analizu...');
            const report = await generateFinancialAnalysis(allReservations);
            setAnalysisResult(report);

        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : 'Došlo je do nepoznate pogreške.';
            setError(`Greška pri analizi: ${errorMessage}`);
        } finally {
            setIsLoading(false);
            setProgress(null);
        }
    }, [files]);

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
                    Booking.com Financijski Analizator i Generator računa za goste
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
                        files={files}
                    />

                    {error && (
                        <div className="mt-4 bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center">
                            {error}
                        </div>
                    )}

                    <div className="mt-6 text-center">
                        <button
                            onClick={handleAnalyzeClick}
                            disabled={!files || files.length === 0 || isLoading}
                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500/50 flex items-center justify-center mx-auto"
                        >
                            {isLoading ? <Spinner /> : 'Analiziraj Sada'}
                        </button>
                    </div>

                    {isLoading && (
                       <div className="text-center mt-6 text-gray-400">
                           <p>{progress || 'Analiziram podatke... Ovo može potrajati trenutak.'}</p>
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