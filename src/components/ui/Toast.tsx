import React, { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

let toastHandler: ((toast: ToastMessage) => void) | null = null;

export const toast = {
  success: (title: string, message = "") => {
    toastHandler?.({ id: `t-${Date.now()}-${Math.random()}`, type: "success", title, message });
  },
  error: (title: string, message = "") => {
    toastHandler?.({ id: `t-${Date.now()}-${Math.random()}`, type: "error", title, message });
  },
  info: (title: string, message = "") => {
    toastHandler?.({ id: `t-${Date.now()}-${Math.random()}`, type: "info", title, message });
  },
  warning: (title: string, message = "") => {
    toastHandler?.({ id: `t-${Date.now()}-${Math.random()}`, type: "warning", title, message });
  },
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    toastHandler = (newToast: ToastMessage) => {
      setToasts((prev) => [...prev, newToast]);
      const duration = newToast.duration || 4500;
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, duration);
    };

    return () => {
      toastHandler = null;
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div
      id="toast-container"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((t) => {
        const bgColors = {
          success: "bg-emerald-900/90 border-emerald-700 text-emerald-100",
          error: "bg-rose-900/90 border-rose-700 text-rose-100",
          warning: "bg-amber-900/90 border-amber-700 text-amber-100",
          info: "bg-slate-900/95 border-slate-700 text-slate-100",
        };

        const icons = {
          success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />,
          error: <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />,
          warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />,
          info: <Info className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />,
        };

        return (
          <div
            key={t.id}
            id={`toast-${t.id}`}
            className={`pointer-events-auto flex items-start justify-between gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 transform translate-y-0 ${bgColors[t.type]}`}
          >
            <div className="flex items-start gap-3">
              {icons[t.type]}
              <div>
                <h5 className="font-semibold text-sm leading-tight text-white">{t.title}</h5>
                {t.message && <p className="text-xs mt-1 text-slate-300 leading-relaxed">{t.message}</p>}
              </div>
            </div>
            <button
              id={`toast-close-${t.id}`}
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-white p-1 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
