import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { NotificationService, NotificationType } from '../services/notification.service';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (alerta(); as atual) {
      <div class="fixed inset-x-0 top-4 z-[70] flex justify-center px-4">
        <div
          class="flex w-full max-w-md items-start gap-3 rounded-2xl border px-4 py-3 shadow-2xl shadow-slate-950/50 backdrop-blur"
          [ngClass]="classeDoTipo(atual.type)"
        >
          <div class="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/10">
            @switch (atual.type) {
              @case ('success') {
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              }
              @case ('error') {
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              }
              @default {
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round">
                  <path d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
                </svg>
              }
            }
          </div>

          <div class="flex-1 text-sm font-medium leading-5" [innerText]="atual.message"></div>

          <button
            type="button"
            class="ml-2 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs text-white/70 transition hover:bg-white/10 hover:text-white"
            (click)="fechar()"
            aria-label="Fechar aviso"
          >
            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    }
  `,
})
export class NotificationCenterComponent {
  private readonly service = inject(NotificationService);
  readonly alerta = computed(() => this.service.notification());

  classeDoTipo(tipo: NotificationType) {
    switch (tipo) {
      case 'success':
        return 'border-emerald-500/60 bg-emerald-500/10 text-emerald-100';
      case 'error':
        return 'border-rose-500/70 bg-rose-500/15 text-rose-100';
      default:
        return 'border-sky-500/60 bg-sky-500/10 text-sky-100';
    }
  }

  fechar() {
    this.service.clear();
  }
}
