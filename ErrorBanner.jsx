import { AlertCircle, X } from "lucide-react";

export default function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="banner banner-error" role="alert">
      <AlertCircle size={20} aria-hidden="true" />
      <p>{message}</p>
      {onDismiss && (
        <button type="button" className="icon-button" onClick={onDismiss} aria-label="Dismiss message">
          <X size={18} />
        </button>
      )}
    </div>
  );
}
