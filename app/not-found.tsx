import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center bg-white dark:bg-[#0c0d10] text-neutral-900 dark:text-neutral-100 px-4 transition-colors">
      <h1 className="text-9xl font-serif text-brand-amber/20 dark:text-brand-amber/30 select-none">404</h1>
      <div className="text-center -mt-10 relative z-10">
        <h2 className="text-3xl font-serif text-neutral-900 dark:text-neutral-100 mb-3">Piece Not Found</h2>
        <p className="text-neutral-600 dark:text-neutral-400 max-w-md mx-auto mb-8 text-sm">
          The requested curation does not exist, has retired to the private archive, or is temporarily unavailable.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="/"
            className="w-full sm:w-auto bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 px-8 py-3 rounded-full uppercase tracking-wider text-xs font-semibold transition-all shadow-sm"
          >
            Return to Atelier
          </Link>
          <Link 
            href="/shop"
            className="w-full sm:w-auto bg-transparent border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 px-8 py-3 rounded-full uppercase tracking-wider text-xs font-semibold hover:border-brand-amber hover:text-brand-amber dark:hover:border-brand-amber dark:hover:text-brand-amber transition-colors"
          >
            Browse Collections
          </Link>
        </div>
      </div>
    </div>
  );
}
