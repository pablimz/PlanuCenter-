const fs = require('fs/promises');
const path = require('path');
const {
  initializeDatabase,
  closePool,
  getClientes,
  addCliente,
  addVeiculo,
  addPeca,
  addServico,
  addOrdemServico,
} = require('../db');

async function carregarBaseLocal() {
  const arquivo = path.resolve(__dirname, '..', 'database.json');
  const conteudo = await fs.readFile(arquivo, 'utf-8');
  return JSON.parse(conteudo);
}

async function main() {
  await initializeDatabase();
  const clientesExistentes = await getClientes();
  if (clientesExistentes.length > 0) {
    console.log('O banco de dados já possui clientes cadastrados. Migração ignorada para evitar duplicidades.');
    return;
  }

  const dados = await carregarBaseLocal();
  const clientesMap = new Map();
  for (const cliente of dados.clientes ?? []) {
    const criado = await addCliente({
      nome: cliente.nome,
      email: cliente.email ?? undefined,
      telefone: cliente.telefone ?? undefined,
    });
    clientesMap.set(cliente.id, criado.id);
  }

  const veiculosMap = new Map();
  for (const veiculo of dados.veiculos ?? []) {
    const clienteId = clientesMap.get(veiculo.clienteId);
    if (!clienteId) {
      continue;
    }
    const criado = await addVeiculo({
      placa: String(veiculo.placa ?? '').toUpperCase(),
      marca: veiculo.marca,
      modelo: veiculo.modelo,
      ano: veiculo.ano,
      clienteId,
    });
    veiculosMap.set(veiculo.id, criado.id);
  }

  const pecasMap = new Map();
  for (const peca of dados.pecas ?? []) {
    const criada = await addPeca({
      nome: peca.nome,
      codigo: peca.codigo,
      estoque: Number(peca.estoque ?? 0),
      preco: Number(peca.preco ?? 0),
    });
    pecasMap.set(peca.id, criada.id);
  }

  const servicosMap = new Map();
  for (const servico of dados.servicos ?? []) {
    const criado = await addServico({
      descricao: servico.descricao,
      preco: Number(servico.preco ?? 0),
    });
    servicosMap.set(servico.id, criado.id);
  }

  for (const ordem of dados.ordensServico ?? []) {
    const clienteId = clientesMap.get(ordem.clienteId);
    const veiculoId = veiculosMap.get(ordem.veiculoId);
    if (!clienteId || !veiculoId) {
      continue;
    }
    const servicos = Array.isArray(ordem.servicos)
      ? ordem.servicos.map(item => ({
          id: servicosMap.get(item.id) ?? item.id,
          qtde: Number(item.qtde ?? 1),
        }))
      : [];
    const pecas = Array.isArray(ordem.pecas)
      ? ordem.pecas.map(item => ({
          id: pecasMap.get(item.id) ?? item.id,
          qtde: Number(item.qtde ?? 1),
        }))
      : [];
    await addOrdemServico({
      clienteId,
      veiculoId,
      dataEntrada: ordem.dataEntrada,
      status: ordem.status,
      servicos,
      pecas,
      observacoes: ordem.observacoes ?? undefined,
    });
  }

  console.log('Migração concluída com sucesso.');
}

main()
  .catch(error => {
    console.error('Erro durante a migração dos dados.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await closePool();
    } catch (error) {
      console.error('Erro ao encerrar o pool de conexões.', error);
    }
  });
