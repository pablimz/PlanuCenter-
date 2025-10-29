export type ItemTipo = 'peca' | 'servico';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  details?: unknown;
}

export interface TotaisOrdem {
  totalServicos: number;
  totalPecas: number;
  totalGeral: number;
}

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
  email?: string;
  telefone?: string;
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
  totais?: TotaisOrdem;
}

export interface OrdemServicoItemPayload {
  id?: number;
  descricao?: string;
  nome?: string;
  preco: number;
  qtde: number;
}

export interface OrdemServicoPayload {
  cliente: {
    id?: number;
    nome: string;
  };
  veiculo: {
    id?: number;
    placa?: string;
    marca?: string;
    modelo?: string;
    ano?: string;
    descricao?: string;
    clienteId?: number;
  };
  dataEntrada: string;
  status: OrdemServico['status'];
  observacoes?: string;
  servicos: (OrdemServicoItemPayload & { descricao: string })[];
  pecas: (OrdemServicoItemPayload & { nome: string })[];
}

export interface MenuItem {
  id: string;
  label: string;
  path: string;
  iconPath: string;
}
