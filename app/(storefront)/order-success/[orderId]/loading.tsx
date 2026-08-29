import React from 'react';
import { Sparkles } from 'lucide-react';

export default function OrderSuccessLoading() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-20 text-center animate-fade-in">
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-full border-4 border-amber-200/50 dark:border-amber-900/30 border-t-[#c46331] animate-spin flex items-center justify-center shadow-luxury-lg"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="w-7 h-7 text-[#c46331] animate-pulse" />
        </div>
      </div>
      <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 mb-2 tracking-tight">
        Preparing Your Receipt...
      </h2>
      <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto leading-relaxed">
        Fetching your confirmed order details and live tracking timeline from Ozeira Vault.
      </p>
    </div>
  );
}
