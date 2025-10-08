import { Injectable, signal } from '@angular/core';
import { Cliente, OrdemServico, Peca, Servico, Veiculo } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  // --- DADOS MOCKADOS (Simulação de um banco de dados) ---
  // Usando Signals para reatividade.
  
  readonly clientes = signal<Cliente[]>([
    { id: 1, nome: 'Carlos Alberto', email: 'carlos.alberto@email.com', telefone: '(11) 91234-5678' },
    { id: 2, nome: 'Joana Pereira', email: 'joana.pereira@email.com', telefone: '(11) 98765-4321' },
    { id: 3, nome: 'Pedro Henrique', email: 'pedro.henrique@email.com', telefone: '(21) 99876-5432' },
    { id: 4, nome: 'João da Silva', email: 'joao.silva@email.com', telefone: '(31) 93456-7890' },
  ]);

  readonly veiculos = signal<Veiculo[]>([
    { id: 1, placa: 'ROZ-1295', marca: 'Toyota', modelo: 'Corolla', ano: '2022', clienteId: 1, clienteNome: 'Carlos Alberto' },
    { id: 2, placa: 'PEA-0M40', marca: 'Honda', modelo: 'Civic', ano: '2021', clienteId: 3, clienteNome: 'Pedro Henrique' },
    { id: 3, placa: 'LBT-3954', marca: 'Ford', modelo: 'Ranger', ano: '2023', clienteId: 4, clienteNome: 'João da Silva' },
    { id: 4, placa: 'XYZ-7890', marca: 'Chevrolet', modelo: 'Onix', ano: '2020', clienteId: 2, clienteNome: 'Joana Pereira' },
  ]);

  readonly pecas = signal<Peca[]>([
    { id: 101, nome: 'Filtro de Óleo', codigo: 'FO-001', estoque: 15, preco: 35.00 },
    { id: 102, nome: 'Pastilha de Freio', codigo: 'PF-002', estoque: 8, preco: 120.50 },
    { id: 103, nome: 'Vela de Ignição', codigo: 'VI-003', estoque: 32, preco: 25.00 },
    { id: 104, nome: 'Óleo Motor 5W30', codigo: 'OM-004', estoque: 20, preco: 55.00 },
  ]);

  readonly servicos = signal<Servico[]>([
    { id: 201, descricao: 'Troca de Óleo e Filtro', preco: 150.00 },
    { id: 202, descricao: 'Alinhamento e Balanceamento', preco: 180.00 },
    { id: 203, descricao: 'Revisão Sistema de Freios', preco: 250.00 },
  ]);

  readonly ordensServico = signal<OrdemServico[]>([
    {
      id: 974,
      veiculoId: 1,
      clienteId: 1,
      dataEntrada: '2025-09-07',
      status: 'Em Andamento',
      servicos: [{ id: 201, qtde: 1 }],
      pecas: [{ id: 101, qtde: 1 }, { id: 104, qtde: 1 }],
    },
    {
      id: 973,
      veiculoId: 1,
      clienteId: 1,
      dataEntrada: '2025-09-06',
      status: 'Finalizada',
      servicos: [{ id: 202, qtde: 1 }],
      pecas: [],
    },
    {
      id: 971,
      veiculoId: 2,
      clienteId: 3,
      dataEntrada: '2025-09-05',
      status: 'Aguardando Aprovação',
      servicos: [{ id: 203, qtde: 1 }],
      pecas: [{ id: 102, qtde: 2 }],
    },
    {
      id: 968,
      veiculoId: 3,
      clienteId: 4,
      dataEntrada: '2025-09-02',
      status: 'Finalizada',
      servicos: [{ id: 201, qtde: 1 }],
      pecas: [{ id: 101, qtde: 1 }, { id: 104, qtde: 1 }],
    },
  ]);

  constructor() { }

  getOrdemServicoById(id: number): OrdemServico | undefined {
    return this.ordensServico().find(os => os.id === id);
  }
}
