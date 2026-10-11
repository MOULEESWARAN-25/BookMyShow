import { Link } from "react-router-dom";
import { ArrowLeft, SearchX } from "lucide-react";

const NotFound = () => (
  <div className="empty-state">
    <SearchX />
    <h1>Page not found</h1>
    <Link to="/" className="back-link">
      <ArrowLeft /> Back to movies
    </Link>
  </div>
);

export default NotFound;
