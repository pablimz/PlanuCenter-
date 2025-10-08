import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

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
          <div>
            <label class="mb-2 block text-sm font-medium text-slate-200" for="email">E-mail</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              class="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-400 shadow-inner shadow-slate-950/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
              placeholder="seu@email.com"
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
      </div>
    </div>
  `,
})
export class LoginComponent {
  private fb = new FormBuilder();

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  onSubmit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    // Futuramente, integrar com serviço de autenticação.
    console.log('Login realizado', this.form.value);
  }
}
