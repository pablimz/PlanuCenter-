import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  forwardRef,
  signal,
  computed,
  HostBinding,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

type PrimitiveId = number | string;

export interface AutocompleteOption<T = unknown> {
  id?: PrimitiveId;
  label: string;
  data?: T;
}

export type AutocompleteValue<T = unknown> = AutocompleteOption<T> | null;

@Component({
  selector: 'app-autocomplete-criavel',
  standalone: true,
  imports: [CommonModule],
  host: {
    class: 'block w-full',
  },
  template: `
    <div class="relative">
      <input
        class="w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 placeholder:text-slate-400 shadow-inner shadow-slate-950/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40 disabled:cursor-not-allowed disabled:opacity-60"
        type="text"
        [placeholder]="placeholder"
        [value]="search()"
        [disabled]="disabled"
        (focus)="abrirLista()"
        (input)="aoDigitar($event)"
        (keydown)="aoPressionarTecla($event)"
        (blur)="aoSair()"
      />

      @if (listaAberta() && (opcoesFiltradas().length || podeCriarNovo())) {
        <div
          class="absolute z-20 mt-1 w-full rounded-2xl border border-white/10 bg-slate-900/95 p-1 text-slate-100 shadow-lg shadow-slate-950/40"
        >
          <ul class="max-h-56 overflow-auto">
            @for (opcao of opcoesFiltradas(); track opcao.id ?? opcao.label; let index = $index) {
              <li>
                <button
                  type="button"
                  class="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition hover:bg-white/10"
                  [class.bg-white/10]="index === opcaoFocada()"
                  (mousedown)="selecionarOpcao(opcao, $event)"
                >
                  <span>{{ opcao.label }}</span>
                  @if (valorAtual()?.id === opcao.id) {
                    <svg class="h-4 w-4 text-sky-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m5 13 4 4L19 7" /></svg>
                  }
                </button>
              </li>
            }
            @if (podeCriarNovo()) {
              <li>
                <button
                  type="button"
                  class="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-emerald-300 transition hover:bg-emerald-500/10 hover:text-emerald-200"
                  (mousedown)="criarNovo($event)"
                >
                  <span>Criar "{{ search().trim() }}"</span>
                  <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v12m6-6H6" />
                  </svg>
                </button>
              </li>
            }
          </ul>
        </div>
      }
    </div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AutocompleteCriavelComponent),
      multi: true,
    },
  ],
})
export class AutocompleteCriavelComponent<T = unknown> implements ControlValueAccessor, OnChanges {
  @Input() options: AutocompleteOption<T>[] = [];
  @Input() placeholder = '';
  @Input() allowCustom = true;
  @Input() disabled = false;
  @Input() name?: string;

  @HostBinding('attr.name') get hostName() {
    return this.name ?? null;
  }

  search = signal('');
  listaAberta = signal(false);
  opcaoFocada = signal(-1);

  private onChange: (value: AutocompleteValue<T>) => void = () => undefined;
  private onTouched: () => void = () => undefined;
  private interno: AutocompleteValue<T> = null;

  opcoesFiltradas = computed(() => {
    const termo = this.search().trim().toLowerCase();
    const opcoes = this.options ?? [];
    if (!termo) {
      return opcoes.slice(0, 20);
    }
    return opcoes.filter(opcao => opcao.label.toLowerCase().includes(termo)).slice(0, 20);
  });

  podeCriarNovo = computed(() => {
    if (!this.allowCustom || this.disabled) {
      return false;
    }
    const texto = this.search().trim();
    if (!texto) {
      return false;
    }
    const existe = (this.options ?? []).some(
      opcao => opcao.label.toLowerCase() === texto.toLowerCase(),
    );
    return !existe;
  });

  ngOnChanges(changes: SimpleChanges) {
    if (changes['options'] && this.interno?.id != null) {
      const atualizada = this.options.find(opcao => opcao.id === this.interno!.id);
      if (atualizada) {
        this.interno = { ...atualizada };
        this.search.set(atualizada.label);
      }
    }
  }

  writeValue(value: AutocompleteValue<T>): void {
    this.interno = value;
    this.search.set(value?.label ?? '');
  }

  registerOnChange(fn: (value: AutocompleteValue<T>) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  valorAtual() {
    return this.interno;
  }

  abrirLista() {
    if (this.disabled) {
      return;
    }
    this.listaAberta.set(true);
    const texto = this.search().trim();
    if (texto && !this.opcoesFiltradas().length) {
      this.opcaoFocada.set(-1);
    } else {
      this.opcaoFocada.set(0);
    }
  }

  aoDigitar(evento: Event) {
    if (this.disabled) {
      return;
    }
    const alvo = evento.target as HTMLInputElement;
    this.search.set(alvo.value);
    this.listaAberta.set(true);
    this.opcaoFocada.set(this.opcoesFiltradas().length ? 0 : -1);
  }

  aoPressionarTecla(evento: KeyboardEvent) {
    if (!this.listaAberta()) {
      if (evento.key === 'ArrowDown') {
        this.abrirLista();
        evento.preventDefault();
      }
      return;
    }

    const total = this.opcoesFiltradas().length;
    if (evento.key === 'ArrowDown') {
      evento.preventDefault();
      if (!total) {
        return;
      }
      const proximo = (this.opcaoFocada() + 1) % total;
      this.opcaoFocada.set(proximo);
    } else if (evento.key === 'ArrowUp') {
      evento.preventDefault();
      if (!total) {
        return;
      }
      const atual = this.opcaoFocada();
      const anterior = atual <= 0 ? total - 1 : atual - 1;
      this.opcaoFocada.set(anterior);
    } else if (evento.key === 'Enter') {
      evento.preventDefault();
      if (total && this.opcaoFocada() >= 0) {
        const opcao = this.opcoesFiltradas()[this.opcaoFocada()];
        if (opcao) {
          this.definirValor({ ...opcao });
        }
      } else if (this.podeCriarNovo()) {
        this.definirValor({ id: undefined, label: this.search().trim() });
      } else if (!this.allowCustom) {
        this.redefinirParaAtual();
      }
      this.listaAberta.set(false);
    } else if (evento.key === 'Escape') {
      this.listaAberta.set(false);
      this.redefinirParaAtual();
    }
  }

  aoSair() {
    window.setTimeout(() => {
      if (this.allowCustom) {
        const texto = this.search().trim();
        if (!texto) {
          this.definirValor(null, false);
        } else {
          const existente = (this.options ?? []).find(
            opcao => opcao.label.toLowerCase() === texto.toLowerCase(),
          );
          if (existente) {
            this.definirValor({ ...existente }, false);
          } else {
            this.definirValor({ id: undefined, label: texto }, false);
          }
        }
      } else {
        this.redefinirParaAtual();
      }
      this.listaAberta.set(false);
      this.onTouched();
    }, 120);
  }

  selecionarOpcao(opcao: AutocompleteOption<T>, evento: MouseEvent) {
    evento.preventDefault();
    if (this.disabled) {
      return;
    }
    this.definirValor({ ...opcao });
    this.listaAberta.set(false);
  }

  criarNovo(evento: MouseEvent) {
    evento.preventDefault();
    if (!this.allowCustom || this.disabled) {
      return;
    }
    const texto = this.search().trim();
    if (!texto) {
      return;
    }
    this.definirValor({ id: undefined, label: texto });
    this.listaAberta.set(false);
  }

  private redefinirParaAtual() {
    this.search.set(this.interno?.label ?? '');
  }

  private definirValor(valor: AutocompleteValue<T>, atualizarPesquisa = true) {
    this.interno = valor;
    if (atualizarPesquisa) {
      this.search.set(valor?.label ?? '');
    }
    this.onChange(valor);
  }
}
