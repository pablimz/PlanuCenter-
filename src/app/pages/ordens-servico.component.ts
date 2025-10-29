
import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DataService } from '../core/services/data.service';
import { NotificationService } from '../core/services/notification.service';
import { AutocompleteCriavelComponent, AutocompleteOption, AutocompleteValue } from '../core/components/autocomplete-criavel.component';
import { Cliente, OrdemServico, OrdemServicoPayload, Peca, Servico, Veiculo } from '../core/models/models';
import { calcularTotaisFinanceiros, montarResumoFinanceiroOrdem } from '../core/utils/ordem-financeiro';

type StatusOrdem = OrdemServico['status'];

type SelecaoCriavel<T = unknown> = AutocompleteValue<T>;

interface ItemFormulario<T = unknown> {
  selecao: SelecaoCriavel<T>;
  qtde: number;
  valorUnitario: number;
}

interface FormularioOrdem {
  cliente: SelecaoCriavel<Cliente>;
  veiculo: SelecaoCriavel<Veiculo>;
  dataEntrada: string;
  status: SelecaoCriavel<{ valor: StatusOrdem }>;
  observacoes: string;
  servicos: ItemFormulario<Servico>[];
  pecas: ItemFormulario<Peca>[];
}

@Component({
  selector: 'app-ordens-servico',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, AutocompleteCriavelComponent],
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
                              (click)="editarOrdem(item.ordem.id)"
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
                    class="rounded-full border border-rose-400/60 bg-rose-500/10 px-5 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                    [disabled]="salvando()"
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
                <div class="mt-2">
                  <app-autocomplete-criavel
                    name="cliente"
                    [options]="opcoesClientes()"
                    [(ngModel)]="formularioOrdem.cliente"
                    (ngModelChange)="aoAlterarCliente($event)"
                    placeholder="Selecione ou cadastre um cliente"
                    [invalid]="campoInvalido('cliente')"
                  ></app-autocomplete-criavel>
                </div>
                @if (campoInvalido('cliente')) {
                  <p class="mt-1 text-xs text-rose-300">Informe um cliente.</p>
                }
              </label>

              <label class="flex flex-col text-sm text-slate-200">
                Veículo
                <div class="mt-2">
                  <app-autocomplete-criavel
                    name="veiculo"
                    [options]="opcoesVeiculosDisponiveis()"
                    [(ngModel)]="formularioOrdem.veiculo"
                    (ngModelChange)="aoAlterarVeiculo($event)"
                    placeholder="Informe ou crie um veículo"
                    [invalid]="campoInvalido('veiculo')"
                  ></app-autocomplete-criavel>
                </div>
                @if (campoInvalido('veiculo')) {
                  <p class="mt-1 text-xs text-rose-300">Informe um veículo.</p>
                }
              </label>

              <label class="flex flex-col text-sm text-slate-200">
                Data de entrada
                <input
                  type="date"
                  class="mt-2 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-400 shadow-inner shadow-slate-950/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                  [ngClass]="{'border-rose-500/60 focus:border-rose-400 focus:ring-rose-400/40': campoInvalido('dataEntrada')}"
                  [(ngModel)]="formularioOrdem.dataEntrada"
                  name="dataEntrada"
                  (ngModelChange)="aoAlterarDataEntrada($event)"
                  required
                />
                @if (campoInvalido('dataEntrada')) {
                  <p class="mt-1 text-xs text-rose-300">Informe a data de entrada.</p>
                }
              </label>

              <label class="flex flex-col text-sm text-slate-200">
                Status
                <div class="mt-2">
                  <app-autocomplete-criavel
                    name="status"
                    [options]="statusOptions"
                    [allowCustom]="false"
                    [(ngModel)]="formularioOrdem.status"
                    (ngModelChange)="aoAlterarStatus($event)"
                    placeholder="Selecione um status"
                    [invalid]="campoInvalido('status')"
                  ></app-autocomplete-criavel>
                </div>
                @if (campoInvalido('status')) {
                  <p class="mt-1 text-xs text-rose-300">Selecione um status.</p>
                }
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

              <div
                class="md:col-span-2 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5"
                [ngClass]="{ 'border-rose-500/60': campoInvalido('servicos') }"
              >
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <h4 class="text-sm font-semibold uppercase tracking-wider text-slate-200">Serviços aplicados</h4>
                  <button type="button" class="rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-semibold text-slate-100 transition hover:bg-white/20" (click)="adicionarServico()">
                    + Adicionar serviço
                  </button>
                </div>

                @if (campoInvalido('servicos')) {
                  <p class="text-xs text-rose-300">Inclua ao menos um serviço ou peça.</p>
                }

                @if (formularioOrdem.servicos.length) {
                  <div class="space-y-3">
                    @for (item of formularioOrdem.servicos; track $index; let index = $index) {
                      <div class="grid gap-3 rounded-2xl bg-slate-900/40 p-4 sm:grid-cols-[minmax(0,1fr)_120px_140px_40px] sm:items-end">
                        <label class="flex flex-col text-sm text-slate-200 sm:col-span-1">
                          <span class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Serviço</span>
                          <app-autocomplete-criavel
                            [name]="'servico-' + index"
                            [options]="opcoesServicos()"
                            [ngModel]="item.selecao"
                            (ngModelChange)="atualizarServicoSelecionado(index, $event)"
                            placeholder="Digite ou selecione um serviço"
                          ></app-autocomplete-criavel>
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

                        <label class="flex flex-col text-sm text-slate-200">
                          <span class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Valor unitário</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            class="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 shadow-inner shadow-slate-950/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                            [ngModel]="item.valorUnitario"
                            (ngModelChange)="atualizarValorServico(index, $event)"
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

              <div
                class="md:col-span-2 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5"
                [ngClass]="{ 'border-rose-500/60': campoInvalido('pecas') }"
              >
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <h4 class="text-sm font-semibold uppercase tracking-wider text-slate-200">Peças utilizadas</h4>
                  <button type="button" class="rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-semibold text-slate-100 transition hover:bg-white/20" (click)="adicionarPeca()">
                    + Adicionar peça
                  </button>
                </div>

                @if (campoInvalido('pecas')) {
                  <p class="text-xs text-rose-300">Inclua ao menos um serviço ou peça.</p>
                }

                @if (formularioOrdem.pecas.length) {
                  <div class="space-y-3">
                    @for (item of formularioOrdem.pecas; track $index; let index = $index) {
                      <div class="grid gap-3 rounded-2xl bg-slate-900/40 p-4 sm:grid-cols-[minmax(0,1fr)_120px_140px_40px] sm:items-end">
                        <label class="flex flex-col text-sm text-slate-200 sm:col-span-1">
                          <span class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Peça</span>
                          <app-autocomplete-criavel
                            [name]="'peca-' + index"
                            [options]="opcoesPecas()"
                            [ngModel]="item.selecao"
                            (ngModelChange)="atualizarPecaSelecionada(index, $event)"
                            placeholder="Digite ou selecione uma peça"
                          ></app-autocomplete-criavel>
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

                        <label class="flex flex-col text-sm text-slate-200">
                          <span class="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Valor unitário</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            class="rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 shadow-inner shadow-slate-950/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                            [ngModel]="item.valorUnitario"
                            (ngModelChange)="atualizarValorPeca(index, $event)"
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
                  class="rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-950/40 transition hover:from-sky-400 hover:to-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                  [disabled]="salvando()"
                  [attr.aria-busy]="salvando()"
                >
                  {{ salvando() ? 'Salvando...' : editandoId() ? 'Atualizar ordem' : 'Salvar ordem' }}
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
                <button class="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-slate-100 transition hover:bg-white/20" (click)="editarOrdem(detalhes.ordem.id)">
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
  private notifications = inject(NotificationService);

  ordensServico = this.dataService.ordensServico;
  veiculos = this.dataService.veiculos;
  clientes = this.dataService.clientes;
  servicos = this.dataService.servicos;
  pecas = this.dataService.pecas;

  modoVisualizacao = signal<'lista' | 'formulario' | 'resumo'>('lista');
  ordemSelecionadaId = signal<number | null>(null);
  filtroBusca = signal('');
  editandoId = signal<number | null>(null);
  salvando = signal(false);
  tentouSalvar = signal(false);
  camposInvalidos = signal<ReadonlySet<string>>(new Set<string>());

  formularioOrdem: FormularioOrdem = this.criarFormularioInicial();

  statusOptions: AutocompleteOption<{ valor: StatusOrdem }>[] = [
    { id: 'Em Andamento', label: 'Em Andamento', data: { valor: 'Em Andamento' } },
    { id: 'Aguardando Aprovação', label: 'Aguardando Aprovação', data: { valor: 'Aguardando Aprovação' } },
    { id: 'Finalizada', label: 'Finalizada', data: { valor: 'Finalizada' } },
    { id: 'Cancelada', label: 'Cancelada', data: { valor: 'Cancelada' } },
  ];

  private currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  ordensDetalhadas = computed(() => {
    const ordens = this.ordensServico();
    const clientes = this.clientes();
    const veiculos = this.veiculos();
    const servicos = this.servicos();
    const pecas = this.pecas();

    return ordens.map(ordem => {
      const cliente = clientes.find(item => item.id === ordem.clienteId);
      const veiculo = veiculos.find(item => item.id === ordem.veiculoId);
      const totais = ordem.totais ?? calcularTotaisFinanceiros(ordem, servicos, pecas);
      return {
        ordem,
        cliente,
        veiculo,
        totalServicos: totais.totalServicos,
        totalPecas: totais.totalPecas,
        totalGeral: totais.totalGeral,
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
    const servicosCatalogo = this.servicos();
    const pecasCatalogo = this.pecas();
    const financeiro = montarResumoFinanceiroOrdem(ordem, servicosCatalogo, pecasCatalogo);
    const totais = ordem.totais ?? {
      totalServicos: financeiro.totalServicos,
      totalPecas: financeiro.totalPecas,
      totalGeral: financeiro.totalGeral,
    };

    return {
      ordem,
      veiculo,
      cliente,
      servicos: financeiro.servicos,
      pecas: financeiro.pecas,
      totalServicos: totais.totalServicos,
      totalPecas: totais.totalPecas,
      totalGeral: totais.totalGeral,
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
    this.limparValidacaoCampos();
  }

  async editarOrdem(id: number) {
    try {
      const ordem = await this.dataService.obterOrdemServicoDetalhado(id);
      if (!ordem) {
        return;
      }
      this.editandoId.set(ordem.id);
      this.formularioOrdem = this.criarFormularioAPartirDaOrdem(ordem);
      this.modoVisualizacao.set('formulario');
      this.ordemSelecionadaId.set(null);
      this.limparValidacaoCampos();
    } catch (error) {
      console.error('Erro ao carregar ordem para edição', error);
      this.notifications.error('Não foi possível carregar a ordem selecionada para edição.');
    }
  }

  verResumo(id: number) {
    this.ordemSelecionadaId.set(id);
    this.modoVisualizacao.set('resumo');
    this.editandoId.set(null);
    this.limparValidacaoCampos();
  }

  voltarParaLista() {
    this.modoVisualizacao.set('lista');
    this.ordemSelecionadaId.set(null);
    this.editandoId.set(null);
    this.formularioOrdem = this.criarFormularioInicial();
    this.limparValidacaoCampos();
  }

  aoAlterarCliente(selecao: SelecaoCriavel<Cliente>) {
    const clienteId = this.obterIdNumero(selecao);
    const veiculoAtual = this.formularioOrdem.veiculo;
    const veiculoAjustado = clienteId
      ? veiculoAtual && this.veiculos().some(veiculo => veiculo.id === veiculoAtual?.id && veiculo.clienteId === clienteId)
        ? veiculoAtual
        : null
      : null;
    this.formularioOrdem = { ...this.formularioOrdem, cliente: selecao, veiculo: veiculoAjustado };
    this.removerCampoInvalido('cliente');
  }

  aoAlterarVeiculo(selecao: SelecaoCriavel<Veiculo>) {
    this.formularioOrdem = { ...this.formularioOrdem, veiculo: selecao };
    this.removerCampoInvalido('veiculo');
  }

  aoAlterarStatus(selecao: SelecaoCriavel<{ valor: StatusOrdem }>) {
    this.formularioOrdem = { ...this.formularioOrdem, status: selecao };
    this.removerCampoInvalido('status');
  }

  aoAlterarDataEntrada(valor: string) {
    this.formularioOrdem = { ...this.formularioOrdem, dataEntrada: valor };
    this.removerCampoInvalido('dataEntrada');
  }

  opcoesClientes(): AutocompleteOption<Cliente>[] {
    return this.clientes().map(cliente => ({ id: cliente.id, label: cliente.nome, data: cliente }));
  }

  opcoesVeiculosDisponiveis(): AutocompleteOption<Veiculo>[] {
    const clienteId = this.obterIdNumero(this.formularioOrdem.cliente);
    const lista = clienteId ? this.veiculos().filter(veiculo => veiculo.clienteId === clienteId) : this.veiculos();
    return lista.map(veiculo => ({
      id: veiculo.id,
      label: `${veiculo.placa} - ${veiculo.marca} ${veiculo.modelo}`.trim(),
      data: veiculo,
    }));
  }

  opcoesServicos(): AutocompleteOption<Servico>[] {
    return this.servicos().map(servico => ({
      id: servico.id,
      label: this.formatarServicoLabel(servico),
      data: servico,
    }));
  }

  opcoesPecas(): AutocompleteOption<Peca>[] {
    return this.pecas().map(peca => ({
      id: peca.id,
      label: this.formatarPecaLabel(peca),
      data: peca,
    }));
  }

  adicionarServico() {
    const servicos = [...this.formularioOrdem.servicos, this.criarItemFormulario<Servico>()];
    this.formularioOrdem = { ...this.formularioOrdem, servicos };
    this.atualizarIndicadoresItens();
  }

  atualizarServicoSelecionado(index: number, selecao: SelecaoCriavel<Servico>) {
    const servicos = this.formularioOrdem.servicos.map((item, idx) => {
      if (idx !== index) {
        return item;
      }
      const valorUnitario = selecao?.data?.preco ?? item.valorUnitario;
      return { ...item, selecao, valorUnitario };
    });
    this.formularioOrdem = { ...this.formularioOrdem, servicos };
    this.atualizarIndicadoresItens();
  }

  atualizarQuantidadeServico(index: number, quantidade: number) {
    const valor = Math.max(1, Math.trunc(Number(quantidade) || 1));
    const servicos = this.formularioOrdem.servicos.map((item, idx) =>
      idx === index ? { ...item, qtde: valor } : item
    );
    this.formularioOrdem = { ...this.formularioOrdem, servicos };
    this.atualizarIndicadoresItens();
  }

  atualizarValorServico(index: number, valor: number) {
    const unitario = Math.max(0, Number(valor) || 0);
    const servicos = this.formularioOrdem.servicos.map((item, idx) =>
      idx === index ? { ...item, valorUnitario: unitario } : item
    );
    this.formularioOrdem = { ...this.formularioOrdem, servicos };
    this.atualizarIndicadoresItens();
  }

  removerServico(index: number) {
    const servicos = this.formularioOrdem.servicos.filter((_, idx) => idx !== index);
    this.formularioOrdem = { ...this.formularioOrdem, servicos: servicos.length ? servicos : [this.criarItemFormulario<Servico>()] };
    this.atualizarIndicadoresItens();
  }

  adicionarPeca() {
    const pecas = [...this.formularioOrdem.pecas, this.criarItemFormulario<Peca>()];
    this.formularioOrdem = { ...this.formularioOrdem, pecas };
    this.atualizarIndicadoresItens();
  }

  atualizarPecaSelecionada(index: number, selecao: SelecaoCriavel<Peca>) {
    const pecas = this.formularioOrdem.pecas.map((item, idx) => {
      if (idx !== index) {
        return item;
      }
      const valorUnitario = selecao?.data?.preco ?? item.valorUnitario;
      return { ...item, selecao, valorUnitario };
    });
    this.formularioOrdem = { ...this.formularioOrdem, pecas };
    this.atualizarIndicadoresItens();
  }

  atualizarQuantidadePeca(index: number, quantidade: number) {
    const valor = Math.max(1, Math.trunc(Number(quantidade) || 1));
    const pecas = this.formularioOrdem.pecas.map((item, idx) =>
      idx === index ? { ...item, qtde: valor } : item
    );
    this.formularioOrdem = { ...this.formularioOrdem, pecas };
    this.atualizarIndicadoresItens();
  }

  atualizarValorPeca(index: number, valor: number) {
    const unitario = Math.max(0, Number(valor) || 0);
    const pecas = this.formularioOrdem.pecas.map((item, idx) =>
      idx === index ? { ...item, valorUnitario: unitario } : item
    );
    this.formularioOrdem = { ...this.formularioOrdem, pecas };
    this.atualizarIndicadoresItens();
  }

  removerPeca(index: number) {
    const pecas = this.formularioOrdem.pecas.filter((_, idx) => idx !== index);
    this.formularioOrdem = { ...this.formularioOrdem, pecas };
    this.atualizarIndicadoresItens();
  }

  campoInvalido(nome: string) {
    return this.camposInvalidos().has(nome);
  }

  calcularTotalServicosSelecionados() {
    return this.formularioOrdem.servicos.reduce((total, item) => {
      const valor = Math.max(0, Number(item.valorUnitario) || 0);
      const qtde = Math.max(1, Number(item.qtde) || 1);
      return total + valor * qtde;
    }, 0);
  }

  calcularTotalPecasSelecionadas() {
    return this.formularioOrdem.pecas.reduce((total, item) => {
      const valor = Math.max(0, Number(item.valorUnitario) || 0);
      const qtde = Math.max(1, Number(item.qtde) || 1);
      return total + valor * qtde;
    }, 0);
  }

  calcularTotalAtual() {
    return this.calcularTotalServicosSelecionados() + this.calcularTotalPecasSelecionadas();
  }

  async salvarOrdem() {
    this.tentouSalvar.set(true);
    const avaliacao = this.avaliarFormulario();
    this.atualizarCamposInvalidos(avaliacao.camposInvalidos);

    if (!avaliacao.payload) {
      if (avaliacao.mensagensErro.length) {
        this.notifications.error(avaliacao.mensagensErro.join(' '));
      }
      return;
    }

    this.salvando.set(true);
    try {
      if (this.editandoId()) {
        await this.dataService.atualizarOrdemServico(this.editandoId()!, avaliacao.payload);
        this.notifications.success('Ordem de serviço atualizada com sucesso.');
      } else {
        await this.dataService.criarOrdemServico(avaliacao.payload);
        this.notifications.success('Ordem de serviço criada com sucesso.');
      }
      this.voltarParaLista();
    } catch (error) {
      console.error('Erro ao salvar ordem de serviço', error);
      const mensagem = error instanceof Error ? error.message : 'Não foi possível salvar a ordem de serviço.';
      this.notifications.error(mensagem);
    } finally {
      this.salvando.set(false);
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
      this.salvando.set(true);
      await this.dataService.excluirOrdemServico(id);
      this.notifications.success('Ordem de serviço excluída com sucesso.');
      this.voltarParaLista();
    } catch (error) {
      console.error('Erro ao excluir ordem de serviço', error);
      this.notifications.error('Não foi possível excluir a ordem de serviço.');
    } finally {
      this.salvando.set(false);
    }
  }

  abrirResumoCompleto() {
    const id = this.ordemSelecionadaId();
    if (id == null) {
      return;
    }
    void this.router.navigate(['/ordens-servico', id]);
  }

  private avaliarFormulario(): {
    payload?: OrdemServicoPayload;
    camposInvalidos: string[];
    mensagensErro: string[];
  } {
    const camposInvalidos: string[] = [];
    const mensagensErro: string[] = [];

    const clienteSelecao = this.formularioOrdem.cliente;
    if (!clienteSelecao || !clienteSelecao.label?.trim()) {
      camposInvalidos.push('cliente');
      mensagensErro.push('Informe um cliente.');
    }

    const veiculoSelecao = this.formularioOrdem.veiculo;
    if (!veiculoSelecao || !veiculoSelecao.label?.trim()) {
      camposInvalidos.push('veiculo');
      mensagensErro.push('Informe um veículo.');
    }

    const dataEntrada = this.formularioOrdem.dataEntrada?.trim();
    if (!dataEntrada) {
      camposInvalidos.push('dataEntrada');
      mensagensErro.push('Informe a data de entrada.');
    }

    const statusSelecao = this.formularioOrdem.status;
    const statusValor = statusSelecao?.data?.valor ?? (statusSelecao?.label as StatusOrdem | undefined);
    if (!statusValor) {
      camposInvalidos.push('status');
      mensagensErro.push('Selecione um status válido.');
    }

    const servicos = this.formularioOrdem.servicos
      .filter(item => item.selecao && item.selecao.label?.trim() && item.qtde > 0)
      .map(item => ({
        id: this.obterIdNumero(item.selecao),
        descricao: item.selecao!.data?.descricao ?? item.selecao!.label.trim(),
        preco: Math.max(0, Number(item.valorUnitario) || 0),
        qtde: Math.max(1, Number(item.qtde) || 1),
      }));

    const pecas = this.formularioOrdem.pecas
      .filter(item => item.selecao && item.selecao.label?.trim() && item.qtde > 0)
      .map(item => ({
        id: this.obterIdNumero(item.selecao),
        nome: item.selecao!.data?.nome ?? item.selecao!.label.trim(),
        preco: Math.max(0, Number(item.valorUnitario) || 0),
        qtde: Math.max(1, Number(item.qtde) || 1),
      }));

    if (!servicos.length && !pecas.length) {
      camposInvalidos.push('servicos', 'pecas');
      mensagensErro.push('Inclua ao menos um serviço ou peça.');
    }

    if (mensagensErro.length) {
      return { camposInvalidos, mensagensErro };
    }

    const payload: OrdemServicoPayload = {
      cliente: {
        id: this.obterIdNumero(clienteSelecao!),
        nome: clienteSelecao!.label!.trim(),
      },
      veiculo: this.montarDadosVeiculo(veiculoSelecao!),
      dataEntrada: dataEntrada!,
      status: statusValor!,
      observacoes: this.formularioOrdem.observacoes.trim() || undefined,
      servicos,
      pecas,
    };

    return { payload, camposInvalidos: [], mensagensErro: [] };
  }

  private atualizarCamposInvalidos(campos: string[]) {
    this.camposInvalidos.set(new Set<string>(campos));
  }

  private removerCampoInvalido(nome: string) {
    const atual = this.camposInvalidos();
    if (!atual.has(nome)) {
      return;
    }
    const atualizado = new Set(atual);
    atualizado.delete(nome);
    this.camposInvalidos.set(atualizado);
  }

  private atualizarIndicadoresItens() {
    const possuiServicosValidos = this.formularioOrdem.servicos.some(
      item => item.selecao && item.selecao.label?.trim() && item.qtde > 0,
    );
    const possuiPecasValidas = this.formularioOrdem.pecas.some(
      item => item.selecao && item.selecao.label?.trim() && item.qtde > 0,
    );

    if (possuiServicosValidos || possuiPecasValidas) {
      this.removerCampoInvalido('servicos');
      this.removerCampoInvalido('pecas');
    }
  }

  private limparValidacaoCampos() {
    this.atualizarCamposInvalidos([]);
    this.tentouSalvar.set(false);
  }

  private criarFormularioInicial(): FormularioOrdem {
    const hoje = new Date().toISOString().split('T')[0];
    return {
      cliente: null,
      veiculo: null,
      dataEntrada: hoje,
      status: null,
      observacoes: '',
      servicos: [this.criarItemFormulario<Servico>()],
      pecas: [],
    };
  }

  private criarItemFormulario<T>(): ItemFormulario<T> {
    return { selecao: null, qtde: 1, valorUnitario: 0 };
  }

  private criarFormularioAPartirDaOrdem(ordem: OrdemServico): FormularioOrdem {
    const cliente = this.clientes().find(item => item.id === ordem.clienteId);
    const veiculo = this.veiculos().find(item => item.id === ordem.veiculoId);
    const clienteSelecao: SelecaoCriavel<Cliente> = cliente
      ? { id: cliente.id, label: cliente.nome, data: cliente }
      : { id: ordem.clienteId, label: `Cliente #${ordem.clienteId}` };
    const veiculoSelecao: SelecaoCriavel<Veiculo> = veiculo
      ? { id: veiculo.id, label: `${veiculo.placa} - ${veiculo.marca} ${veiculo.modelo}`.trim(), data: veiculo }
      : { id: ordem.veiculoId, label: `Veículo #${ordem.veiculoId}` };
    const statusSelecao = this.statusOptions.find(opcao => opcao.data?.valor === ordem.status) ?? {
      id: ordem.status,
      label: ordem.status,
      data: { valor: ordem.status },
    };

    const servicos = ordem.servicos.length
      ? ordem.servicos.map(item => {
          const servico = this.servicos().find(serv => serv.id === item.id);
          const selecao: SelecaoCriavel<Servico> = servico
            ? { id: servico.id, label: this.formatarServicoLabel(servico), data: servico }
            : { id: item.id, label: `Serviço #${item.id}` };
          const valorUnitario = servico?.preco ?? 0;
          return { selecao, qtde: item.qtde, valorUnitario };
        })
      : [this.criarItemFormulario<Servico>()];

    const pecas = ordem.pecas.map(item => {
      const peca = this.pecas().find(prod => prod.id === item.id);
      const selecao: SelecaoCriavel<Peca> = peca
        ? { id: peca.id, label: this.formatarPecaLabel(peca), data: peca }
        : { id: item.id, label: `Peça #${item.id}` };
      const valorUnitario = peca?.preco ?? 0;
      return { selecao, qtde: item.qtde, valorUnitario };
    });

    return {
      cliente: clienteSelecao,
      veiculo: veiculoSelecao,
      dataEntrada: ordem.dataEntrada,
      status: statusSelecao,
      observacoes: ordem.observacoes || '',
      servicos,
      pecas,
    };
  }

  private formatarPreco(valor: number) {
    return this.currencyFormatter.format(Number.isFinite(valor) ? valor : 0);
  }

  private formatarServicoLabel(servico: Servico) {
    return `${servico.descricao} — ${this.formatarPreco(servico.preco)}`;
  }

  private formatarPecaLabel(peca: Peca) {
    return `${peca.nome} — ${this.formatarPreco(peca.preco)}`;
  }

  private obterIdNumero(selecao: SelecaoCriavel): number | undefined {
    return typeof selecao?.id === 'number' ? selecao.id : undefined;
  }

  private montarDadosVeiculo(selecao: SelecaoCriavel<Veiculo>): OrdemServicoPayload['veiculo'] {
    const label = selecao?.label?.trim() ?? '';
    const dados = selecao?.data;
    const clienteId = this.obterIdNumero(this.formularioOrdem.cliente);
    if (!dados) {
      const [placaPossivel, ...restante] = label.split('-').map(parte => parte.trim()).filter(Boolean);
      const descricao = label || 'Veículo não informado';
      const restanteDescricao = restante.join('-').trim();
      return {
        id: this.obterIdNumero(selecao),
        placa: placaPossivel || descricao,
        marca: restanteDescricao || descricao,
        modelo: restanteDescricao || descricao,
        ano: '',
        descricao,
        clienteId,
      };
    }

    return {
      id: dados.id,
      placa: dados.placa,
      marca: dados.marca,
      modelo: dados.modelo,
      ano: dados.ano,
      descricao: label || `${dados.placa} - ${dados.marca} ${dados.modelo}`.trim(),
      clienteId: dados.clienteId,
    };
  }
}
