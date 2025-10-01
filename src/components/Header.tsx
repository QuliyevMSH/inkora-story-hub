import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, User, Settings, Bell, HelpCircle, LogOut, PenLine, UserPlus } from "lucide-react";
import inkoraLogo from "@/assets/inkora-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Header = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [showAuthNotification, setShowAuthNotification] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Çıxış zamanı xəta baş verdi");
    } else {
      toast.success("Hesabdan çıxış edildi");
      navigate("/");
    }
  };

  return (
    <>
      {!session && showAuthNotification && (
        <div className="bg-primary/10 border-b border-primary/20 py-2 px-4">
          <div className="container mx-auto flex items-center justify-between">
            <p className="text-sm text-foreground">
              Qeydiyyatdan keçin və ya giriş edin
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAuthNotification(false)}
              className="h-auto p-1"
            >
              ✕
            </Button>
          </div>
        </div>
      )}
      
      <header className="sticky top-0 z-50 w-full border-b bg-card shadow-inkora backdrop-blur supports-[backdrop-filter]:bg-card/95">
        <div className="container flex h-16 items-center justify-between px-4">
          {/* Logo and Site Name */}
          <Link to="/" className="flex items-center gap-3 transition-inkora hover:opacity-80">
            <img src={inkoraLogo} alt="Inkora Logo" className="h-10 w-10" />
            <h1 className="text-2xl font-bold text-secondary">Inkora</h1>
          </Link>

          {/* Search Bar */}
          <div className="relative hidden w-full max-w-md md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Hekayələr, yazıçılar, tağlar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 transition-inkora focus:shadow-inkora"
            />
          </div>

          {/* User Menu or Login Button */}
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-12 w-12 rounded-full transition-inkora hover:shadow-inkora"
                >
                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                    <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=user" alt="İstifadəçi" />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {session.user.email?.[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 animate-slide-down bg-popover shadow-inkora-lg"
              >
                <DropdownMenuLabel>Hesabım</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    to="/profile"
                    className="flex cursor-pointer items-center gap-2 transition-inkora"
                  >
                    <User className="h-4 w-4" />
                    <span>Mənim profilim</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    to="/write"
                    className="flex cursor-pointer items-center gap-2 text-primary transition-inkora"
                  >
                    <PenLine className="h-4 w-4" />
                    <span className="font-medium">Yaz</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    to="/settings"
                    className="flex cursor-pointer items-center gap-2 transition-inkora"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Tənzimləmələr</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    to="/notifications"
                    className="flex cursor-pointer items-center gap-2 transition-inkora"
                  >
                    <Bell className="h-4 w-4" />
                    <span>Bildirişlər</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    to="/help"
                    className="flex cursor-pointer items-center gap-2 transition-inkora"
                  >
                    <HelpCircle className="h-4 w-4" />
                    <span>Kömək</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="cursor-pointer text-destructive transition-inkora focus:text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Hesabdan çıx</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/auth")}
              className="rounded-full hover:bg-primary/10"
              title="Qeydiyyat / Giriş"
            >
              <UserPlus className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Mobile Search Bar */}
        <div className="container px-4 pb-3 md:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Axtar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10"
            />
          </div>
        </div>
      </header>
    </>
  );
};
