import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(
  amountInINR: number,
  currencyCode: string = 'INR',
  currencySymbol: string = '₹',
  rateAgainstINR: number = 1
): string {
  const converted = amountInINR * rateAgainstINR;
  if (currencyCode === 'INR') {
    return `${currencySymbol}${Math.round(converted).toLocaleString('en-IN')}`;
  }
  return `${currencySymbol}${converted.toFixed(2)}`;
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `OZ-${year}-${randomDigits}`;
}

export function generateReferralCode(name: string): string {
  const cleanName = name.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 5) || 'OZEIRA';
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  return `${cleanName}-${randomSuffix}`;
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export function formatMarkdownToHtml(markdown: string): string {
  if (!markdown) return '';
  const lines = markdown.trim().split('\n');
  let inList = false;
  const htmlLines: string[] = [];

  for (let rawLine of lines) {
    let line = rawLine.trim();

    if (!line) {
      if (inList) {
        htmlLines.push('</ul>');
        inList = false;
      }
      continue;
    }

    // Bold formatting
    line = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-stone-900 dark:text-stone-100">$1</strong>');
    // Italic formatting
    line = line.replace(/\*(.*?)\*/g, '<em class="italic">$1</em>');

    if (line.startsWith('# ')) {
      if (inList) { htmlLines.push('</ul>'); inList = false; }
      htmlLines.push(`<h1 class="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 mt-6 mb-3">${line.slice(2)}</h1>`);
    } else if (line.startsWith('## ')) {
      if (inList) { htmlLines.push('</ul>'); inList = false; }
      htmlLines.push(`<h2 class="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 mt-5 mb-2">${line.slice(3)}</h2>`);
    } else if (line.startsWith('### ')) {
      if (inList) { htmlLines.push('</ul>'); inList = false; }
      htmlLines.push(`<h3 class="text-base sm:text-lg font-serif font-bold text-[#c46331] dark:text-amber-400 mt-4 mb-2">${line.slice(4)}</h3>`);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inList) {
        htmlLines.push('<ul class="list-disc pl-5 my-2 space-y-1.5 text-stone-600 dark:text-stone-300 text-sm">');
        inList = true;
      }
      htmlLines.push(`<li>${line.slice(2)}</li>`);
    } else {
      if (inList) { htmlLines.push('</ul>'); inList = false; }
      htmlLines.push(`<p class="text-stone-600 dark:text-stone-300 text-sm leading-relaxed my-2">${line}</p>`);
    }
  }

  if (inList) {
    htmlLines.push('</ul>');
  }

  return htmlLines.join('\n');
}

