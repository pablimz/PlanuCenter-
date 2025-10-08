import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { SidebarComponent } from './layout/sidebar.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private router = inject(Router);

  isMobileMenuOpen = signal(false);
  private profileMenuOpen = signal(false);

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(event => event.urlAfterRedirects),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  isLoginRoute = computed(() => this.currentUrl().startsWith('/login'));
  isProfileMenuOpen = computed(() => this.profileMenuOpen());

  toggleProfileMenu(): void {
    this.profileMenuOpen.update(value => !value);
  }

  logout(): void {
    this.profileMenuOpen.set(false);
    this.isMobileMenuOpen.set(false);
    void this.router.navigate(['/login']);
  }
}
