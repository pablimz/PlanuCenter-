import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../core/services/data.service';

@Component({
  selector: 'app-veiculos',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="flex flex-col md:flex-row justify-between items-center mb-4">
            <h2 class="text-lg font-semibold text-gray-700 mb-4 md:mb-0">Cadastro de Veículos</h2>
            <button class="w-full md:w-auto bg-green-500 text-white font-bold py-2 px-4 rounded-md hover:bg-green-600 transition-colors">
                + Cadastrar Veículo
            </button>
        </div>
        <div class="overflow-x-auto">
            <table class="min-w-full bg-white">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Placa</th>
                        <th class="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marca</th>
                        <th class="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modelo</th>
                        <th class="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                         <th class="py-3 px-6 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                    </tr>
                </thead>
                <tbody class="text-gray-600 text-sm font-light">
                  @for(v of veiculos(); track v.id) {
                    <tr class="border-b border-gray-200 hover:bg-gray-50">
                        <td class="py-3 px-6 text-left">{{v.placa}}</td>
                        <td class="py-3 px-6 text-left">{{v.marca}}</td>
                        <td class="py-3 px-6 text-left">{{v.modelo}}</td>
                        <td class="py-3 px-6 text-left">{{v.clienteNome}}</td>
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
export class VeiculosComponent {
  private dataService = inject(DataService);
  veiculos = this.dataService.veiculos;
}
