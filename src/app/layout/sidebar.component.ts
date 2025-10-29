import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MenuItem } from '../core/models/models';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <div class="flex h-full flex-col border-r border-slate-200/80 bg-slate-50 text-slate-700 transition-colors duration-300 dark:border-transparent dark:bg-gradient-to-b dark:from-gray-950 dark:via-gray-900 dark:to-gray-800 dark:text-gray-100">
      <div class="flex h-24 items-center justify-center px-6 border-b border-slate-200/70 dark:border-white/10">
        <svg
          role="img"
          aria-labelledby="planu-logo-title"
          viewBox="0 0 420 96"
          class="h-16 w-full text-slate-800 dark:text-white"
          preserveAspectRatio="xMidYMid meet"
        >
          <title id="planu-logo-title">PlanuCenter</title>
          <defs>
            <linearGradient id="pc-wordmark" x1="12" x2="408" y1="18" y2="82" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#2CD4FF" />
              <stop offset="45%" stop-color="#3B82F6" />
              <stop offset="100%" stop-color="#7C3AED" />
            </linearGradient>
            <linearGradient id="pc-underline" x1="30" x2="390" y1="86" y2="86" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#38BDF8" stop-opacity="0" />
              <stop offset="40%" stop-color="#38BDF8" stop-opacity=".45" />
              <stop offset="60%" stop-color="#8B5CF6" stop-opacity=".45" />
              <stop offset="100%" stop-color="#8B5CF6" stop-opacity="0" />
            </linearGradient>
            <radialGradient id="pc-glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(210 44) scale(210 36)">
              <stop offset="0%" stop-color="#60A5FA" stop-opacity=".35" />
              <stop offset="100%" stop-color="#1E3A8A" stop-opacity="0" />
            </radialGradient>
          </defs>
          <g fill="none" fill-rule="evenodd">
            <path d="M48 24c22-16 62-20 94-8 34 12 75 12 118-2 36-12 77-8 112 12" stroke="url(#pc-wordmark)" stroke-width="6" stroke-linecap="round" opacity=".35" />
            <ellipse cx="210" cy="54" rx="190" ry="36" fill="url(#pc-glow)" />
            <text
              x="50%"
              y="60"
              text-anchor="middle"
              font-family="'Poppins','Inter','Segoe UI',sans-serif"
              font-size="44"
              font-weight="700"
              letter-spacing="0.06em"
              fill="url(#pc-wordmark)"
            >
              Planu
              <tspan fill="#F8FAFC" font-weight="800">Center</tspan>
            </text>
            <path d="M60 78h300" stroke="url(#pc-underline)" stroke-width="6" stroke-linecap="round" />
          </g>
        </svg>
      </div>

      <div class="flex-1 overflow-y-auto px-3 pb-6">
        <div class="rounded-2xl bg-white p-3 shadow-sm dark:bg-white/5 dark:shadow-none">
          <p class="px-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-gray-400">Navegação</p>
          <nav class="mt-2 space-y-1">
            @for (item of menuItems; track item.id) {
              <a
                [routerLink]="item.path"
                routerLinkActive="bg-blue-500/80 text-white shadow-lg shadow-blue-900/30"
                [routerLinkActiveOptions]="{ exact: true }"
                (click)="navItemClicked.emit()"
                class="flex items-center rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <span class="mr-3 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-gray-200">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="h-5 w-5"
                  >
                    <path [attr.d]="item.iconPath" />
                  </svg>
                </span>
                <span>{{ item.label }}</span>
              </a>
            }
          </nav>
        </div>
      </div>

    </div>
  `,
})
export class SidebarComponent {
  @Output() navItemClicked = new EventEmitter<void>();

  menuItems: MenuItem[] = [
    { id: 'inicio', label: 'Início', path: '/inicio', iconPath: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
    { id: 'ordem_servico', label: 'Ordens de Serviço', path: '/ordens-servico', iconPath: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M16 18H8 M16 14H8 M12 10H8' },
    { id: 'veiculos', label: 'Veículos', path: '/veiculos', iconPath: 'M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11C5.84 5 5.28 5.42 5.08 6.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z' },
    { id: 'estoque', label: 'Estoque', path: '/estoque', iconPath: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z' },
    { id: 'clientes', label: 'Clientes', path: '/clientes', iconPath: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M8 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M20 21v-2a4 4 0 0 0-3-3.87 M17 3a4 4 0 0 1 0 8' },
  ];
}
