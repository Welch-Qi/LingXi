"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const THEME_KEY = "lingxi.theme";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY);
    const next = stored === "dark";
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    setMounted(true);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem(THEME_KEY, next ? "dark" : "light");
  }

  return (
    <button
      type="button"
      aria-label={dark ? "切换为浅色模式" : "切换为深色模式"}
      onClick={toggle}
      className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] border border-border bg-card-solid text-slate transition-colors hover:border-primary-line hover:text-primary"
    >
      {mounted && dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
