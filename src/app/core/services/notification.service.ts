import { Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'info';

export interface NotificationState {
  id: number;
  type: NotificationType;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly atual = signal<NotificationState | null>(null);
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  readonly notification = this.atual.asReadonly();

  success(message: string) {
    this.mostrar('success', message);
  }

  error(message: string) {
    this.mostrar('error', message, 6000);
  }

  info(message: string) {
    this.mostrar('info', message);
  }

  clear() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.atual.set(null);
  }

  private mostrar(tipo: NotificationType, mensagem: string, duracao = 4000) {
    const texto = (mensagem ?? '').toString().trim();
    if (!texto) {
      return;
    }

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    const id = Date.now();
    this.atual.set({ id, type: tipo, message: texto });

    this.timeoutId = setTimeout(() => {
      const atual = this.atual();
      if (atual && atual.id === id) {
        this.clear();
      }
    }, duracao);
  }
}
