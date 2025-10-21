
import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DataService } from '../core/services/data.service';
import { OrdemServico } from '../core/models/models';

interface ItemSelecionado {
  id: number | undefined;
  qtde: number;
}

interface FormularioOrdem {
  clienteId: number | undefined;
  veiculoId: number | undefined;
  dataEntrada: string;
  status: 'Em Andamento' | 'Aguardando Aprovação' | 'Finalizada' | 'Cancelada' | undefined;
  observacoes: string;
  servicos: ItemSelecionado[];
  pecas: ItemSelecionado[];
}

@Component({
  selector: 'app-ordens-servico',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="rounded-3xl border border-white/10 bg-slate-900/50 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur sm:p-8">
      <div class="flex flex-col gap-6">
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.45em] text-sky-300/70">Operações</p>
            <h2 class="text-2xl font-semibold text-white">Gerenciar Ordens de Serviço</h2>
            <p class="text-sm text-slate-300/80">
              Acompanhe solicitações, status, itens e valores para manter a oficina sob controle.
            </p>
          </div>

          @if (modoVisualizacao() === 'lista') {
            <div class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              <label class="relative flex w-full items-center sm:w-72">
                <svg class="absolute left-4 h-4 w-4 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m21 21-4.35-4.35M18 10.5a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" /></svg>
                <input
                  type="search"
                  class="w-full rounded-full border border-white/10 bg-slate-900/60 py-2 pl-11 pr-4 text-sm text-slate-100 placeholder:text-slate-400 shadow-inner shadow-slate-950/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                  placeholder="Buscar por cliente, placa, status ou nº da OS"
                  [ngModel]="filtroBusca()"
                  (ngModelChange)="atualizarFiltro($event)"
                />
              </label>

              <button
                class="w-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:from-emerald-300 hover:via-teal-300 hover:to-sky-400 focus:outline-none focus:ring-2 focus:ring-emerald-300/60 sm:w-auto"
                (click)="abrirFormulario()"
              >
                + Nova ordem de serviço
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
                    <th class="px-6 py-3 font-semibold">OS</th>
                    <th class="px-6 py-3 font-semibold">Cliente</th>
                    <th class="px-6 py-3 font-semibold">Veículo</th>
                    <th class="px-6 py-3 font-semibold">Status</th>
                    <th class="px-6 py-3 text-right font-semibold">Total</th>
                    <th class="px-6 py-3 text-center font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5 text-sm">
                  @if (ordensFiltradas().length) {
                    @for (item of ordensFiltradas(); track item.ordem.id) {
                      <tr class="transition hover:bg-white/5">
                        <td class="whitespace-nowrap px-6 py-4 font-semibold text-sky-300">#{{ item.ordem.id }}</td>
                        <td class="px-6 py-4">{{ item.cliente?.nome || 'Cliente removido' }}</td>
                        <td class="px-6 py-4">
                          @if (item.veiculo) {
                            {{ item.veiculo.marca }} {{ item.veiculo.modelo }} ({{ item.veiculo.placa }})
                          } @else {
                            <span class="text-slate-400">Veículo removido</span>
                          }
                        </td>
                        <td class="px-6 py-4">
                          <span class="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100">
                            {{ item.ordem.status }}
                          </span>
                        </td>
                        <td class="px-6 py-4 text-right font-semibold text-emerald-300">{{ item.totalGeral | currency:'BRL' }}</td>
                        <td class="px-6 py-4 text-center">
                          <div class="flex flex-wrap justify-center gap-2">
                            <button
                              class="inline-flex items-center justify-center rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-slate-100 transition hover:bg-white/20"
                              (click)="verResumo(item.ordem.id)"
                            >
                              Resumo rápido
                            </button>
                            <button
                              class="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold text-slate-100 transition hover:bg-white/20"
                              (click)="editarOrdem(item.ordem)"
                            >
                              Editar
                            </button>
                            <a
                              class="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-1.5 text-xs font-semibold text-white shadow shadow-slate-950/40 transition hover:from-sky-400 hover:to-indigo-400"
                              [routerLink]="['/ordens-servico', item.ordem.id]"
                              target="_blank"
                              rel="noopener"
                            >
                              Imprimir
                            </a>
                          </div>
                        </td>
                      </tr>
                    }
                  } @else {
                    <tr>
                      <td colspan="6" class="px-6 py-6 text-center text-sm text-slate-300">
                        Nenhuma ordem encontrada para os critérios informados.
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        @if (modoVisualizacao() === 'formulario') {
          <div class="space-y-6">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 class="text-lg font-semibold text-white">
                  {{ editandoId() ? 'Editar ordem de serviço' : 'Nova ordem de serviço' }}
                </h3>
                <p class="text-sm text-slate-300/80">
                  Vincule cliente, veículo, serviços e peças utilizados nesta solicitação.
                </p>
              </div>
              <div class="flex flex-wrap gap-2">
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
                    (click)="excluirOrdem()"
                  >
                    Excluir ordem
                  </button>
                }
              </div>
            </div>

            <form class="grid gap-5 md:grid-cols-2" (ngSubmit)="salvarOrdem()">
              <label class="flex flex-col text-sm text-slate-200">
                Cliente
                <select
                  class="mt-2 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 shadow-inner shadow-slate-950/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                  [(ngModel)]="formularioOrdem.clienteId"
                  (ngModelChange)="aoAlterarCliente($event)"
                  name="clienteId"
                  required
                >
                  <option [ngValue]="undefined" disabled>Selecione um cliente</option>
                  @for (cliente of clientes(); track cliente.id) {
                    <option class="bg-slate-900" [ngValue]="cliente.id">{{ cliente.nome }}</option>
                  }
                </select>
              </label>

              <label class="flex flex-col text-sm text-slate-200">
                Veículo
                <select
                  class="mt-2 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 shadow-inner shadow-slate-950/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                  [(ngModel)]="formularioOrdem.veiculoId"
                  name="veiculoId"
                  required
                >
                  <option [ngValue]="undefined" disabled>Selecione um veículo</option>
                  @for (veiculo of veiculosDisponiveis(); track veiculo?.id) {
                    <option class="bg-slate-900" [ngValue]="veiculo?.id">{{ veiculo?.placa }} - {{ veiculo?.marca }} {{ veiculo?.modelo }}</option>
                  }
                </select>
              </label>

              <label class="flex flex-col text-sm text-slate-200">
                Data de entrada
                <input
                  type="date"
                  class="mt-2 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-400 shadow-inner shadow-slate-950/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                  [(ngModel)]="formularioOrdem.dataEntrada"
                  name="dataEntrada"
                  required
                />
              </label>

              <label class="flex flex-col text-sm text-slate-200">
                Status
                <select
                  class="mt-2 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 shadow-inner shadow-slate-950/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                  [(ngModel)]="formularioOrdem.status"
                  name="status"
                  required
                >
                  <option [ngValue]="undefined" disabled>Selecione</option>
                  <option class="bg-slate-900" value="Em Andamento">Em andamento</option>
                  <option class="bg-slate-900" value="Aguardando Aprovação">Aguardando aprovação</option>
                  <option class="bg-slate-900" value="Finalizada">Finalizada</option>
                  <option class="bg-slate-900" value="Cancelada">Cancelada</option>
                </select>
              </label>

              <label class="md:col-span-2 flex flex-col text-sm text-slate-200">
                Observações
                <textarea
                  rows="4"
                  class="mt-2 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-400 shadow-inner shadow-slate-950/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                  [(ngModel)]="formularioOrdem.observacoes"
                  name="observacoes"
                  placeholder="Inclua detalhes adicionais, diagnósticos ou autorizações"
                ></textarea>
              </label>

              <div class="md:col-span-2 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <h4 class="text-sm font-semibold uppercase tracking-wider text-slate-200">Serviços aplicados</h4>
                  <button type="button" class="rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-semibold text-slate-100 transition hover:bg-white/20" (click)="adicionarServico()">
                    + Adicionar serviço
                  </button>
                </div>

                @if (formularioOrdem.servicos.length) {
                  <div class="space-y-3">
                    @for (item of formularioOrdem.servicos; track $index; let index = $index) {
                      <div class="grid gap-3 rounded-2xl bg-slate-900/40 p-4 sm:grid-cols-[minmax(0,1fr)_120px_40px] sm:items-end">
                        <label class="flex flex-col text-sm text-slate-200 sm:col-span-1">
                          <span class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Serviço</span>
                          <select
                            class="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 shadow-inner shadow-slate-950/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                            [ngModel]="item.id"
                            (ngModelChange)="atualizarServicoSelecionado(index, $event)"
                          >
                            <option [ngValue]="undefined" disabled>Selecione</option>
                            @for (servico of servicos(); track servico.id) {
                              <option class="bg-slate-900" [ngValue]="servico.id">{{ servico.descricao }} — {{ servico.preco | currency:'BRL' }}</option>
                            }
                          </select>
                        </label>

                        <label class="flex flex-col text-sm text-slate-200">
                          <span class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Quantidade</span>
                          <input
                            type="number"
                            min="1"
                            class="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 shadow-inner shadow-slate-950/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                            [ngModel]="item.qtde"
                            (ngModelChange)="atualizarQuantidadeServico(index, $event)"
                          />
                        </label>

                        <button type="button" class="mt-2 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-slate-200 transition hover:bg-white/15 sm:mt-0" (click)="removerServico(index)">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 18 6m0 12L6 6" /></svg>
                        </button>
                      </div>
                    }
                  </div>
                } @else {
                  <p class="text-sm text-slate-300">Nenhum serviço adicionado. Utilize o botão acima para incluir.</p>
                }
              </div>

              <div class="md:col-span-2 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <h4 class="text-sm font-semibold uppercase tracking-wider text-slate-200">Peças utilizadas</h4>
                  <button type="button" class="rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-semibold text-slate-100 transition hover:bg-white/20" (click)="adicionarPeca()">
                    + Adicionar peça
                  </button>
                </div>

                @if (formularioOrdem.pecas.length) {
                  <div class="space-y-3">
                    @for (item of formularioOrdem.pecas; track $index; let index = $index) {
                      <div class="grid gap-3 rounded-2xl bg-slate-900/40 p-4 sm:grid-cols-[minmax(0,1fr)_120px_40px] sm:items-end">
                        <label class="flex flex-col text-sm text-slate-200 sm:col-span-1">
                          <span class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Peça</span>
                          <select
                            class="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 shadow-inner shadow-slate-950/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                            [ngModel]="item.id"
                            (ngModelChange)="atualizarPecaSelecionada(index, $event)"
                          >
                            <option [ngValue]="undefined" disabled>Selecione</option>
                            @for (peca of pecas(); track peca.id) {
                              <option class="bg-slate-900" [ngValue]="peca.id">{{ peca.nome }} — {{ peca.preco | currency:'BRL' }}</option>
                            }
                          </select>
                        </label>

                        <label class="flex flex-col text-sm text-slate-200">
                          <span class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Quantidade</span>
                          <input
                            type="number"
                            min="1"
                            class="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 shadow-inner shadow-slate-950/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                            [ngModel]="item.qtde"
                            (ngModelChange)="atualizarQuantidadePeca(index, $event)"
                          />
                        </label>

                        <button type="button" class="mt-2 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-slate-200 transition hover:bg-white/15 sm:mt-0" (click)="removerPeca(index)">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 18 6m0 12L6 6" /></svg>
                        </button>
                      </div>
                    }
                  </div>
                } @else {
                  <p class="text-sm text-slate-300">Nenhuma peça adicionada até o momento.</p>
                }
              </div>

              <div class="md:col-span-2 grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200 sm:grid-cols-3">
                <div class="flex flex-col rounded-2xl bg-slate-900/40 p-4">
                  <span class="text-xs font-semibold uppercase tracking-wide text-slate-400">Total de serviços</span>
                  <span class="mt-2 text-xl font-semibold text-emerald-300">{{ calcularTotalServicosSelecionados() | currency:'BRL' }}</span>
                </div>
                <div class="flex flex-col rounded-2xl bg-slate-900/40 p-4">
                  <span class="text-xs font-semibold uppercase tracking-wide text-slate-400">Total de peças</span>
                  <span class="mt-2 text-xl font-semibold text-sky-300">{{ calcularTotalPecasSelecionadas() | currency:'BRL' }}</span>
                </div>
                <div class="flex flex-col rounded-2xl bg-slate-900/40 p-4">
                  <span class="text-xs font-semibold uppercase tracking-wide text-slate-400">Valor estimado</span>
                  <span class="mt-2 text-xl font-semibold text-white">{{ calcularTotalAtual() | currency:'BRL' }}</span>
                </div>
              </div>

              <div class="md:col-span-2 flex flex-wrap justify-end gap-3">
                <button
                  type="submit"
                  class="rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-950/40 transition hover:from-sky-400 hover:to-indigo-400"
                >
                  {{ editandoId() ? 'Atualizar ordem' : 'Salvar ordem' }}
                </button>
              </div>
            </form>
          </div>
        }

        @if (modoVisualizacao() === 'resumo' && detalhesOrdemSelecionada(); as detalhes) {
          <div class="space-y-6">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 class="text-lg font-semibold text-white">Resumo da ordem #{{ detalhes.ordem.id }}</h3>
                <p class="text-sm text-slate-300/80">Panorama completo de serviços, peças e valores aplicados.</p>
              </div>
              <div class="flex flex-wrap gap-2">
                <button class="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:bg-white/20" (click)="editarOrdem(detalhes.ordem)">
                  Editar ordem
                </button>
                <button class="rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow shadow-slate-950/40 transition hover:from-sky-400 hover:to-indigo-400" (click)="abrirResumoCompleto()">
                  Imprimir resumo
                </button>
              </div>
            </div>

            <div class="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200 md:grid-cols-2">
              <div>
                <span class="block text-xs font-semibold uppercase tracking-wide text-slate-400">Cliente</span>
                <span class="text-base text-white">{{ detalhes.cliente?.nome || 'Cliente removido' }}</span>
              </div>
              <div>
                <span class="block text-xs font-semibold uppercase tracking-wide text-slate-400">Veículo</span>
                <span class="text-base text-white">
                  @if (detalhes.veiculo) {
                    {{ detalhes.veiculo.marca }} {{ detalhes.veiculo.modelo }} ({{ detalhes.veiculo.placa }})
                  } @else {
                    Veículo removido
                  }
                </span>
              </div>
              <div>
                <span class="block text-xs font-semibold uppercase tracking-wide text-slate-400">Data de entrada</span>
                <span class="text-base">{{ detalhes.ordem.dataEntrada | date:'dd/MM/yyyy' }}</span>
              </div>
              <div>
                <span class="block text-xs font-semibold uppercase tracking-wide text-slate-400">Status</span>
                <span class="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100">
                  {{ detalhes.ordem.status }}
                </span>
              </div>
              <div class="md:col-span-2">
                <span class="block text-xs font-semibold uppercase tracking-wide text-slate-400">Observações</span>
                <p class="mt-1 text-base text-slate-200/90">{{ detalhes.ordem.observacoes || 'Sem observações registradas.' }}</p>
              </div>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <div class="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h4 class="text-sm font-semibold uppercase tracking-wider text-slate-200">Serviços</h4>
                <ul class="mt-3 space-y-2 text-sm text-slate-200">
                  @if (detalhes.servicos.length) {
                    @for (servico of detalhes.servicos; track servico.id) {
                      <li class="flex items-center justify-between rounded-xl bg-slate-900/50 px-4 py-2">
                        <div>
                          <p class="font-medium text-white">{{ servico.descricao || 'Serviço removido' }}</p>
                          <p class="text-xs text-slate-300">Qtde {{ servico.qtde }} × {{ servico.preco | currency:'BRL' }}</p>
                        </div>
                        <span class="text-sm font-semibold text-emerald-300">{{ servico.subtotal | currency:'BRL' }}</span>
                      </li>
                    }
                  } @else {
                    <li class="text-slate-400">Nenhum serviço vinculado.</li>
                  }
                </ul>
              </div>
              <div class="rounded-2xl border border-white/10 bg-white/5 p-5">
                <h4 class="text-sm font-semibold uppercase tracking-wider text-slate-200">Peças</h4>
                <ul class="mt-3 space-y-2 text-sm text-slate-200">
                  @if (detalhes.pecas.length) {
                    @for (peca of detalhes.pecas; track peca.id) {
                      <li class="flex items-center justify-between rounded-xl bg-slate-900/50 px-4 py-2">
                        <div>
                          <p class="font-medium text-white">{{ peca.nome || 'Peça removida' }}</p>
                          <p class="text-xs text-slate-300">Qtde {{ peca.qtde }} × {{ peca.preco | currency:'BRL' }}</p>
                        </div>
                        <span class="text-sm font-semibold text-sky-300">{{ peca.subtotal | currency:'BRL' }}</span>
                      </li>
                    }
                  } @else {
                    <li class="text-slate-400">Nenhuma peça vinculada.</li>
                  }
                </ul>
              </div>
            </div>

            <div class="ml-auto w-full max-w-md space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm">
              <div class="flex justify-between text-slate-200">
                <span>Total de serviços</span>
                <span class="font-semibold">{{ detalhes.totalServicos | currency:'BRL' }}</span>
              </div>
              <div class="flex justify-between text-slate-200">
                <span>Total de peças</span>
                <span class="font-semibold">{{ detalhes.totalPecas | currency:'BRL' }}</span>
              </div>
              <div class="flex justify-between border-t border-white/10 pt-3 text-base">
                <span class="font-semibold text-white">Valor total</span>
                <span class="font-bold text-emerald-300">{{ detalhes.totalGeral | currency:'BRL' }}</span>
              </div>
            </div>
          </div>
        }
      </div>
    </section>
  `,
})
export class OrdensServicoComponent {
  private dataService = inject(DataService);
  private router = inject(Router);

  ordensServico = this.dataService.ordensServico;
  veiculos = this.dataService.veiculos;
  clientes = this.dataService.clientes;
  servicos = this.dataService.servicos;
  pecas = this.dataService.pecas;

  modoVisualizacao = signal<'lista' | 'formulario' | 'resumo'>('lista');
  ordemSelecionadaId = signal<number | null>(null);
  filtroBusca = signal('');
  editandoId = signal<number | null>(null);

  formularioOrdem: FormularioOrdem = this.criarFormularioInicial();

  ordensDetalhadas = computed(() => {
    const ordens = this.ordensServico();
    const clientes = this.clientes();
    const veiculos = this.veiculos();
    const servicos = this.servicos();
    const pecas = this.pecas();

    return ordens.map(ordem => {
      const cliente = clientes.find(item => item.id === ordem.clienteId);
      const veiculo = veiculos.find(item => item.id === ordem.veiculoId);
      const totalServicos = ordem.servicos.reduce((total, item) => {
        const servico = servicos.find(serv => serv.id === item.id);
        return total + (servico?.preco ?? 0) * item.qtde;
      }, 0);
      const totalPecas = ordem.pecas.reduce((total, item) => {
        const peca = pecas.find(pec => pec.id === item.id);
        return total + (peca?.preco ?? 0) * item.qtde;
      }, 0);
      return {
        ordem,
        cliente,
        veiculo,
        totalServicos,
        totalPecas,
        totalGeral: totalServicos + totalPecas,
      };
    });
  });

  ordensFiltradas = computed(() => {
    const termo = this.filtroBusca().trim().toLowerCase();
    if (!termo) {
      return this.ordensDetalhadas();
    }

    return this.ordensDetalhadas().filter(item => {
      const termoId = `#${item.ordem.id}`.toLowerCase().includes(termo) || String(item.ordem.id).includes(termo);
      const termoCliente = item.cliente?.nome.toLowerCase().includes(termo) ?? false;
      const termoStatus = item.ordem.status.toLowerCase().includes(termo);
      const termoPlaca = item.veiculo?.placa.toLowerCase().includes(termo) ?? false;
      const termoVeiculo = `${item.veiculo?.marca ?? ''} ${item.veiculo?.modelo ?? ''}`.toLowerCase().includes(termo);
      return termoId || termoCliente || termoStatus || termoPlaca || termoVeiculo;
    });
  });

  ordemSelecionada = computed(() => {
    const id = this.ordemSelecionadaId();
    if (id == null) {
      return undefined;
    }
    return this.dataService.getOrdemServicoById(id);
  });

  detalhesOrdemSelecionada = computed(() => {
    const ordem = this.ordemSelecionada();
    if (!ordem) {
      return null;
    }

    const veiculo = this.veiculos().find(item => item.id === ordem.veiculoId);
    const cliente = this.clientes().find(item => item.id === ordem.clienteId);

    let totalServicos = 0;
    const servicosDetalhados = ordem.servicos.map(item => {
      const servico = this.servicos().find(serv => serv.id === item.id);
      const preco = servico?.preco ?? 0;
      const subtotal = preco * item.qtde;
      totalServicos += subtotal;
      return {
        id: item.id,
        descricao: servico?.descricao ?? null,
        preco,
        qtde: item.qtde,
        subtotal,
      };
    });

    let totalPecas = 0;
    const pecasDetalhadas = ordem.pecas.map(item => {
      const peca = this.pecas().find(p => p.id === item.id);
      const preco = peca?.preco ?? 0;
      const subtotal = preco * item.qtde;
      totalPecas += subtotal;
      return {
        id: item.id,
        nome: peca?.nome ?? null,
        preco,
        qtde: item.qtde,
        subtotal,
      };
    });

    return {
      ordem,
      veiculo,
      cliente,
      servicos: servicosDetalhados,
      pecas: pecasDetalhadas,
      totalServicos,
      totalPecas,
      totalGeral: totalServicos + totalPecas,
    };
  });

  atualizarFiltro(valor: string) {
    this.filtroBusca.set(valor);
  }

  abrirFormulario() {
    this.editandoId.set(null);
    this.formularioOrdem = this.criarFormularioInicial();
    this.modoVisualizacao.set('formulario');
    this.ordemSelecionadaId.set(null);
  }

  editarOrdem(ordem: OrdemServico) {
    this.editandoId.set(ordem.id);
    this.formularioOrdem = {
      clienteId: ordem.clienteId,
      veiculoId: ordem.veiculoId,
      dataEntrada: ordem.dataEntrada,
      status: ordem.status,
      observacoes: ordem.observacoes || '',
      servicos: ordem.servicos.length ? ordem.servicos.map(item => ({ id: item.id, qtde: item.qtde })) : [this.criarItemSelecionado()],
      pecas: ordem.pecas.length ? ordem.pecas.map(item => ({ id: item.id, qtde: item.qtde })) : [],
    };
    this.modoVisualizacao.set('formulario');
    this.ordemSelecionadaId.set(null);
  }

  verResumo(id: number) {
    this.ordemSelecionadaId.set(id);
    this.modoVisualizacao.set('resumo');
    this.editandoId.set(null);
  }

  voltarParaLista() {
    this.modoVisualizacao.set('lista');
    this.ordemSelecionadaId.set(null);
    this.editandoId.set(null);
  }

  aoAlterarCliente(clienteId: number | undefined) {
    const veiculosValidos = clienteId
      ? this.veiculos().filter(veiculo => veiculo.clienteId === clienteId)
      : this.veiculos();
    const veiculoAtual = this.formularioOrdem.veiculoId;
    const veiculoValido = veiculosValidos.some(veiculo => veiculo.id === veiculoAtual)
      ? veiculoAtual
      : undefined;
    this.formularioOrdem = { ...this.formularioOrdem, clienteId, veiculoId: veiculoValido };
  }

  veiculosDisponiveis() {
    if (!this.formularioOrdem.clienteId) {
      return this.veiculos();
    }
    return this.veiculos().filter(veiculo => veiculo.clienteId === this.formularioOrdem.clienteId);
  }

  adicionarServico() {
    const servicos = [...this.formularioOrdem.servicos, this.criarItemSelecionado()];
    this.formularioOrdem = { ...this.formularioOrdem, servicos };
  }

  atualizarServicoSelecionado(index: number, id: number | undefined) {
    const servicos = this.formularioOrdem.servicos.map((item, idx) =>
      idx === index ? { ...item, id } : item
    );
    this.formularioOrdem = { ...this.formularioOrdem, servicos };
  }

  atualizarQuantidadeServico(index: number, quantidade: number) {
    const valor = Math.max(1, Math.trunc(Number(quantidade) || 1));
    const servicos = this.formularioOrdem.servicos.map((item, idx) =>
      idx === index ? { ...item, qtde: valor } : item
    );
    this.formularioOrdem = { ...this.formularioOrdem, servicos };
  }

  removerServico(index: number) {
    const servicos = this.formularioOrdem.servicos.filter((_, idx) => idx !== index);
    this.formularioOrdem = { ...this.formularioOrdem, servicos };
  }

  adicionarPeca() {
    const pecas = [...this.formularioOrdem.pecas, this.criarItemSelecionado()];
    this.formularioOrdem = { ...this.formularioOrdem, pecas };
  }

  atualizarPecaSelecionada(index: number, id: number | undefined) {
    const pecas = this.formularioOrdem.pecas.map((item, idx) =>
      idx === index ? { ...item, id } : item
    );
    this.formularioOrdem = { ...this.formularioOrdem, pecas };
  }

  atualizarQuantidadePeca(index: number, quantidade: number) {
    const valor = Math.max(1, Math.trunc(Number(quantidade) || 1));
    const pecas = this.formularioOrdem.pecas.map((item, idx) =>
      idx === index ? { ...item, qtde: valor } : item
    );
    this.formularioOrdem = { ...this.formularioOrdem, pecas };
  }

  removerPeca(index: number) {
    const pecas = this.formularioOrdem.pecas.filter((_, idx) => idx !== index);
    this.formularioOrdem = { ...this.formularioOrdem, pecas };
  }

  calcularTotalServicosSelecionados() {
    return this.formularioOrdem.servicos.reduce((total, item) => {
      if (!item.id) {
        return total;
      }
      const servico = this.servicos().find(serv => serv.id === item.id);
      return total + (servico?.preco ?? 0) * item.qtde;
    }, 0);
  }

  calcularTotalPecasSelecionadas() {
    return this.formularioOrdem.pecas.reduce((total, item) => {
      if (!item.id) {
        return total;
      }
      const peca = this.pecas().find(prod => prod.id === item.id);
      return total + (peca?.preco ?? 0) * item.qtde;
    }, 0);
  }

  calcularTotalAtual() {
    return this.calcularTotalServicosSelecionados() + this.calcularTotalPecasSelecionadas();
  }

  async salvarOrdem() {
    if (
      !this.formularioOrdem.clienteId ||
      !this.formularioOrdem.veiculoId ||
      !this.formularioOrdem.dataEntrada ||
      !this.formularioOrdem.status
    ) {
      return;
    }

    const servicos = this.formularioOrdem.servicos
      .filter(item => item.id && item.qtde > 0)
      .map(item => ({ id: item.id!, qtde: item.qtde }));

    const pecas = this.formularioOrdem.pecas
      .filter(item => item.id && item.qtde > 0)
      .map(item => ({ id: item.id!, qtde: item.qtde }));

    const dados = {
      clienteId: this.formularioOrdem.clienteId,
      veiculoId: this.formularioOrdem.veiculoId,
      dataEntrada: this.formularioOrdem.dataEntrada,
      status: this.formularioOrdem.status!,
      servicos,
      pecas,
      observacoes: this.formularioOrdem.observacoes.trim() || undefined,
    };

    try {
      if (this.editandoId()) {
        await this.dataService.atualizarOrdemServico(this.editandoId()!, dados);
      } else {
        await this.dataService.criarOrdemServico(dados);
      }
      this.voltarParaLista();
    } catch (error) {
      console.error('Erro ao salvar ordem de serviço', error);
    }
  }

  async excluirOrdem() {
    const id = this.editandoId();
    if (!id) {
      return;
    }

    const confirmar = window.confirm('Deseja realmente excluir esta ordem de serviço?');
    if (!confirmar) {
      return;
    }

    try {
      await this.dataService.excluirOrdemServico(id);
      this.voltarParaLista();
    } catch (error) {
      console.error('Erro ao excluir ordem de serviço', error);
    }
  }

  abrirResumoCompleto() {
    const id = this.ordemSelecionadaId();
    if (id == null) {
      return;
    }
    void this.router.navigate(['/ordens-servico', id]);
  }

  private criarFormularioInicial(): FormularioOrdem {
    const hoje = new Date().toISOString().split('T')[0];
    return {
      clienteId: undefined,
      veiculoId: undefined,
      dataEntrada: hoje,
      status: undefined,
      observacoes: '',
      servicos: [this.criarItemSelecionado()],
      pecas: [],
    };
  }

  private criarItemSelecionado(): ItemSelecionado {
    return { id: undefined, qtde: 1 };
  }
}
