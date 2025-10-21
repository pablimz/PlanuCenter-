import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 text-slate-100">
      <div class="pointer-events-none absolute inset-0">
        <div class="absolute -left-20 top-10 h-64 w-64 rounded-full bg-sky-500/30 blur-3xl"></div>
        <div class="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-indigo-500/30 blur-3xl"></div>
      </div>
      <div class="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur">
        <div class="mb-10 text-center">
          <p class="text-xs font-semibold uppercase tracking-[0.5em] text-sky-300/80">PlanuCenter</p>
          <h1 class="mt-3 text-3xl font-semibold text-white">Bem-vindo de volta</h1>
          <p class="mt-2 text-sm text-slate-300/80">Acesse sua conta para continuar gerenciando a operação da sua oficina.</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
          @if (mensagemErro()) {
            <div class="rounded-2xl border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {{ mensagemErro() }}
            </div>
          }

          <div>
            <label class="mb-2 block text-sm font-medium text-slate-200" for="email">E-mail</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              class="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-400 shadow-inner shadow-slate-950/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
              placeholder="seu@email.com"
              autocomplete="email"
              autofocus
            />
            @if (form.controls.email.touched && form.controls.email.invalid) {
              <p class="mt-2 text-sm text-rose-300">Informe um e-mail válido.</p>
            }
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-slate-200" for="password">Senha</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              class="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-400 shadow-inner shadow-slate-950/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
              placeholder="Digite sua senha"
              autocomplete="current-password"
            />
            @if (form.controls.password.touched && form.controls.password.invalid) {
              <p class="mt-2 text-sm text-rose-300">A senha deve ter pelo menos 6 caracteres.</p>
            }
          </div>

          <button
            type="submit"
            class="w-full rounded-full bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/40 transition hover:from-sky-400 hover:via-blue-400 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            [disabled]="form.invalid"
          >
            Entrar
          </button>
        </form>

        <div class="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
          <p class="text-xs font-semibold uppercase tracking-[0.35em] text-sky-300/70">Acesso rápido</p>
          <p class="mt-2 text-slate-200/90">
            Utilize as credenciais padrão para explorar o painel completo:
          </p>
          <ul class="mt-3 space-y-2 text-slate-100/90">
            <li class="flex flex-col gap-1 rounded-xl bg-slate-900/50 p-3">
              <span class="text-xs font-semibold uppercase tracking-wide text-slate-400">Administrador</span>
              <span><strong>E-mail:</strong> admin@planucenter.com</span>
              <span><strong>Senha:</strong> Oficina@123</span>
            </li>
            <li class="flex flex-col gap-1 rounded-xl bg-slate-900/40 p-3">
              <span class="text-xs font-semibold uppercase tracking-wide text-slate-400">Consultor de serviços</span>
              <span><strong>E-mail:</strong> consultor@planucenter.com</span>
              <span><strong>Senha:</strong> Servicos@123</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  mensagemErro = signal<string | null>(null);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  constructor() {
    effect(() => {
      if (this.authService.autenticado()) {
        void this.router.navigate(['/inicio']);
      }
    });
  }

  onSubmit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    const email = this.form.value.email ?? '';
    const senha = this.form.value.password ?? '';

    const autenticado = this.authService.login(email, senha);
    if (!autenticado) {
      this.mensagemErro.set('Credenciais inválidas. Verifique o e-mail e a senha informados.');
      return;
    }

    this.mensagemErro.set(null);
    void this.router.navigate(['/inicio']);
  }
}
