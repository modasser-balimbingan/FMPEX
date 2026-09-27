import { useApp } from '../../context/AppContext';

export default function Toast() {
  const { toast } = useApp();
  if (!toast) return null;
  return (
    <div className={`toast toast-${toast.type}`} role={toast.type === 'error' ? 'alert' : 'status'} aria-live="polite">
      <span aria-hidden="true">{toast.type === 'error' ? '!' : '✓'}</span>
      {toast.message}
    </div>
  );
}
