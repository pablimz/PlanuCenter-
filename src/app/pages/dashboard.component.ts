import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../core/services/data.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="bg-blue-500 text-white p-6 rounded-lg shadow-md">
        <h3 class="text-4xl font-bold">{{ stats().emAndamento }}</h3>
        <p class="mt-1">O.S. em andamento</p>
      </div>
      <div class="bg-green-500 text-white p-6 rounded-lg shadow-md">
        <h3 class="text-4xl font-bold">{{ stats().entreguesMes }}</h3>
        <p class="mt-1">O.S. entregues este mês</p>
      </div>
      <div class="bg-yellow-500 text-white p-6 rounded-lg shadow-md">
        <h3 class="text-4xl font-bold">{{ stats().aguardando }}</h3>
        <p class="mt-1">O.S. aguardando aprovação</p>
      </div>
      <div class="bg-gray-500 text-white p-6 rounded-lg shadow-md">
        <h3 class="text-4xl font-bold">0</h3>
        <p class="mt-1">O.S. com previsão para hoje</p>
      </div>
    </div>

    <div class="mt-8 bg-white p-6 rounded-lg shadow-md">
      <h2 class="text-lg font-semibold text-gray-700 mb-4">O.S. Recentes</h2>
      <div class="overflow-x-auto">
          <table class="min-w-full bg-white">
            <thead class="bg-gray-50">
                <tr>
                  <th class="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">O.S. #</th>
                  <th class="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Placa</th>
                  <th class="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th class="py-3 px-6 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Data Entrada</th>
                  <th class="py-3 px-6 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
            </thead>
            <tbody class="text-gray-600 text-sm font-light">
              @for (os of ordensServico().slice(0, 5); track os.id) {
                <tr class="border-b border-gray-200 hover:bg-gray-50">
                   <td class="py-3 px-6 text-left">
                     <a [routerLink]="['/ordens-servico', os.id]" class="text-blue-600 font-medium hover:underline">#{{ os.id }}</a>
                   </td>
                   <td class="py-3 px-6 text-left">{{ getVeiculo(os.veiculoId)?.placa }}</td>
                   <td class="py-3 px-6 text-left">{{ getCliente(os.clienteId)?.nome }}</td>
                   <td class="py-3 px-6 text-center">{{ os.dataEntrada }}</td>
                   <td class="py-3 px-6 text-center">
                     <span class="py-1 px-3 rounded-full text-xs" [ngClass]="getStatusClass(os.status)">{{ os.status }}</span>
                   </td>
                </tr>
              }
            </tbody>
          </table>
      </div>
    </div>
  `,
})
export class DashboardComponent {
  private dataService = inject(DataService);
  
  ordensServico = this.dataService.ordensServico;
  veiculos = this.dataService.veiculos;
  clientes = this.dataService.clientes;

  stats = computed(() => {
    const osList = this.ordensServico();
    return {
      emAndamento: osList.filter(os => os.status === 'Em Andamento').length,
      entreguesMes: osList.filter(os => os.status === 'Finalizada').length,
      aguardando: osList.filter(os => os.status === 'Aguardando Aprovação').length,
    }
  });

  getVeiculo(id: number) {
    return this.veiculos().find(v => v.id === id);
  }

  getCliente(id: number) {
    return this.clientes().find(c => c.id === id);
  }

  getStatusClass(status: string) {
    switch (status) {
      case 'Em Andamento': return 'bg-blue-100 text-blue-800';
      case 'Aguardando Aprovação': return 'bg-yellow-100 text-yellow-800';
      case 'Finalizada': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}
