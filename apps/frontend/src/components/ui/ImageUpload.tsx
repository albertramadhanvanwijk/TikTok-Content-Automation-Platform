'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image, X, Loader2 } from 'lucide-react';
import { toast } from '@/store/toastStore';
import { apiClient } from '@/services/api';
import { API_ENDPOINTS } from '@/utils/constants';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  onRemove: () => void;
  label?: string;
  accept?: string;
  maxSizeMB?: number;
}

export default function ImageUpload({ 
  value, 
  onChange, 
  onRemove, 
  label = 'Image',
  accept = 'image/*',
  maxSizeMB = 10 
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error('File too large', `Maximum size is ${maxSizeMB}MB`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Invalid file type', 'Please upload an image file');
      return;
    }

    setUploading(true);
    setPreview(URL.createObjectURL(file));

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'carousels');

      const response = await apiClient.post<{ url: string }>(
        '/upload/image',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      if (response.data?.url) {
        onChange(response.data.url);
        toast.success('Image uploaded', 'Image ready to use');
      } else {
        // Fallback: use blob URL for local preview
        onChange(preview!);
        toast.info('Using local preview', 'Image will be uploaded on save');
      }
    } catch (err: any) {
      // Fallback to blob URL if upload fails
      onChange(preview!);
      toast.warning('Upload failed', 'Using local preview - image will be uploaded on save');
    } finally {
      setUploading(false);
    }
  }, [onChange, preview, maxSizeMB]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { [accept]: [] },
    maxFiles: 1,
    noClick: false,
    noKeyboard: false,
  });

  const handleRemove = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    onRemove();
    onChange('');
  };

  const handleUrlInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value.trim();
    if (url && (url.startsWith('http') || url.startsWith('data:'))) {
      onChange(url);
      setPreview(url);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-text-primary">
        {label} {value || preview ? <span className="text-primary ml-1">✓</span> : null}
      </label>

      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          isDragActive 
            ? 'border-primary bg-blue-50 dark:bg-blue-900/20' 
            : 'border-border hover:border-primary/50'
        }`}
        role="button"
        tabIndex={0}
      >
        <input {...getInputProps()} />
        
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="text-primary animate-spin" />
            <p className="text-text-secondary">Uploading...</p>
          </div>
        ) : value || preview ? (
          <div className="relative max-w-xs mx-auto">
            <img 
              src={preview || value} 
              alt="Preview" 
              className="w-full h-48 object-cover rounded-lg border border-border"
            />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleRemove(); }}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition shadow-lg"
              aria-label="Remove image"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
              <Upload size={32} className="text-text-tertiary" />
            </div>
            <div>
              <p className="font-medium text-text-primary">Drop image here or click to browse</p>
              <p className="text-sm text-text-tertiary">PNG, JPG, WebP up to {maxSizeMB}MB</p>
            </div>
          </div>
        )}
      </div>

      {/* URL Fallback */}
      <div className="pt-2 border-t border-border">
        <p className="text-xs text-text-tertiary mb-2">Or paste image URL:</p>
        <input
          type="url"
          value={value || ''}
          onChange={handleUrlInput}
          placeholder="https://example.com/image.jpg"
          className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
        />
      </div>
    </div>
  );
}