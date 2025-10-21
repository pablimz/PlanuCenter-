
import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../core/services/data.service';
import { Veiculo } from '../core/models/models';

@Component({
  selector: 'app-veiculos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="rounded-3xl border border-white/10 bg-slate-900/50 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur sm:p-8">
      <div class="flex flex-col gap-6">
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.45em] text-sky-300/70">Veículos</p>
            <h2 class="text-2xl font-semibold text-white">Cadastro de veículos</h2>
            <p class="text-sm text-slate-300/80">Monitore todos os veículos vinculados à sua carteira de clientes.</p>
          </div>

          @if (modoVisualizacao() === 'lista') {
            <div class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              <label class="relative flex w-full items-center sm:w-72">
                <svg class="absolute left-4 h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-4.35-4.35M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" /></svg>
                <input
                  type="search"
                  class="w-full rounded-full border border-white/10 bg-slate-900/60 py-2 pl-11 pr-4 text-sm text-slate-100 placeholder:text-slate-400 shadow-inner shadow-slate-950/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                  placeholder="Buscar por placa, modelo ou cliente"
                  [ngModel]="filtroBusca()"
                  (ngModelChange)="atualizarFiltro($event)"
                />
              </label>

              <button
                class="w-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:from-emerald-300 hover:via-teal-300 hover:to-sky-400 focus:outline-none focus:ring-2 focus:ring-emerald-300/60 sm:w-auto"
                (click)="abrirFormularioNovo()"
              >
                + Cadastrar veículo
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
                    <th class="px-6 py-3 font-semibold">Placa</th>
                    <th class="px-6 py-3 font-semibold">Marca</th>
                    <th class="px-6 py-3 font-semibold">Modelo</th>
                    <th class="px-6 py-3 font-semibold">Ano</th>
                    <th class="px-6 py-3 font-semibold">Cliente</th>
                    <th class="px-6 py-3 text-center font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5 text-sm">
                  @if (veiculosFiltrados().length) {
                    @for (veiculo of veiculosFiltrados(); track veiculo.id) {
                      <tr class="transition hover:bg-white/5">
                        <td class="px-6 py-4 font-medium text-white">{{ veiculo.placa }}</td>
                        <td class="px-6 py-4 text-slate-200">{{ veiculo.marca }}</td>
                        <td class="px-6 py-4 text-slate-200">{{ veiculo.modelo }}</td>
                        <td class="px-6 py-4 text-slate-200">{{ veiculo.ano }}</td>
                        <td class="px-6 py-4 text-slate-200">{{ veiculo.clienteNome }}</td>
                        <td class="px-6 py-4 text-center">
                          <div class="flex justify-center gap-2">
                            <button
                              class="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold text-slate-100 transition hover:bg-white/20"
                              (click)="editarVeiculo(veiculo)"
                            >
                              Editar
                            </button>
                          </div>
                        </td>
                      </tr>
                    }
                  } @else {
                    <tr>
                      <td colspan="6" class="px-6 py-6 text-center text-sm text-slate-300">Nenhum veículo encontrado.</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        @if (modoVisualizacao() === 'formulario') {
          <form class="grid gap-5 md:grid-cols-2" (ngSubmit)="salvarVeiculo()">
            <label class="flex flex-col text-sm text-slate-200">
              Placa
              <input
                class="mt-2 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-400 shadow-inner shadow-slate-950/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                name="placa"
                [(ngModel)]="formulario.placa"
                required
                placeholder="AAA-0A00"
              />
            </label>

            <label class="flex flex-col text-sm text-slate-200">
              Marca
              <input
                class="mt-2 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-400 shadow-inner shadow-slate-950/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                name="marca"
                [(ngModel)]="formulario.marca"
                required
              />
            </label>

            <label class="flex flex-col text-sm text-slate-200">
              Modelo
              <input
                class="mt-2 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-400 shadow-inner shadow-slate-950/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                name="modelo"
                [(ngModel)]="formulario.modelo"
                required
              />
            </label>

            <label class="flex flex-col text-sm text-slate-200">
              Ano
              <input
                class="mt-2 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-400 shadow-inner shadow-slate-950/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                name="ano"
                [(ngModel)]="formulario.ano"
                required
              />
            </label>

            <label class="md:col-span-2 flex flex-col text-sm text-slate-200">
              Cliente
              <select
                class="mt-2 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 shadow-inner shadow-slate-950/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                name="clienteId"
                [(ngModel)]="formulario.clienteId"
                required
              >
                <option [ngValue]="undefined" disabled>Selecione um cliente</option>
                @for (cliente of clientes(); track cliente.id) {
                  <option class="bg-slate-900" [ngValue]="cliente.id">{{ cliente.nome }}</option>
                }
              </select>
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
                  (click)="excluirVeiculo()"
                >
                  Excluir veículo
                </button>
              }
              <button
                type="submit"
                class="rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-950/40 transition hover:from-sky-400 hover:to-indigo-400"
              >
                {{ editandoId() ? 'Atualizar veículo' : 'Salvar veículo' }}
              </button>
            </div>
          </form>
        }
      </div>
    </section>
  `,
})
export class VeiculosComponent {
  private dataService = inject(DataService);

  veiculos = this.dataService.veiculos;
  clientes = this.dataService.clientes;

  modoVisualizacao = signal<'lista' | 'formulario'>('lista');
  editandoId = signal<number | null>(null);
  filtroBusca = signal('');

  veiculosFiltrados = computed(() => {
    const termo = this.filtroBusca().trim().toLowerCase();
    if (!termo) {
      return this.veiculos();
    }
    return this.veiculos().filter(veiculo => {
      const placa = veiculo.placa.toLowerCase();
      const modelo = `${veiculo.marca} ${veiculo.modelo}`.toLowerCase();
      const cliente = veiculo.clienteNome.toLowerCase();
      return placa.includes(termo) || modelo.includes(termo) || cliente.includes(termo);
    });
  });

  formulario = {
    placa: '',
    marca: '',
    modelo: '',
    ano: '',
    clienteId: undefined as number | undefined,
  };

  atualizarFiltro(valor: string) {
    this.filtroBusca.set(valor);
  }

  abrirFormularioNovo() {
    this.editandoId.set(null);
    this.formulario = {
      placa: '',
      marca: '',
      modelo: '',
      ano: '',
      clienteId: undefined,
    };
    this.modoVisualizacao.set('formulario');
  }

  editarVeiculo(veiculo: Veiculo) {
    this.editandoId.set(veiculo.id);
    this.formulario = {
      placa: veiculo.placa,
      marca: veiculo.marca,
      modelo: veiculo.modelo,
      ano: veiculo.ano,
      clienteId: veiculo.clienteId,
    };
    this.modoVisualizacao.set('formulario');
  }

  async salvarVeiculo() {
    if (!this.formulario.placa || !this.formulario.marca || !this.formulario.modelo || !this.formulario.ano || !this.formulario.clienteId) {
      return;
    }

    const cliente = this.obterClienteSelecionado();
    if (!cliente) {
      return;
    }

    const dados = {
      placa: this.formulario.placa.trim(),
      marca: this.formulario.marca.trim(),
      modelo: this.formulario.modelo.trim(),
      ano: this.formulario.ano.trim(),
      clienteId: cliente.id,
    };

    try {
      if (this.editandoId()) {
        await this.dataService.atualizarVeiculo(this.editandoId()!, dados);
      } else {
        await this.dataService.criarVeiculo(dados);
      }
      this.voltarParaLista();
    } catch (error) {
      console.error('Erro ao salvar veículo', error);
    }
  }

  private obterClienteSelecionado() {
    if (!this.formulario.clienteId) {
      return undefined;
    }
    return this.clientes().find(cliente => cliente.id === this.formulario.clienteId);
  }

  voltarParaLista() {
    this.modoVisualizacao.set('lista');
    this.editandoId.set(null);
  }

  async excluirVeiculo() {
    const id = this.editandoId();
    if (!id) {
      return;
    }

    const confirmar = window.confirm('Deseja realmente excluir este veículo? Ordens associadas serão removidas.');
    if (!confirmar) {
      return;
    }

    try {
      await this.dataService.excluirVeiculo(id);
      this.voltarParaLista();
    } catch (error) {
      console.error('Erro ao excluir veículo', error);
    }
  }
}
