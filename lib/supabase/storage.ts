import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export type StorageBucket = 
  | 'ozeira-products'
  | 'ozeira-banners'
  | 'ozeira-categories'
  | 'ozeira-avatars'
  | 'ozeira-reviews';

interface UploadImageOptions {
  bucket: StorageBucket;
  folder?: string;
  maxSizeBytes?: number;
  fileName?: string;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

/**
 * Uploads an image file to Supabase Storage bucket and returns its high-speed CDN public URL.
 */
export async function uploadImageToBucket(
  file: File | Blob,
  options: UploadImageOptions
): Promise<UploadResult> {
  const { bucket, folder = 'uploads', maxSizeBytes = 10 * 1024 * 1024 } = options;

  // Size validation
  if (file.size > maxSizeBytes) {
    return {
      success: false,
      error: `File size exceeds the ${Math.round(maxSizeBytes / (1024 * 1024))}MB limit.`,
    };
  }

  // Generate unique clean filename
  const extension = file.type.split('/')[1] || 'jpg';
  const cleanName = options.fileName 
    ? `${options.fileName.replace(/[^a-zA-Z0-9_-]/g, '')}-${Date.now()}.${extension}`
    : `img-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${extension}`;
  
  const filePath = folder ? `${folder}/${cleanName}` : cleanName;

  // Fallback to Base64 data URL if Supabase is offline
  if (!isSupabaseConfigured) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          success: true,
          url: reader.result as string,
          path: filePath,
        });
      };
      reader.onerror = () => {
        resolve({
          success: false,
          error: 'Failed to read image file locally.',
        });
      };
      reader.readAsDataURL(file);
    });
  }

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '31536000', // 1-year browser CDN cache for ultra-fast loading
        upsert: true,
        contentType: file.type || 'image/jpeg',
      });

    if (error) {
      console.error('Supabase storage upload error:', error);
      return { success: false, error: error.message };
    }

    // Retrieve public CDN URL
    const { data: publicData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      success: true,
      url: publicData.publicUrl,
      path: data.path,
    };
  } catch (err: any) {
    console.error('Storage upload exception:', err);
    return {
      success: false,
      error: err.message || 'An unexpected error occurred during upload.',
    };
  }
}

/**
 * Deletes an image from a Supabase Storage bucket by its path.
 */
export async function deleteImageFromBucket(
  bucket: StorageBucket,
  paths: string[]
): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  try {
    const { error } = await supabase.storage.from(bucket).remove(paths);
    return !error;
  } catch (err) {
    console.error('Error deleting from storage:', err);
    return false;
  }
}

/**
 * Returns optimized image URL with CDN query transforms (Next.js & Supabase CDN compatible)
 */
export function getOptimizedImageUrl(
  url: string,
  options?: { width?: number; height?: number; quality?: number; format?: 'webp' | 'avif' }
): string {
  if (!url) return '/placeholder.png';
  
  // If it's a Supabase storage URL, apply image transform params if enabled
  if (url.includes('supabase.co/storage/v1/object/public')) {
    const { width, height, quality = 80 } = options || {};
    const params = new URLSearchParams();
    if (width) params.set('width', width.toString());
    if (height) params.set('height', height.toString());
    params.set('quality', quality.toString());
    // return url with query parameters
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${params.toString()}`;
  }

  // If it's Unsplash, add fast CDN params (w, q, auto=format,fit=crop)
  if (url.includes('images.unsplash.com')) {
    const { width = 1000, quality = 80 } = options || {};
    const base = url.split('?')[0];
    return `${base}?q=${quality}&w=${width}&auto=format&fit=crop`;
  }

  return url;
}
