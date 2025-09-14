export type ItemTipo = 'peca' | 'servico';

export interface Peca {
  id: number;
  nome: string;
  codigo: string;
  estoque: number;
  preco: number;
}

export interface Servico {
  id: number;
  descricao: string;
  preco: number;
}

export interface Cliente {
  id: number;
  nome: string;
}

export interface Veiculo {
  id: number;
  placa: string;
  marca: string;
  modelo: string;
  ano: string;
  clienteId: number;
  clienteNome: string;
}

export interface OrdemServico {
  id: number;
  veiculoId: number;
  clienteId: number;
  dataEntrada: string;
  status: 'Em Andamento' | 'Aguardando Aprovação' | 'Finalizada' | 'Cancelada';
  servicos: { id: number; qtde: number }[];
  pecas: { id: number; qtde: number }[];
  observacoes?: string;
}

export interface MenuItem {
  id: string;
  label: string;
  path: string;
  iconPath: string;
}
