import { OrdemServico, Peca, Servico } from '../models/models';

export interface ServicoAplicadoDetalhado {
  id: number;
  descricao: string | null;
  preco: number;
  qtde: number;
  subtotal: number;
}

export interface PecaAplicadaDetalhada {
  id: number;
  nome: string | null;
  preco: number;
  qtde: number;
  subtotal: number;
}

export interface ResumoFinanceiroOrdem {
  servicos: ServicoAplicadoDetalhado[];
  pecas: PecaAplicadaDetalhada[];
  totalServicos: number;
  totalPecas: number;
  totalGeral: number;
}

function montarServicosDetalhados(
  ordem: OrdemServico,
  catalogoServicos: Servico[],
): { detalhes: ServicoAplicadoDetalhado[]; total: number } {
  let totalServicos = 0;
  const detalhes = ordem.servicos.map(item => {
    const servico = catalogoServicos.find(serv => serv.id === item.id);
    const preco = servico?.preco ?? 0;
    const subtotal = preco * item.qtde;
    totalServicos += subtotal;
    return {
      id: item.id,
      descricao: servico?.descricao ?? null,
      preco,
      qtde: item.qtde,
      subtotal,
    } satisfies ServicoAplicadoDetalhado;
  });
  return { detalhes, total: totalServicos };
}

function montarPecasDetalhadas(
  ordem: OrdemServico,
  catalogoPecas: Peca[],
): { detalhes: PecaAplicadaDetalhada[]; total: number } {
  let totalPecas = 0;
  const detalhes = ordem.pecas.map(item => {
    const peca = catalogoPecas.find(produto => produto.id === item.id);
    const preco = peca?.preco ?? 0;
    const subtotal = preco * item.qtde;
    totalPecas += subtotal;
    return {
      id: item.id,
      nome: peca?.nome ?? null,
      preco,
      qtde: item.qtde,
      subtotal,
    } satisfies PecaAplicadaDetalhada;
  });
  return { detalhes, total: totalPecas };
}

export function montarResumoFinanceiroOrdem(
  ordem: OrdemServico,
  catalogoServicos: Servico[],
  catalogoPecas: Peca[],
): ResumoFinanceiroOrdem {
  const { detalhes: servicos, total: totalServicos } = montarServicosDetalhados(ordem, catalogoServicos);
  const { detalhes: pecas, total: totalPecas } = montarPecasDetalhadas(ordem, catalogoPecas);
  return {
    servicos,
    pecas,
    totalServicos,
    totalPecas,
    totalGeral: totalServicos + totalPecas,
  };
}

export function calcularTotaisFinanceiros(
  ordem: OrdemServico,
  catalogoServicos: Servico[],
  catalogoPecas: Peca[],
): Pick<ResumoFinanceiroOrdem, 'totalServicos' | 'totalPecas' | 'totalGeral'> {
  const { totalServicos, totalPecas, totalGeral } = montarResumoFinanceiroOrdem(
    ordem,
    catalogoServicos,
    catalogoPecas,
  );
  return { totalServicos, totalPecas, totalGeral };
}
