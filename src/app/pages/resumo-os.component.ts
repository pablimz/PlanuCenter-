import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../core/services/data.service';
import { OrdemServico, Veiculo, Cliente, Servico, Peca } from '../core/models/models';
import { RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

@Component({
  selector: 'app-resumo-os',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    @if(osDetails(); as details) {
      <div class="no-print mb-6 flex justify-between items-center">
        <a routerLink="/ordens-servico" class="bg-gray-500 text-white font-bold py-2 px-4 rounded-md hover:bg-gray-600 transition-colors">&larr; Voltar</a>
        <button (click)="print()" class="bg-blue-500 text-white font-bold py-2 px-4 rounded-md hover:bg-blue-600 transition-colors">Imprimir / Salvar PDF</button>
      </div>

      <div id="printableArea" class="bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
        <header class="flex justify-between items-start border-b pb-6">
            <div>
              <h1 class="text-3xl font-bold text-gray-800">OficinaPRO</h1>
              <p class="text-gray-500">Rua das Mecânicas, 123 - Bairro Industrial</p>
              <p class="text-gray-500">Uberlândia, MG - (34) 99999-8888</p>
            </div>
            <div class="text-right">
              <h2 class="text-xl font-semibold text-gray-700">ORDEM DE SERVIÇO</h2>
              <p class="text-2xl font-bold text-blue-600">#{{ details.os.id }}</p>
              <p class="text-gray-500 mt-2">Data: {{ details.os.dataEntrada }}</p>
            </div>
        </header>
        <section class="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
            <div>
              <h3 class="font-semibold text-gray-600 mb-1">CLIENTE:</h3>
              <p class="text-gray-800 font-medium">{{ details.cliente?.nome }}</p>
            </div>
             <div>
              <h3 class="font-semibold text-gray-600 mb-1">VEÍCULO:</h3>
              <p class="text-gray-800 font-medium">{{ details.veiculo?.marca }} {{ details.veiculo?.modelo }} - {{ details.veiculo?.ano }}</p>
              <p class="text-gray-500">Placa: {{ details.veiculo?.placa }}</p>
            </div>
        </section>
        <section class="mt-8">
            <h3 class="text-lg font-semibold text-gray-700 mb-2 border-b pb-2">Detalhes do Serviço</h3>
            
            <h4 class="font-semibold text-gray-600 mt-4 mb-2">Serviços Realizados</h4>
            <table class="w-full text-sm">
                <thead>
                    <tr class="bg-gray-50">
                        <th class="py-2 px-4 text-left font-medium text-gray-500">Descrição</th>
                        <th class="py-2 px-4 text-center font-medium text-gray-500">Qtde</th>
                        <th class="py-2 px-4 text-right font-medium text-gray-500">Vl. Unit.</th>
                        <th class="py-2 px-4 text-right font-medium text-gray-500">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                  @for (item of details.servicos; track item.id) {
                    <tr>
                      <td class="py-2 px-4 border-b text-black">{{ item.descricao }}</td>
                      <td class="py-2 px-4 border-b text-center text-black">{{ item.qtde }}</td>
                      <td class="py-2 px-4 border-b text-right text-black">{{ item.preco | currency:'BRL' }}</td>
                      <td class="py-2 px-4 border-b text-right text-black">{{ item.subtotal | currency:'BRL' }}</td>
                    </tr>
                  }
                </tbody>
            </table>

            <h4 class="font-semibold text-gray-600 mt-6 mb-2">Peças Utilizadas</h4>
            <table class="w-full text-sm">
              <thead>
                  <tr class="bg-gray-50">
                      <th class="py-2 px-4 text-left font-medium text-gray-500">Descrição</th>
                      <th class="py-2 px-4 text-center font-medium text-gray-500">Qtde</th>
                      <th class="py-2 px-4 text-right font-medium text-gray-500">Vl. Unit.</th>
                      <th class="py-2 px-4 text-right font-medium text-gray-500">Subtotal</th>
                  </tr>
              </thead>
              <tbody>
                @for(item of details.pecas; track item.id) {
                  <tr>
                    <td class="py-2 px-4 border-b text-black">{{ item.nome }}</td>
                    <td class="py-2 px-4 border-b text-center text-black">{{ item.qtde }}</td>
                    <td class="py-2 px-4 border-b text-right text-black">{{ item.preco | currency:'BRL' }}</td>
                    <td class="py-2 px-4 border-b text-right text-black">{{ item.subtotal | currency:'BRL' }}</td>
                  </tr>
                }
              </tbody>
            </table>
        </section>
        
        <section class="mt-8">
            <div class="ml-auto w-full max-w-xs text-right space-y-2">
                <div class="flex justify-between">
                    <span class="text-gray-600">Total de Serviços:</span>
                    <span class="font-medium text-gray-800">{{ details.totalServicos | currency:'BRL' }}</span>
                </div>
                 <div class="flex justify-between">
                    <span class="text-gray-600">Total de Peças:</span>
                    <span class="font-medium text-gray-800">{{ details.totalPecas | currency:'BRL' }}</span>
                </div>
                <div class="flex justify-between border-t-2 pt-2 mt-2">
                    <span class="font-bold text-lg">VALOR TOTAL:</span>
                    <span class="font-bold text-lg text-blue-600">{{ details.totalGeral | currency:'BRL' }}</span>
                </div>
            </div>
        </section>

        <footer class="mt-12 border-t pt-4 text-center text-gray-500 text-sm">
            <p>Todos os nossos serviços e produtos possuem 3 meses de garantia.</p>
            <p class="font-semibold">Obrigado pela preferência!</p>
        </footer>
      </div>
    } @else {
      <p class="text-center text-gray-600">Ordem de serviço não encontrada ou inválida.</p>
    }
  `,
})
export class ResumoOsComponent {
  private dataService = inject(DataService);
  private route = inject(ActivatedRoute);
  private osId = toSignal(
    this.route.paramMap.pipe(map(params => Number(params.get('id') ?? 0))),
    { initialValue: Number(this.route.snapshot.paramMap.get('id') ?? 0) }
  );
  private currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  osDetails = computed(() => {
    const id = this.osId();
    if (!id) {
      return null;
    }

    const os = this.dataService.getOrdemServicoById(id);
    if (!os) return null;

    const veiculo = this.dataService.veiculos().find(v => v.id === os.veiculoId);
    const cliente = this.dataService.clientes().find(c => c.id === os.clienteId);
    
    let totalServicos = 0;
    const servicosComDetalhes = os.servicos.map(item => {
      const servico = this.dataService.servicos().find(s => s.id === item.id);
      const subtotal = (servico?.preco || 0) * item.qtde;
      totalServicos += subtotal;
      return {...servico, ...item, subtotal};
    });

    let totalPecas = 0;
    const pecasComDetalhes = os.pecas.map(item => {
      const peca = this.dataService.pecas().find(p => p.id === item.id);
      const subtotal = (peca?.preco || 0) * item.qtde;
      totalPecas += subtotal;
      return {...peca, ...item, subtotal};
    });

    return {
      os,
      veiculo,
      cliente,
      servicos: servicosComDetalhes,
      pecas: pecasComDetalhes,
      totalServicos,
      totalPecas,
      totalGeral: totalServicos + totalPecas
    };
  });

  print() {
    const detalhes = this.osDetails();
    if (!detalhes) {
      return;
    }

    const janela = window.open('', '_blank', 'width=900,height=650');
    if (!janela) {
      console.error('Não foi possível abrir a janela de impressão.');
      return;
    }

    const servicosLinhas = detalhes.servicos.length
      ? detalhes.servicos
          .map(item => `
            <tr>
              <td>${this.escapeHtml(item.descricao ?? 'Serviço')}</td>
              <td class="text-center">${this.escapeHtml(item.qtde)}</td>
              <td class="text-right">${this.escapeHtml(this.formatarMoeda(item.preco))}</td>
              <td class="text-right">${this.escapeHtml(this.formatarMoeda(item.subtotal))}</td>
            </tr>
          `)
          .join('')
      : '<tr><td colspan="4" class="empty">Nenhum serviço informado.</td></tr>';

    const pecasLinhas = detalhes.pecas.length
      ? detalhes.pecas
          .map(item => `
            <tr>
              <td>${this.escapeHtml(item.nome ?? 'Peça')}</td>
              <td class="text-center">${this.escapeHtml(item.qtde)}</td>
              <td class="text-right">${this.escapeHtml(this.formatarMoeda(item.preco))}</td>
              <td class="text-right">${this.escapeHtml(this.formatarMoeda(item.subtotal))}</td>
            </tr>
          `)
          .join('')
      : '<tr><td colspan="4" class="empty">Nenhuma peça informada.</td></tr>';

    const clienteNome = this.escapeHtml(detalhes.cliente?.nome ?? '—');
    const veiculoDescricao = detalhes.veiculo
      ? this.escapeHtml(`${detalhes.veiculo.marca} ${detalhes.veiculo.modelo}`.trim())
      : '—';
    const veiculoAno = this.escapeHtml(detalhes.veiculo?.ano ?? '—');
    const veiculoPlaca = this.escapeHtml(detalhes.veiculo?.placa ?? '—');
    const status = this.escapeHtml(detalhes.os.status);
    const dataEntrada = this.escapeHtml(detalhes.os.dataEntrada);
    const observacoes = detalhes.os.observacoes ? `<section class="observacoes">
        <h3>Observações</h3>
        <p>${this.escapeHtml(detalhes.os.observacoes)}</p>
      </section>` : '';

    const html = `<!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>Ordem de Serviço #${this.escapeHtml(detalhes.os.id)}</title>
        <style>
          :root { color-scheme: only light; }
          * { box-sizing: border-box; }
          body { margin: 0; padding: 32px; font-family: 'Inter', 'Segoe UI', Arial, sans-serif; background: #fff; color: #111827; }
          .container { max-width: 900px; margin: 0 auto; }
          header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e5e7eb; padding-bottom: 24px; margin-bottom: 24px; }
          h1 { margin: 0; font-size: 28px; color: #111827; }
          h2 { margin: 0; font-size: 22px; color: #1f2937; }
          h3 { font-size: 16px; color: #1f2937; margin: 24px 0 12px; }
          p { margin: 4px 0; font-size: 14px; }
          .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 24px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
          th { text-align: left; background: #f3f4f6; color: #4b5563; font-size: 12px; letter-spacing: 0.05em; text-transform: uppercase; padding: 10px 12px; }
          td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #000; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .empty { text-align: center; color: #6b7280; font-style: italic; }
          .totais { margin-left: auto; max-width: 320px; }
          .totais-row { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 8px; }
          .totais-row strong { font-size: 16px; color: #111827; }
          footer { margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 16px; text-align: center; font-size: 12px; color: #4b5563; }
          .status-badge { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 9999px; background: #e0f2fe; color: #0369a1; font-size: 12px; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="container">
          <header>
            <div>
              <h1>OficinaPRO</h1>
              <p>Rua das Mecânicas, 123 - Bairro Industrial</p>
              <p>Uberlândia, MG - (34) 99999-8888</p>
            </div>
            <div style="text-align: right;">
              <h2>Ordem de Serviço</h2>
              <p style="font-size: 26px; font-weight: 700; color: #2563eb; margin: 8px 0 0;">#${this.escapeHtml(detalhes.os.id)}</p>
              <p>Data de entrada: ${dataEntrada}</p>
              <p class="status-badge">${status}</p>
            </div>
          </header>

          <section class="info-grid">
            <div>
              <h3>Cliente</h3>
              <p style="font-weight: 600;">${clienteNome}</p>
            </div>
            <div>
              <h3>Veículo</h3>
              <p style="font-weight: 600;">${veiculoDescricao}</p>
              <p>Placa: ${veiculoPlaca}</p>
              <p>Ano: ${veiculoAno}</p>
            </div>
          </section>

          <section>
            <h3>Serviços Realizados</h3>
            <table>
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th class="text-center">Qtde</th>
                  <th class="text-right">Vl. Unit.</th>
                  <th class="text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>${servicosLinhas}</tbody>
            </table>
          </section>

          <section>
            <h3>Peças Utilizadas</h3>
            <table>
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th class="text-center">Qtde</th>
                  <th class="text-right">Vl. Unit.</th>
                  <th class="text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>${pecasLinhas}</tbody>
            </table>
          </section>

          <div class="totais">
            <div class="totais-row">
              <span>Total de serviços:</span>
              <span>${this.escapeHtml(this.formatarMoeda(detalhes.totalServicos))}</span>
            </div>
            <div class="totais-row">
              <span>Total de peças:</span>
              <span>${this.escapeHtml(this.formatarMoeda(detalhes.totalPecas))}</span>
            </div>
            <div class="totais-row" style="margin-top: 12px; border-top: 1px solid #e5e7eb; padding-top: 12px;">
              <strong>Valor total:</strong>
              <strong>${this.escapeHtml(this.formatarMoeda(detalhes.totalGeral))}</strong>
            </div>
          </div>

          ${observacoes}

          <footer>
            <p>Todos os nossos serviços e produtos possuem 3 meses de garantia.</p>
            <p style="font-weight: 600;">Obrigado pela preferência!</p>
          </footer>
        </div>
      </body>
    </html>`;

    janela.document.open();
    janela.document.write(html);
    janela.document.close();
    janela.focus();
    janela.onload = () => {
      janela.print();
      janela.close();
    };
  }

  private formatarMoeda(valor: number | null | undefined) {
    return this.currencyFormatter.format(Number.isFinite(Number(valor)) ? Number(valor) : 0);
  }

  private escapeHtml(valor: unknown) {
    const texto = `${valor ?? ''}`;
    return texto
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
