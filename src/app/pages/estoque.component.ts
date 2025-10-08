import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../core/services/data.service';
import { Peca } from '../core/models/models';

@Component({
  selector: 'app-estoque',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="rounded-3xl border border-white/10 bg-slate-900/50 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur sm:p-8">
      <div class="flex flex-col gap-6">
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.45em] text-sky-300/70">Estoque</p>
            <h2 class="text-2xl font-semibold text-white">Controle de peças</h2>
            <p class="text-sm text-slate-300/80">Acompanhe níveis de estoque, custos e reposições necessárias.</p>
          </div>

          @if (modoVisualizacao() === 'lista') {
            <button
              class="w-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-sky-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 transition hover:from-emerald-300 hover:via-teal-300 hover:to-sky-400 focus:outline-none focus:ring-2 focus:ring-emerald-300/60 md:w-auto"
              (click)="abrirFormularioNovo()"
            >
              + Adicionar peça
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
                    <th class="px-6 py-3 font-semibold">Código</th>
                    <th class="px-6 py-3 font-semibold">Nome da peça</th>
                    <th class="px-6 py-3 text-center font-semibold">Qtd. estoque</th>
                    <th class="px-6 py-3 text-right font-semibold">Preço (R$)</th>
                    <th class="px-6 py-3 text-center font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-white/5 text-sm">
                  @for (peca of pecas(); track peca.id) {
                    <tr class="transition hover:bg-white/5">
                      <td class="px-6 py-4 font-medium text-white">{{ peca.codigo }}</td>
                      <td class="px-6 py-4 text-slate-200">{{ peca.nome }}</td>
                      <td class="px-6 py-4 text-center text-slate-200">{{ peca.estoque }}</td>
                      <td class="px-6 py-4 text-right text-slate-200">{{ peca.preco | currency:'BRL' }}</td>
                      <td class="px-6 py-4 text-center">
                        <div class="flex justify-center gap-2">
                          <button
                            class="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold text-slate-100 transition hover:bg-white/20"
                            (click)="editarPeca(peca)"
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
          <form class="grid gap-5 md:grid-cols-2" (ngSubmit)="salvarPeca()">
            <label class="flex flex-col text-sm text-slate-200">
              Código
              <input
                class="mt-2 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-400 shadow-inner shadow-slate-950/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                name="codigo"
                [(ngModel)]="formulario.codigo"
                required
              />
            </label>

            <label class="flex flex-col text-sm text-slate-200">
              Nome
              <input
                class="mt-2 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-400 shadow-inner shadow-slate-950/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                name="nome"
                [(ngModel)]="formulario.nome"
                required
              />
            </label>

            <label class="flex flex-col text-sm text-slate-200">
              Quantidade em estoque
              <input
                type="number"
                min="0"
                class="mt-2 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-400 shadow-inner shadow-slate-950/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                name="estoque"
                [(ngModel)]="formulario.estoque"
                required
              />
            </label>

            <label class="flex flex-col text-sm text-slate-200">
              Preço
              <input
                type="number"
                min="0"
                step="0.01"
                class="mt-2 rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-400 shadow-inner shadow-slate-950/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
                name="preco"
                [(ngModel)]="formulario.preco"
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
              <button
                type="submit"
                class="rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-950/40 transition hover:from-sky-400 hover:to-indigo-400"
              >
                {{ editandoId() ? 'Atualizar peça' : 'Salvar peça' }}
              </button>
            </div>
          </form>
        }
      </div>
    </section>
  `,
})
export class EstoqueComponent {
  private dataService = inject(DataService);

  pecas = this.dataService.pecas;

  modoVisualizacao = signal<'lista' | 'formulario'>('lista');
  editandoId = signal<number | null>(null);

  formulario = {
    codigo: '',
    nome: '',
    estoque: 0,
    preco: 0,
  };

  abrirFormularioNovo() {
    this.editandoId.set(null);
    this.formulario = {
      codigo: '',
      nome: '',
      estoque: 0,
      preco: 0,
    };
    this.modoVisualizacao.set('formulario');
  }

  editarPeca(peca: Peca) {
    this.editandoId.set(peca.id);
    this.formulario = {
      codigo: peca.codigo,
      nome: peca.nome,
      estoque: peca.estoque,
      preco: peca.preco,
    };
    this.modoVisualizacao.set('formulario');
  }

  salvarPeca() {
    if (!this.formulario.codigo || !this.formulario.nome) {
      return;
    }

    if (this.editandoId()) {
      const idParaAtualizar = this.editandoId()!;
      this.dataService.pecas.update(lista =>
        lista.map(item =>
          item.id === idParaAtualizar
            ? {
                ...item,
                codigo: this.formulario.codigo,
                nome: this.formulario.nome,
                estoque: Number(this.formulario.estoque),
                preco: Number(this.formulario.preco),
              }
            : item,
        ),
      );
    } else {
      const novoId = this.dataService.pecas().reduce((max, peca) => Math.max(max, peca.id), 0) + 1;
      this.dataService.pecas.update(lista => [
        {
          id: novoId,
          codigo: this.formulario.codigo,
          nome: this.formulario.nome,
          estoque: Number(this.formulario.estoque),
          preco: Number(this.formulario.preco),
        },
        ...lista,
      ]);
    }

    this.voltarParaLista();
  }

  voltarParaLista() {
    this.modoVisualizacao.set('lista');
    this.editandoId.set(null);
  }
}
