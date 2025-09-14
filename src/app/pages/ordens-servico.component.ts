import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../core/services/data.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-ordens-servico',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="bg-white p-6 rounded-lg shadow-md">
      <div class="flex flex-col md:flex-row justify-between items-center mb-4">
          <h2 class="text-lg font-semibold text-gray-700 mb-4 md:mb-0">Gerenciar Ordens de Serviço</h2>
          <button class="w-full md:w-auto bg-green-500 text-white font-bold py-2 px-4 rounded-md hover:bg-green-600 transition-colors">
              + Nova Ordem de Serviço
          </button>
      </div>
      <div class="overflow-x-auto">
          <table class="min-w-full bg-white">
              <thead class="bg-gray-50">
                  <tr>
                      <th class="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OS</th>
                      <th class="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Placa</th>
                      <th class="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                      <th class="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Veículo</th>
                      <th class="py-3 px-6 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
              </thead>
              <tbody class="text-gray-600 text-sm font-light">
                @for (os of ordensServico(); track os.id) {
                  <tr class="border-b border-gray-200 hover:bg-gray-50">
                      <td class="py-3 px-6 text-left whitespace-nowrap"><a [routerLink]="['/ordens-servico', os.id]" class="text-blue-600 font-medium hover:underline">#{{os.id}}</a></td>
                      <td class="py-3 px-6 text-left">{{ getVeiculo(os.veiculoId)?.placa }}</td>
                      <td class="py-3 px-6 text-left">{{ getCliente(os.clienteId)?.nome }}</td>
                      <td class="py-3 px-6 text-left">{{ getVeiculo(os.veiculoId)?.marca }} {{ getVeiculo(os.veiculoId)?.modelo }}</td>
                      <td class="py-3 px-6 text-center">
                          <a [routerLink]="['/ordens-servico', os.id]" class="bg-blue-500 text-white py-1 px-3 rounded-md hover:bg-blue-600 text-xs">Ver Resumo</a>
                      </td>
                  </tr>
                }
              </tbody>
          </table>
      </div>
    </div>
  `,
})
export class OrdensServicoComponent {
  private dataService = inject(DataService);
  
  ordensServico = this.dataService.ordensServico;
  veiculos = this.dataService.veiculos;
  clientes = this.dataService.clientes;

  getVeiculo(id: number) {
    return this.veiculos().find(v => v.id === id);
  }

  getCliente(id: number) {
    return this.clientes().find(c => c.id === id);
  }
}
