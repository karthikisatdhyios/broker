export default function Modal({ title, onClose, children, maxWidth }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={maxWidth ? { maxWidth } : undefined} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
