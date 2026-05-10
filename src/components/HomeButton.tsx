import { Home } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function HomeButton() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  if (pathname === "/") return null;
  return (
    <Button
      onClick={() => navigate("/")}
      size="icon"
      variant="default"
      aria-label="Back to homepage"
      className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg h-12 w-12"
    >
      <Home className="w-5 h-5" />
    </Button>
  );
}
