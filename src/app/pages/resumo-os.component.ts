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
                      <td class="py-2 px-4 border-b">{{ item.descricao }}</td>
                      <td class="py-2 px-4 border-b text-center">{{ item.qtde }}</td>
                      <td class="py-2 px-4 border-b text-right">{{ item.preco | currency:'BRL' }}</td>
                      <td class="py-2 px-4 border-b text-right">{{ item.subtotal | currency:'BRL' }}</td>
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
                    <td class="py-2 px-4 border-b">{{ item.nome }}</td>
                    <td class="py-2 px-4 border-b text-center">{{ item.qtde }}</td>
                    <td class="py-2 px-4 border-b text-right">{{ item.preco | currency:'BRL' }}</td>
                    <td class="py-2 px-4 border-b text-right">{{ item.subtotal | currency:'BRL' }}</td>
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
    window.print();
  }
}
