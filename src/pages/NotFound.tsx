import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-background transition-colors text-sm text-foreground border border-border"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <a href="/" className="text-primary underline hover:text-primary/90 text-sm">
            Return to Home
          </a>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
