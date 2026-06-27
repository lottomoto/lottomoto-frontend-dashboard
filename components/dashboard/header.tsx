"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Bell, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  tirageActif?: string;
}

export function Header({ tirageActif }: HeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    if (searchOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [searchOpen]);

  return (
    <header className="sticky top-0 z-30 bg-background border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vue d&apos;ensemble</h1>
          <p className="text-sm text-muted-foreground capitalize">{dateStr}</p>
        </div>
        <div className="flex items-center gap-3" ref={searchRef}>
          {searchOpen ? (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 w-62.5 transition-all">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Rechercher..."
                className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
              />
              <button onClick={() => setSearchOpen(false)} className="text-muted-foreground hover:text-foreground shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={() => setSearchOpen(true)}>
              <Search className="h-5 w-5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
            <Bell className="h-5 w-5" />
          </Button>
          {tirageActif && (
            <Badge variant="outline" className="border-primary/50 bg-primary/10 text-primary gap-1.5 px-3 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
              </span>
              Tirage {tirageActif} actif
            </Badge>
          )}
        </div>
      </div>
    </header>
  );
}
