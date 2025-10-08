import { Component, inject, signal } from '@angular/core';
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
            <p class="text-xs font-semibold uppercase tracking-[0.45em] text-sky-300/70">Frota</p>
            <h2 class="text-2xl font-semibold text-white">Cadastro de veículos</h2>
            <p class="text-sm text-slate-300/80">Monitore todos os veículos vinculados à sua carteira de clientes.</p>
          </div>

          @if (modoVisualizacao() === 'lista') {
            <button
              class="w-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:from-emerald-300 hover:via-teal-300 hover:to-sky-400 focus:outline-none focus:ring-2 focus:ring-emerald-300/60 md:w-auto"
              (click)="abrirFormularioNovo()"
            >
              + Cadastrar veículo
            </button>
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
                  @for (veiculo of veiculos(); track veiculo.id) {
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

  formulario = {
    placa: '',
    marca: '',
    modelo: '',
    ano: '',
    clienteId: undefined as number | undefined,
  };

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

  salvarVeiculo() {
    if (!this.formulario.placa || !this.formulario.marca || !this.formulario.modelo || !this.formulario.ano || !this.formulario.clienteId) {
      return;
    }

    const cliente = this.obterClienteSelecionado();
    if (!cliente) {
      return;
    }

    if (this.editandoId()) {
      const idParaAtualizar = this.editandoId()!;
      this.dataService.veiculos.update(lista =>
        lista.map(item =>
          item.id === idParaAtualizar
            ? {
                ...item,
                placa: this.formulario.placa,
                marca: this.formulario.marca,
                modelo: this.formulario.modelo,
                ano: this.formulario.ano,
                clienteId: cliente.id,
                clienteNome: cliente.nome,
              }
            : item,
        ),
      );
    } else {
      const novoId = this.dataService.veiculos().reduce((max, v) => Math.max(max, v.id), 0) + 1;
      this.dataService.veiculos.update(lista => [
        {
          id: novoId,
          placa: this.formulario.placa,
          marca: this.formulario.marca,
          modelo: this.formulario.modelo,
          ano: this.formulario.ano,
          clienteId: cliente.id,
          clienteNome: cliente.nome,
        },
        ...lista,
      ]);
    }

    this.voltarParaLista();
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
}
