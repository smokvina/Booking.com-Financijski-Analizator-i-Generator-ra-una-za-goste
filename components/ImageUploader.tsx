
import React, { useRef, useState } from 'react';

interface ImageUploaderProps {
    onFileChange: (file: File | null) => void;
    previewUrl: string | null;
    fileName: string | null;
    fileType: 'image' | 'pdf' | null;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onFileChange, previewUrl, fileName, fileType }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            onFileChange(event.target.files[0]);
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
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onFileChange(e.dataTransfer.files[0]);
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
                accept="image/png, image/jpeg, image/webp, application/pdf"
                onChange={handleFileChange}
            />
            {fileType === 'image' && previewUrl ? (
                <div className="relative">
                    <img src={previewUrl} alt="Pregled" className="max-h-80 mx-auto rounded-md shadow-lg"/>
                     <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md">
                        <p className="text-white font-semibold">Promijeni datoteku</p>
                    </div>
                </div>
            ) : fileType === 'pdf' && fileName ? (
                 <div className="relative">
                    <div className="flex flex-col items-center justify-center text-gray-300 p-8 bg-gray-700/50 rounded-md">
                         <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mb-4 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V8.414a1 1 0 00-.293-.707l-4.414-4.414A1 1 0 0011.586 3H4zm3 8a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm0 4a1 1 0 100 2h8a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                        <p className="font-semibold text-white break-all">{fileName}</p>
                    </div>
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md">
                        <p className="text-white font-semibold">Promijeni datoteku</p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center text-gray-400">
                    <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                    <p className="font-semibold">
                        <span className="text-blue-400">Kliknite za prijenos</span> ili povucite datoteku
                    </p>
                    <p className="text-xs mt-1">PDF, PNG, JPG, WEBP (max. 10MB)</p>
                </div>
            )}
        </div>
    );
};
