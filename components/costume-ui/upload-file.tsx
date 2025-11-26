import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { Upload, X, FileText, Image, CheckCircle } from 'lucide-react';
import { toast } from 'sonner'

interface FileData {
  file: File;
  name: string;
  size: string;
  preview: string | null;
}

interface UploadFileProps {
  onFileChange?: (file: File | null) => void;
}

export default function UploadFile({ onFileChange }: UploadFileProps) {
  const [file, setFile] = useState<FileData | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files[0]) addFile(e.dataTransfer.files[0]);
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) addFile(e.target.files[0]);
  };

  const addFile = (newFile: File) => {
    // Validate file type (images and PDF only)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
    if (!validTypes.includes(newFile.type)) {
      toast.error('Invalid file type. Only JPG, PNG, GIF, and PDF files are allowed.');
      return;
    }

    // Validate file size (max 1MB = 1048576 bytes)
    const maxSize = 1 * 1024 * 1024; // 1MB in bytes
    if (newFile.size > maxSize) {
      toast.error('File size exceeds 1MB. Please choose a smaller file.');
      return;
    }

    const fileData = {
      file: newFile,
      name: newFile.name,
      size: (newFile.size / 1024).toFixed(2),
      preview: newFile.type.startsWith('image/') ? URL.createObjectURL(newFile) : null
    };
    setFile(fileData);
    onFileChange?.(newFile);
  };

  const removeFile = () => {
    setFile(null);
    onFileChange?.(null);
  };

  return (
    <div className="w-full">
      {!file ? (
        <div className={`transition-all duration-700 ease-out ${!file ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300 ease-out ${
              isDragging ? 'border-teal-500 bg-teal-50 scale-[1.02]' : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileInput}
              className="hidden"
            />
            <div className="flex flex-col items-center space-y-3">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ease-out ${
                isDragging ? 'bg-teal-100 scale-110' : 'bg-gray-200 scale-100'
              }`}>
                <Upload className={`w-8 h-8 transition-colors duration-300 ${isDragging ? 'text-teal-600' : 'text-gray-500'}`} />
              </div>
              <div>
                <p className="text-base font-medium text-gray-700">
                  {isDragging ? 'Drop file here' : 'Drop receipt here or click to browse'}
                </p>
                <p className="text-sm text-gray-500 mt-1">Supports JPG, PNG, GIF, PDF (Max 1MB)</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className={`transition-all duration-700 ease-out ${file ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div
            style={{ animation: 'slideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both' }}
            className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all duration-200"
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {file.preview ? (
                <img src={file.preview} alt={file.name} className="w-12 h-12 object-cover rounded border border-gray-200" />
              ) : (
                <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded border border-gray-200">
                  {file.file.type.startsWith('image/') ? <Image className="w-5 h-5 text-blue-500" /> : <FileText className="w-5 h-5 text-gray-500" />}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{file.size} KB</p>
              </div>
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            </div>
            <button
              onClick={removeFile}
              className="ml-3 p-1 hover:bg-gray-100 rounded transition-all duration-200 flex-shrink-0 group"
              aria-label="Remove file"
            >
              <X className="w-5 h-5 text-gray-500 group-hover:text-red-500 transition-colors duration-200" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}