import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../core/services/data.service';
import { Cliente } from '../core/models/models';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="rounded-3xl border border-white/10 bg-slate-900/50 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur sm:p-8">
      <div class="flex flex-col gap-6">
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.45em] text-sky-300/70">Clientes</p>
            <h2 class="text-2xl font-semibold text-white">Gestão de relacionamento</h2>
            <p class="text-sm text-slate-300/80">Centralize contatos, históricos e veículos associados.</p>
          </div>

          @if (modoVisualizacao() === 'lista') {
            <div class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              <label class="relative flex w-full items-center sm:w-72">
                <svg class="absolute left-4 h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-4.35-4.35M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" /></svg>
                <input
                  type="search"
                  class="w-full rounded-full border border-white/10 bg-slate-900/60 py-2 pl-11 pr-4 text-sm text-slate-100 placeholder:text-slate-400 shadow-inner shadow-slate-950/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                  placeholder="Buscar por nome, e-mail ou telefone"
                  [ngModel]="filtroBusca()"
                  (ngModelChange)="atualizarFiltro($event)"
                />
              </label>

              <button
                class="w-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:from-emerald-300 hover:via-teal-300 hover:to-sky-400 focus:outline-none focus:ring-2 focus:ring-emerald-300/60 sm:w-auto"
                (click)="abrirFormularioNovo()"
              >
                + Cadastrar cliente
              </button>
            </div>
          } @else {
            <button
              class="w-full rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 md:w-auto"
              (click)="voltarParaLista()"
            >
              Voltar para a lista
            </button>
          }
        </div>

        @if (modoVisualizacao() === 'lista') {
          <div class="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-white/10 text-left text-sm text-slate-100">
                <thead class="bg-white/5 text-xs uppercase tracking-wider text-slate-300">
                  <tr>
                    <th class="px-6 py-3 font-semibold">Nome</th>
                    <th class="px-6 py-3 font-semibold">E-mail</th>
                    <th class="px-6 py-3 font-semibold">Telefone</th>
                    <th class="px-6 py-3 text-center font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5 text-sm">
                  @if (clientesFiltrados().length) {
                    @for (cliente of clientesFiltrados(); track cliente.id) {
                      <tr class="transition hover:bg-white/5">
                        <td class="px-6 py-4 font-medium text-white">{{ cliente.nome }}</td>
                        <td class="px-6 py-4 text-slate-200">{{ cliente.email }}</td>
                        <td class="px-6 py-4 text-slate-200">{{ cliente.telefone }}</td>
                        <td class="px-6 py-4 text-center">
                          <div class="flex flex-wrap justify-center gap-2">
                            <button
                              class="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold text-slate-100 transition hover:bg-white/20"
                              (click)="verDetalhes(cliente)"
                            >
                              Detalhes
                            </button>
                            <button
                              class="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-1.5 text-xs font-semibold text-white shadow shadow-slate-950/40 transition hover:from-sky-400 hover:to-indigo-400"
                              (click)="editarCliente(cliente)"
                            >
                              Editar
                            </button>
                          </div>
                        </td>
                      </tr>
                    }
                  } @else {
                    <tr>
                      <td colspan="4" class="px-6 py-6 text-center text-sm text-slate-300">Nenhum cliente encontrado.</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        @if (modoVisualizacao() === 'formulario') {
          <form class="grid gap-5 md:grid-cols-2" (ngSubmit)="salvarCliente()">
            <label class="md:col-span-2 flex flex-col text-sm text-slate-200">
              Nome completo
              <input
                class="mt-2 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-400 shadow-inner shadow-slate-950/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                name="nome"
                [(ngModel)]="formulario.nome"
                required
              />
            </label>

            <label class="flex flex-col text-sm text-slate-200">
              E-mail
              <input
                class="mt-2 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-400 shadow-inner shadow-slate-950/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                type="email"
                name="email"
                [(ngModel)]="formulario.email"
                required
              />
            </label>

            <label class="flex flex-col text-sm text-slate-200">
              Telefone
              <input
                class="mt-2 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-400 shadow-inner shadow-slate-950/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                name="telefone"
                [(ngModel)]="formulario.telefone"
                required
              />
            </label>

            <div class="md:col-span-2 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                class="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                (click)="voltarParaLista()"
              >
                Cancelar
              </button>
              @if (editandoId()) {
                <button
                  type="button"
                  class="rounded-full border border-rose-400/60 bg-rose-500/10 px-5 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20"
                  (click)="excluirCliente()"
                >
                  Excluir cliente
                </button>
              }
              <button
                type="submit"
                class="rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-950/40 transition hover:from-sky-400 hover:to-indigo-400"
              >
                {{ editandoId() ? 'Atualizar cliente' : 'Salvar cliente' }}
              </button>
            </div>
          </form>
        }

        @if (modoVisualizacao() === 'detalhes' && clienteSelecionado()) {
          <div class="space-y-6">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 class="text-lg font-semibold text-white">Resumo do cliente</h3>
                <p class="text-sm text-slate-300/80">Informações cadastrais e veículos vinculados.</p>
              </div>
              <button class="text-sm font-medium text-sky-300 transition hover:text-sky-200" (click)="voltarParaLista()">
                Voltar para a lista
              </button>
            </div>

            <div class="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200 md:grid-cols-2">
              <div>
                <span class="block text-xs font-semibold uppercase tracking-wide text-slate-400">Nome</span>
                <span class="text-base text-white">{{ clienteSelecionado()!.nome }}</span>
              </div>
              <div>
                <span class="block text-xs font-semibold uppercase tracking-wide text-slate-400">E-mail</span>
                <span class="text-base text-white">{{ clienteSelecionado()!.email }}</span>
              </div>
              <div>
                <span class="block text-xs font-semibold uppercase tracking-wide text-slate-400">Telefone</span>
                <span class="text-base text-white">{{ clienteSelecionado()!.telefone }}</span>
              </div>
              <div>
                <span class="block text-xs font-semibold uppercase tracking-wide text-slate-400">Veículos cadastrados</span>
                <span class="text-base">{{ veiculosDoCliente().length }}</span>
              </div>
            </div>

            <div class="rounded-2xl border border-white/10 bg-white/5 p-5">
              <h4 class="text-sm font-semibold uppercase tracking-wider text-slate-200">Veículos do cliente</h4>
              <ul class="mt-3 space-y-2 text-sm text-slate-200">
                @if (veiculosDoCliente().length) {
                  @for (veiculo of veiculosDoCliente(); track veiculo.id) {
                    <li class="flex flex-col gap-1 rounded-xl bg-slate-900/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <span>{{ veiculo.marca }} {{ veiculo.modelo }} ({{ veiculo.placa }})</span>
                      <span class="text-xs text-slate-300">Ano {{ veiculo.ano }}</span>
                    </li>
                  }
                } @else {
                  <li class="text-slate-400">Nenhum veículo cadastrado para este cliente.</li>
                }
              </ul>
            </div>
          </div>
        }
      </div>
    </section>
  `,
})
export class ClientesComponent {
  private dataService = inject(DataService);

  clientes = this.dataService.clientes;
  veiculos = this.dataService.veiculos;

  modoVisualizacao = signal<'lista' | 'formulario' | 'detalhes'>('lista');
  editandoId = signal<number | null>(null);
  clienteSelecionadoId = signal<number | null>(null);
  filtroBusca = signal('');

  clientesFiltrados = computed(() => {
    const termo = this.filtroBusca().trim().toLowerCase();
    if (!termo) {
      return this.clientes();
    }
    return this.clientes().filter(cliente => {
      const nome = cliente.nome.toLowerCase();
      const email = cliente.email?.toLowerCase() ?? '';
      const telefone = cliente.telefone?.toLowerCase() ?? '';
      return nome.includes(termo) || email.includes(termo) || telefone.includes(termo);
    });
  });

  formulario = {
    nome: '',
    email: '',
    telefone: '',
  };

  clienteSelecionado = computed(() => {
    const id = this.clienteSelecionadoId();
    if (id == null) {
      return undefined;
    }
    return this.clientes().find(cliente => cliente.id === id);
  });

  veiculosDoCliente = computed(() => {
    if (!this.clienteSelecionado()) {
      return [];
    }
    return this.veiculos().filter(veiculo => veiculo.clienteId === this.clienteSelecionado()!.id);
  });

  atualizarFiltro(valor: string) {
    this.filtroBusca.set(valor);
  }

  abrirFormularioNovo() {
    this.editandoId.set(null);
    this.formulario = {
      nome: '',
      email: '',
      telefone: '',
    };
    this.modoVisualizacao.set('formulario');
  }

  editarCliente(cliente: Cliente) {
    this.editandoId.set(cliente.id);
    this.formulario = {
      nome: cliente.nome,
      email: cliente.email || '',
      telefone: cliente.telefone || '',
    };
    this.modoVisualizacao.set('formulario');
  }

  verDetalhes(cliente: Cliente) {
    this.clienteSelecionadoId.set(cliente.id);
    this.modoVisualizacao.set('detalhes');
  }

  async salvarCliente() {
    if (!this.formulario.nome || !this.formulario.email || !this.formulario.telefone) {
      return;
    }

    const dadosNormalizados = {
      nome: this.formulario.nome.trim(),
      email: this.formulario.email.trim() || undefined,
      telefone: this.formulario.telefone.trim() || undefined,
    };

    try {
      if (this.editandoId()) {
        await this.dataService.atualizarCliente(this.editandoId()!, dadosNormalizados);
      } else {
        await this.dataService.criarCliente(dadosNormalizados);
      }
      this.voltarParaLista();
    } catch (error) {
      console.error('Erro ao salvar cliente', error);
    }
  }

  async excluirCliente() {
    if (!this.editandoId()) {
      return;
    }

    const confirmar = window.confirm('Deseja realmente excluir este cliente? Os veículos e ordens associadas serão removidos.');
    if (!confirmar) {
      return;
    }

    try {
      await this.dataService.excluirCliente(this.editandoId()!);
      this.voltarParaLista();
    } catch (error) {
      console.error('Erro ao excluir cliente', error);
    }
  }

  voltarParaLista() {
    this.modoVisualizacao.set('lista');
    this.editandoId.set(null);
    this.clienteSelecionadoId.set(null);
  }
}
