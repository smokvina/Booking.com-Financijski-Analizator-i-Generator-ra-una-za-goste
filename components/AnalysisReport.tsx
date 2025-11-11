
import React, { useEffect, useMemo } from 'react';
import { Spinner } from './Spinner';

interface AnalysisReportProps {
    analysisResult: string;
    onDownloadZip: () => void;
    isDownloading: boolean;
}

declare global {
    interface Window {
        marked: {
            parse(markdown: string): string;
        };
    }
}

export const AnalysisReport: React.FC<AnalysisReportProps> = ({ analysisResult, onDownloadZip, isDownloading }) => {
    
    const reportHtml = useMemo(() => {
        if (analysisResult && window.marked) {
            return window.marked.parse(analysisResult);
        }
        return '';
    }, [analysisResult]);

    return (
        <div className="mt-8 pt-6 border-t border-gray-700">
            <h2 className="text-2xl font-bold mb-4 text-center text-teal-300">Generirana Financijska Analiza</h2>
            
            <div 
                className="prose prose-invert max-w-none bg-gray-900/50 p-6 rounded-lg border border-gray-700"
                dangerouslySetInnerHTML={{ __html: reportHtml }}
            />

            <div className="mt-8 text-center">
                <button
                    onClick={onDownloadZip}
                    disabled={isDownloading}
                    className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-teal-500/50 flex items-center justify-center mx-auto"
                >
                    {isDownloading ? <Spinner /> : 'Preuzmi Račune (ZIP)'}
                </button>
            </div>
        </div>
    );
};
