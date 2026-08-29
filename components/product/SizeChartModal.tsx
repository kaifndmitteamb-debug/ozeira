'use client';

import React from 'react';
import { X, Ruler } from 'lucide-react';

interface SizeChartModalProps {
  categoryName?: string;
  onClose: () => void;
}

export function SizeChartModal({ categoryName = 'Apparel', onClose }: SizeChartModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#14151a] text-neutral-900 dark:text-neutral-100 rounded-3xl shadow-2xl p-6 sm:p-8 border border-neutral-200 dark:border-neutral-800 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-brand-amber/15 text-brand-amber rounded-2xl">
            <Ruler className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-xl text-neutral-900 dark:text-neutral-100">Atelier Size & Measurement Guide</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Standard international sizing precision in centimeters and inches.</p>
          </div>
        </div>

        {/* Apparel Sizing Table */}
        <div className="space-y-6 text-xs">
          <div>
            <h4 className="font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider mb-2">
              Apparel & Knitwear Measurements (cm / inches)
            </h4>
            <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-2xl">
              <table className="w-full text-left divide-y divide-neutral-200 dark:divide-neutral-800">
                <thead className="bg-neutral-50 dark:bg-neutral-900 text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase">
                  <tr>
                    <th className="p-3">Size</th>
                    <th className="p-3">Chest (cm / in)</th>
                    <th className="p-3">Waist (cm / in)</th>
                    <th className="p-3">Shoulder (cm / in)</th>
                    <th className="p-3">Sleeve Length</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-300">
                  <tr>
                    <td className="p-3 font-bold text-neutral-900 dark:text-neutral-100">S (36-38)</td>
                    <td className="p-3">96 cm / 38"</td>
                    <td className="p-3">81 cm / 32"</td>
                    <td className="p-3">44 cm / 17.3"</td>
                    <td className="p-3">64 cm / 25.2"</td>
                  </tr>
                  <tr className="bg-neutral-50/50 dark:bg-neutral-900/30">
                    <td className="p-3 font-bold text-neutral-900 dark:text-neutral-100">M (38-40)</td>
                    <td className="p-3">104 cm / 41"</td>
                    <td className="p-3">88 cm / 34.6"</td>
                    <td className="p-3">46 cm / 18.1"</td>
                    <td className="p-3">65.5 cm / 25.8"</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-neutral-900 dark:text-neutral-100">L (40-42)</td>
                    <td className="p-3">112 cm / 44"</td>
                    <td className="p-3">96 cm / 37.8"</td>
                    <td className="p-3">48 cm / 18.9"</td>
                    <td className="p-3">67 cm / 26.4"</td>
                  </tr>
                  <tr className="bg-neutral-50/50 dark:bg-neutral-900/30">
                    <td className="p-3 font-bold text-neutral-900 dark:text-neutral-100">XL (42-44)</td>
                    <td className="p-3">120 cm / 47"</td>
                    <td className="p-3">104 cm / 41"</td>
                    <td className="p-3">50 cm / 19.7"</td>
                    <td className="p-3">68.5 cm / 27"</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Footwear Conversion */}
          <div>
            <h4 className="font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider mb-2">
              Footwear Conversion Matrix
            </h4>
            <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-2xl">
              <table className="w-full text-left divide-y divide-neutral-200 dark:divide-neutral-800">
                <thead className="bg-neutral-50 dark:bg-neutral-900 text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase">
                  <tr>
                    <th className="p-3">UK / India</th>
                    <th className="p-3">EU</th>
                    <th className="p-3">US Men</th>
                    <th className="p-3">Foot Length (cm)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-300">
                  <tr>
                    <td className="p-3 font-bold text-neutral-900 dark:text-neutral-100">UK 7</td>
                    <td className="p-3">41</td>
                    <td className="p-3">8.0</td>
                    <td className="p-3">25.5 cm</td>
                  </tr>
                  <tr className="bg-neutral-50/50 dark:bg-neutral-900/30">
                    <td className="p-3 font-bold text-neutral-900 dark:text-neutral-100">UK 8</td>
                    <td className="p-3">42</td>
                    <td className="p-3">9.0</td>
                    <td className="p-3">26.5 cm</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold text-neutral-900 dark:text-neutral-100">UK 9</td>
                    <td className="p-3">43</td>
                    <td className="p-3">10.0</td>
                    <td className="p-3">27.5 cm</td>
                  </tr>
                  <tr className="bg-neutral-50/50 dark:bg-neutral-900/30">
                    <td className="p-3 font-bold text-neutral-900 dark:text-neutral-100">UK 10</td>
                    <td className="p-3">44</td>
                    <td className="p-3">11.0</td>
                    <td className="p-3">28.5 cm</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
          <span>Need custom tailoring advice?</span>
          <button
            onClick={onClose}
            className="font-bold text-brand-amber hover:underline"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
