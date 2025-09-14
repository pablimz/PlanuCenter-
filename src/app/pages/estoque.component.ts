import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../core/services/data.service';

@Component({
  selector: 'app-estoque',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white p-6 rounded-lg shadow-md">
      <div class="flex flex-col md:flex-row justify-between items-center mb-4">
          <h2 class="text-lg font-semibold text-gray-700 mb-4 md:mb-0">Controle de Estoque de Peças</h2>
          <button class="w-full md:w-auto bg-green-500 text-white font-bold py-2 px-4 rounded-md hover:bg-green-600 transition-colors">
              + Adicionar Peça
          </button>
      </div>
      <div class="overflow-x-auto">
          <table class="min-w-full bg-white">
              <thead class="bg-gray-50">
                  <tr>
                      <th class="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                      <th class="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome da Peça</th>
                      <th class="py-3 px-6 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd. Estoque</th>
                      <th class="py-3 px-6 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Preço (R$)</th>
                      <th class="py-3 px-6 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
              </thead>
              <tbody class="text-gray-600 text-sm font-light">
                @for(p of pecas(); track p.id) {
                  <tr class="border-b border-gray-200 hover:bg-gray-50">
                      <td class="py-3 px-6 text-left">{{p.codigo}}</td>
                      <td class="py-3 px-6 text-left">{{p.nome}}</td>
                      <td class="py-3 px-6 text-center">{{p.estoque}}</td>
                      <td class="py-3 px-6 text-right">{{p.preco | currency:'BRL'}}</td>
                       <td class="py-3 px-6 text-center">
                          <button class="bg-gray-200 text-gray-700 py-1 px-3 rounded-md hover:bg-gray-300 text-xs">Editar</button>
                      </td>
                  </tr>
                }
              </tbody>
          </table>
      </div>
    </div>
  `,
})
export class EstoqueComponent {
  private dataService = inject(DataService);
  pecas = this.dataService.pecas;
}
