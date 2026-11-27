import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '@/store/useStore';

export default function ToastHost() {
  const toasts = useStore((s) => s.toasts);
  const dismiss = useStore((s) => s.dismissToast);

  return (
    <div className="toast-stack">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            className={`toast ${t.tone}`}
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            onClick={() => dismiss(t.id)}
          >
            <span className="toast-dot" />
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
