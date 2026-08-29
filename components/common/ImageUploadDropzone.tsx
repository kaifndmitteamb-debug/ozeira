'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, Check, Loader2, Image as ImageIcon } from 'lucide-react';
import { uploadImageToBucket, StorageBucket } from '@/lib/supabase/storage';
import { cn } from '@/lib/utils';

interface ImageUploadDropzoneProps {
  bucket: StorageBucket;
  folder?: string;
  currentImageUrl?: string;
  onImageUploaded: (url: string) => void;
  onImageRemoved?: () => void;
  className?: string;
  label?: string;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'wide';
}

export function ImageUploadDropzone({
  bucket,
  folder = 'uploads',
  currentImageUrl,
  onImageUploaded,
  onImageRemoved,
  className,
  label = 'Upload Image',
  aspectRatio = 'square',
}: ImageUploadDropzoneProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(currentImageUrl);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPEG, PNG, WebP, AVIF).');
      return;
    }

    setErrorMsg(null);
    setIsUploading(true);

    // Instant local preview
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    try {
      const res = await uploadImageToBucket(file, { bucket, folder });
      if (res.success && res.url) {
        setPreviewUrl(res.url);
        onImageUploaded(res.url);
      } else {
        setErrorMsg(res.error || 'Failed to upload image.');
        setPreviewUrl(currentImageUrl);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Upload error');
      setPreviewUrl(currentImageUrl);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onImageRemoved?.();
  };

  const aspectClass = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    wide: 'aspect-[21/9]',
  }[aspectRatio];

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">{label}</label>}

      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          'relative w-full rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center p-4 group',
          dragOver ? 'border-[#c46331] bg-[#c46331]/5' : 'border-stone-200 hover:border-stone-400 bg-stone-50/50',
          aspectClass
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
            }
          }}
        />

        {previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt="Preview"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <span className="px-3 py-1.5 bg-white/90 text-stone-900 text-xs font-medium rounded-full shadow-xs">
                Replace
              </span>
              {onImageRemoved && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors shadow-xs"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="text-center p-4 space-y-2">
            <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-500 group-hover:text-[#c46331] group-hover:bg-[#c46331]/10 transition-colors">
              <Upload size={18} />
            </div>
            <div>
              <p className="text-xs font-semibold text-stone-800">
                Click or drag & drop image
              </p>
              <p className="text-[10px] text-stone-400 mt-0.5">
                PNG, JPG, WebP up to 10MB
              </p>
            </div>
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-2 z-20">
            <Loader2 size={24} className="animate-spin text-[#f5d480]" />
            <span className="text-xs font-medium tracking-wide">Uploading to Supabase CDN...</span>
          </div>
        )}
      </div>

      {errorMsg && (
        <p className="text-xs text-red-600 mt-1">{errorMsg}</p>
      )}
    </div>
  );
}
