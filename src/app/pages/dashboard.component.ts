import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../core/services/data.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="space-y-8">
      <div class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <div
          class="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur"
        >
          <span class="absolute inset-0 bg-gradient-to-br from-sky-500/35 via-slate-900/40 to-transparent"></span>
          <div class="relative flex flex-col gap-1">
            <p class="text-xs font-semibold uppercase tracking-[0.45em] text-sky-200/60">Fluxo</p>
            <h3 class="text-4xl font-semibold text-white">{{ stats().emAndamento }}</h3>
            <p class="text-sm text-slate-300/80">O.S. em andamento</p>
          </div>
        </div>

        <div
          class="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur"
        >
          <span class="absolute inset-0 bg-gradient-to-br from-emerald-500/35 via-slate-900/40 to-transparent"></span>
          <div class="relative flex flex-col gap-1">
            <p class="text-xs font-semibold uppercase tracking-[0.45em] text-emerald-200/60">Entrega</p>
            <h3 class="text-4xl font-semibold text-white">{{ stats().entreguesMes }}</h3>
            <p class="text-sm text-slate-300/80">O.S. entregues este mês</p>
          </div>
        </div>

        <div
          class="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur"
        >
          <span class="absolute inset-0 bg-gradient-to-br from-amber-500/35 via-slate-900/40 to-transparent"></span>
          <div class="relative flex flex-col gap-1">
            <p class="text-xs font-semibold uppercase tracking-[0.45em] text-amber-200/60">Aprovação</p>
            <h3 class="text-4xl font-semibold text-white">{{ stats().aguardando }}</h3>
            <p class="text-sm text-slate-300/80">O.S. aguardando aprovação</p>
          </div>
        </div>

        <div
          class="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur"
        >
          <span class="absolute inset-0 bg-gradient-to-br from-indigo-500/35 via-slate-900/40 to-transparent"></span>
          <div class="relative flex flex-col gap-1">
            <p class="text-xs font-semibold uppercase tracking-[0.45em] text-indigo-200/60">Agenda</p>
            <h3 class="text-4xl font-semibold text-white">0</h3>
            <p class="text-sm text-slate-300/80">O.S. com previsão para hoje</p>
          </div>
        </div>
      </div>

      <div
        class="rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur sm:p-8"
      >
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.45em] text-sky-200/60">Últimas movimentações</p>
            <h2 class="text-xl font-semibold text-white">O.S. Recentes</h2>
            <p class="text-sm text-slate-300/80">Acompanhe as solicitações mais recentes registradas na oficina.</p>
          </div>

          <a
            class="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-sky-200 transition hover:bg-white/10 hover:text-sky-100"
            routerLink="/ordens-servico"
          >
            Ver todas as ordens
          </a>
        </div>

        <div class="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-white/10 text-left text-sm text-slate-100">
              <thead class="bg-white/5 text-xs uppercase tracking-wider text-slate-300">
                <tr>
                  <th class="px-6 py-3 font-semibold">O.S. #</th>
                  <th class="px-6 py-3 font-semibold">Placa</th>
                  <th class="px-6 py-3 font-semibold">Cliente</th>
                  <th class="px-6 py-3 text-center font-semibold">Data Entrada</th>
                  <th class="px-6 py-3 text-center font-semibold">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5 text-sm">
                @for (os of ordensServico().slice(0, 5); track os.id) {
                  <tr class="transition hover:bg-white/5">
                    <td class="whitespace-nowrap px-6 py-4 font-semibold text-sky-300">
                      <a
                        [routerLink]="['/ordens-servico', os.id]"
                        class="transition hover:text-sky-200"
                      >
                        #{{ os.id }}
                      </a>
                    </td>
                    <td class="px-6 py-4">{{ getVeiculo(os.veiculoId)?.placa }}</td>
                    <td class="px-6 py-4">{{ getCliente(os.clienteId)?.nome }}</td>
                    <td class="px-6 py-4 text-center">{{ os.dataEntrada }}</td>
                    <td class="px-6 py-4 text-center">
                      <span
                        class="inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold"
                        [ngClass]="getStatusClass(os.status)"
                      >
                        {{ os.status }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class DashboardComponent {
  private dataService = inject(DataService);
  
  ordensServico = this.dataService.ordensServico;
  veiculos = this.dataService.veiculos;
  clientes = this.dataService.clientes;

  stats = computed(() => {
    const osList = this.ordensServico();
    return {
      emAndamento: osList.filter(os => os.status === 'Em Andamento').length,
      entreguesMes: osList.filter(os => os.status === 'Finalizada').length,
      aguardando: osList.filter(os => os.status === 'Aguardando Aprovação').length,
    }
  });

  getVeiculo(id: number) {
    return this.veiculos().find(v => v.id === id);
  }

  getCliente(id: number) {
    return this.clientes().find(c => c.id === id);
  }

  getStatusClass(status: string) {
    switch (status) {
      case 'Em Andamento':
        return 'bg-sky-500/20 text-sky-200';
      case 'Aguardando Aprovação':
        return 'bg-amber-500/20 text-amber-200';
      case 'Finalizada':
        return 'bg-emerald-500/20 text-emerald-200';
      default:
        return 'bg-slate-500/20 text-slate-200';
    }
  }
}
