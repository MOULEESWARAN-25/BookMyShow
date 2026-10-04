import { CircleAlert, CircleCheck, X } from "lucide-react";

const Message = ({ type, children, onClose }) => {
  const Icon = type === "error" ? CircleAlert : CircleCheck;

  return (
    <div className={`message ${type}`} role={type === "error" ? "alert" : "status"}>
      <Icon />
      <span>{children}</span>
      {onClose && (
        <button className="message-close" onClick={onClose} aria-label="Close message">
          <X />
        </button>
      )}
    </div>
  );
};

export default Message;
