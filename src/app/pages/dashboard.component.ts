import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../core/services/data.service';
import { OrdemServico } from '../core/models/models';
import { RouterLink } from '@angular/router';

type StatusOrdem = OrdemServico['status'];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
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

        <div class="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <label class="relative flex w-full items-center lg:max-w-sm">
            <svg class="pointer-events-none absolute left-4 h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-4.35-4.35M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" /></svg>
            <input
              type="search"
              class="w-full rounded-full border border-white/10 bg-slate-900/60 py-2 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-400 shadow-inner shadow-slate-950/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
              placeholder="Buscar por cliente, placa, status ou nº da O.S."
              [ngModel]="busca()"
              (ngModelChange)="atualizarBusca($event)"
            />
          </label>

          <div class="flex flex-wrap gap-2">
            @for (status of statusOpcoes; track status) {
              <button
                type="button"
                class="rounded-full border px-4 py-1 text-xs font-semibold transition"
                [class.bg-sky-500/20]="estaSelecionado(status)"
                [class.border-sky-400]="estaSelecionado(status)"
                [class.text-sky-100]="estaSelecionado(status)"
                [class.border-white/15]="!estaSelecionado(status)"
                [class.text-slate-200]="!estaSelecionado(status)"
                (click)="alternarStatus(status)"
              >
                {{ status }}
              </button>
            }
          </div>
        </div>

        <div class="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
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
                @if (ordensRecentesFiltradas().length) {
                  @for (item of ordensRecentesFiltradas().slice(0, 8); track item.ordem.id) {
                    <tr class="transition hover:bg-white/5">
                      <td class="whitespace-nowrap px-6 py-4 font-semibold text-sky-300">
                        <a
                          [routerLink]="['/ordens-servico', item.ordem.id]"
                          class="transition hover:text-sky-200"
                        >
                          #{{ item.ordem.id }}
                        </a>
                      </td>
                      <td class="px-6 py-4">{{ item.placa || '—' }}</td>
                      <td class="px-6 py-4">{{ item.clienteNome || '—' }}</td>
                      <td class="px-6 py-4 text-center">{{ item.ordem.dataEntrada }}</td>
                      <td class="px-6 py-4 text-center">
                        <span
                          class="inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold"
                          [ngClass]="getStatusClass(item.ordem.status)"
                        >
                          {{ item.ordem.status }}
                        </span>
                      </td>
                    </tr>
                  }
                } @else {
                  <tr>
                    <td colspan="5" class="px-6 py-6 text-center text-sm text-slate-300">Nenhuma ordem encontrada.</td>
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

  statusOpcoes: StatusOrdem[] = ['Em Andamento', 'Aguardando Aprovação', 'Finalizada', 'Cancelada'];
  busca = signal('');
  statusSelecionados = signal(new Set<StatusOrdem>(this.statusOpcoes));

  ordensRecentesFiltradas = computed(() => {
    const texto = this.busca().trim().toLowerCase();
    const selecionados = this.statusSelecionados();
    const ordens = this.ordensServico();
    const clientes = this.clientes();
    const veiculos = this.veiculos();

    const detalhadas = ordens.map(ordem => {
      const cliente = clientes.find(item => item.id === ordem.clienteId);
      const veiculo = veiculos.find(item => item.id === ordem.veiculoId);
      return {
        ordem,
        clienteNome: cliente?.nome ?? '',
        placa: veiculo?.placa ?? '',
      };
    });

    const filtradas = detalhadas.filter(item => {
      if (!selecionados.has(item.ordem.status)) {
        return false;
      }
      if (!texto) {
        return true;
      }
      const campos = [
        `#${item.ordem.id}`,
        String(item.ordem.id),
        item.clienteNome,
        item.placa,
        item.ordem.status,
      ].map(valor => valor.toLowerCase());
      return campos.some(valor => valor.includes(texto));
    });

    const ordenar = (lista: { ordem: OrdemServico }[]) =>
      [...lista].sort((a, b) => {
        if (a.ordem.dataEntrada === b.ordem.dataEntrada) {
          return b.ordem.id - a.ordem.id;
        }
        return a.ordem.dataEntrada > b.ordem.dataEntrada ? -1 : 1;
      });

    const ativas = filtradas.filter(item => item.ordem.status !== 'Finalizada');
    const finalizadas = filtradas.filter(item => item.ordem.status === 'Finalizada');

    return [...ordenar(ativas), ...ordenar(finalizadas)];
  });

  stats = computed(() => {
    const osList = this.ordensServico();
    return {
      emAndamento: osList.filter(os => os.status === 'Em Andamento').length,
      entreguesMes: osList.filter(os => os.status === 'Finalizada').length,
      aguardando: osList.filter(os => os.status === 'Aguardando Aprovação').length,
    }
  });

  atualizarBusca(valor: string) {
    this.busca.set(valor);
  }

  alternarStatus(status: StatusOrdem) {
    const atual = new Set(this.statusSelecionados());
    if (atual.has(status)) {
      atual.delete(status);
    } else {
      atual.add(status);
    }
    this.statusSelecionados.set(atual);
  }

  estaSelecionado(status: StatusOrdem) {
    return this.statusSelecionados().has(status);
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
