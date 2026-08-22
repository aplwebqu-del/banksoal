export function formatBytes(bytes: number, decimals = 1) {
  if (!+bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatDate(isoString: string): string {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return isoString;
  }
}

export function formatDateTime(isoString: string): string {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return isoString;
  }
}

export function getDifficultyColor(level: string): { bg: string; text: string; border: string } {
  switch (level?.toLowerCase()) {
    case 'mudah':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-500/20' };
    case 'sulit':
      return { bg: 'bg-rose-500/10', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-500/20' };
    case 'sedang':
    default:
      return { bg: 'bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-500/20' };
  }
}

export function getSubjectColor(mapel: string): string {
  const map: Record<string, string> = {
    Matematika: 'from-blue-600 to-indigo-600',
    'Bahasa Indonesia': 'from-red-600 to-rose-600',
    'Bahasa Inggris': 'from-violet-600 to-purple-600',
    IPA: 'from-teal-600 to-emerald-600',
    IPS: 'from-amber-600 to-orange-600',
    Fisika: 'from-cyan-600 to-blue-600',
    Kimia: 'from-pink-600 to-rose-600',
    Biologi: 'from-emerald-600 to-green-600',
    Informatika: 'from-sky-600 to-indigo-600',
    Ekonomi: 'from-yellow-600 to-amber-600',
    Sejarah: 'from-stone-600 to-neutral-600',
    Geografi: 'from-lime-600 to-emerald-600',
  };
  return map[mapel] || 'from-slate-600 to-slate-800';
}
