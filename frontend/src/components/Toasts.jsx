import Message from "./Message";

// Shows the result of an action in the bottom corner, so it is visible wherever the user has scrolled.
const Toasts = ({ message, error, onClose }) => (
  <div className="toasts">
    {message && (
      <Message type="success" onClose={onClose}>
        {message}
      </Message>
    )}
    {error && (
      <Message type="error" onClose={onClose}>
        {error}
      </Message>
    )}
  </div>
);

export default Toasts;
