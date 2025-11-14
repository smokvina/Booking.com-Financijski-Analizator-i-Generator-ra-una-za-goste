import React, { useRef, useState } from 'react';

interface ImageUploaderProps {
    onFileChange: (files: FileList | null) => void;
    files: File[] | null;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onFileChange, files }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            onFileChange(event.target.files);
        }
    };

    const handleClick = () => {
        inputRef.current?.click();
    };

    const handleDragEvents = (e: React.DragEvent<HTMLDivElement>, dragging: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(dragging);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        handleDragEvents(e, false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onFileChange(e.dataTransfer.files);
        }
    };
    
    return (
        <div 
            onClick={handleClick}
            onDragEnter={(e) => handleDragEvents(e, true)}
            onDragLeave={(e) => handleDragEvents(e, false)}
            onDragOver={(e) => handleDragEvents(e, true)}
            onDrop={handleDrop}
            className={`cursor-pointer group border-2 border-dashed rounded-lg p-6 text-center transition-all duration-300 ${isDragging ? 'border-blue-500 bg-gray-700/50' : 'border-gray-600 hover:border-blue-500 hover:bg-gray-700/30'}`}
        >
            <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept="image/png, image/jpeg, image/webp, application/pdf, .csv, .xls, .txt"
                onChange={handleFileChange}
                multiple
            />
            {files && files.length > 0 ? (
                <div className="text-left">
                    <h4 className="font-semibold text-white mb-2 text-center">Odabrane datoteke ({files.length}):</h4>
                    <ul className="list-disc list-inside max-h-48 overflow-y-auto bg-gray-700/50 p-3 rounded-md text-gray-300 text-sm space-y-1">
                        {files.map((file, index) => (
                            <li key={`${file.name}-${index}`} className="truncate">
                                {file.name}
                            </li>
                        ))}
                    </ul>
                    <p className="text-center text-blue-400 mt-4 text-xs font-semibold">KLIKNITE ZA ODABIR DRUGIH DATOTEKA</p>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center text-gray-400">
                    <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                    <p className="font-semibold">
                        <span className="text-blue-400">Kliknite za prijenos</span> ili povucite datoteke
                    </p>
                    <p className="text-xs mt-1">PDF, CSV, XLS, TXT, PNG, JPG</p>
                </div>
            )}
        </div>
    );
};