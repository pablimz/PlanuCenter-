import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';

type ThemeOption = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'planu-theme-preference';
  private readonly document = inject(DOCUMENT);

  private readonly themeSignal = signal<ThemeOption>(this.resolveInitialTheme());

  readonly theme = computed(() => this.themeSignal());
  readonly isDark = computed(() => this.themeSignal() === 'dark');

  constructor() {
    effect(() => {
      const theme = this.themeSignal();
      this.applyTheme(theme);
      this.persistTheme(theme);
    });
  }

  toggleTheme(): void {
    this.themeSignal.update(current => (current === 'dark' ? 'light' : 'dark'));
  }

  setTheme(theme: ThemeOption): void {
    this.themeSignal.set(theme);
  }

  private resolveInitialTheme(): ThemeOption {
    if (typeof window === 'undefined') {
      return 'dark';
    }
    const stored = window.localStorage.getItem(this.storageKey) as ThemeOption | null;
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }

  private applyTheme(theme: ThemeOption): void {
    const root = this.document?.documentElement;
    const body = this.document?.body;

    if (root) {
      root.classList.toggle('dark', theme === 'dark');
    }

    if (body) {
      body.classList.toggle('dark', theme === 'dark');
      body.classList.toggle('theme-dark', theme === 'dark');
      body.classList.toggle('theme-light', theme === 'light');
    }
  }

  private persistTheme(theme: ThemeOption): void {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(this.storageKey, theme);
  }
}
