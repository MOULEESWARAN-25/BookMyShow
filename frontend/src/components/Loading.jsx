import { LoaderCircle } from "lucide-react";

const Loading = ({ text = "Loading..." }) => (
  <div className="loading">
    <LoaderCircle className="spin" />
    {text}
  </div>
);

export default Loading;
