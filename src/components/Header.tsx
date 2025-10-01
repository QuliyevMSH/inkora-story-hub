import { useState } from "react";
import { Link } from "react-router-dom";
import {
  User,
  PenTool,
  Settings,
  Bell,
  HelpCircle,
  LogOut,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import inkoraLogo from "@/assets/inkora-logo.png";

export const Header = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
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

        {/* User Profile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-12 w-12 rounded-full transition-inkora hover:shadow-inkora"
            >
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=user" alt="İstifadəçi" />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  İ
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 animate-slide-down bg-popover shadow-inkora-lg"
          >
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
                <PenTool className="h-4 w-4" />
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

            <DropdownMenuItem className="cursor-pointer text-destructive transition-inkora focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Hesabdan çıx</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
  );
};
