const http = require('http');
const { URL } = require('url');
const {
  initializeDatabase,
  getClientes,
  getClienteById,
  findClienteByNome,
  addCliente,
  updateCliente,
  deleteCliente,      
  getVeiculos,
  getVeiculoById,
  findVeiculoByPlaca,
  addVeiculo,
  updateVeiculo,
  deleteVeiculo,
  getPecas,
  getPecaById,
  findPecaByNome,
  findPecaByCodigo,
  addPeca,
  updatePeca,
  deletePeca,
  getServicos,
  getServicoById,
  findServicoByDescricao,
  addServico,
  updateServico,
  deleteServico,
  getOrdensServico,
  getOrdemServicoById,
  addOrdemServico,
  updateOrdemServico,
  deleteOrdemServico,
} = require('./db');

const PORT = process.env.PORT || 3000;

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function sendSuccess(res, status, data) {
  sendJson(res, status, { success: true, data });
}

function sendError(res, status, message, details) {
  sendJson(res, status, {
    success: false,
    message,
    details: details ?? undefined,
  });
}

class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  if (!chunks.length) {
    return {};
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf-8'));
  } catch (error) {
    throw new HttpError(
      400,
      'JSON inválido no corpo da requisição.',
      error instanceof Error ? error.message : undefined,
    );
  }
}

function normalizarTexto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

function normalizarNumero(valor, padrao = 0) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : padrao;
}

async function gerarCodigoPeca(nome) {
  const base = normalizarTexto(nome).replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'PECA';
  let codigo = base.slice(0, 8) || 'PECA';
  let contador = 1;
  while (await findPecaByCodigo(codigo)) {
    const sufixo = String(contador).padStart(2, '0');
    const prefixo = base.slice(0, Math.max(0, 8 - sufixo.length)) || 'PC';
    codigo = `${prefixo}${sufixo}`;
    contador += 1;
  }
  return codigo;
}

async function gerarPlacaGenerica(baseTexto) {
  const base = normalizarTexto(baseTexto).replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'VEICULO';
  let tentativa = base.slice(0, 7) || 'VEICULO';
  let contador = 1;
  while (await findVeiculoByPlaca(tentativa)) {
    const sufixo = String(contador).padStart(2, '0');
    const prefixo = base.slice(0, Math.max(0, 7 - sufixo.length)) || 'VEIC';
    tentativa = `${prefixo}${sufixo}`;
    contador += 1;
  }
  return tentativa;
}

async function garantirClienteEntidade(info = {}) {
  const id = Number(info.id);
  const nome = normalizarTexto(info.nome);
  if (id) {
    const existente = await getClienteById(id);
    if (existente) {
      if (nome && existente.nome !== nome) {
        await updateCliente(id, {
          nome,
          email: existente.email ?? undefined,
          telefone: existente.telefone ?? undefined,
        });
      }
      return id;
    }
  }
  if (!nome) {
    throw new Error('CLIENTE_INVALIDO');
  }
  const existentePorNome = await findClienteByNome(nome);
  if (existentePorNome) {
    return existentePorNome.id;
  }
  const novo = await addCliente({ nome });
  return novo.id;
}

async function garantirVeiculoEntidade(info = {}, clienteId) {
  const id = Number(info.id);
  if (!clienteId) {
    throw new Error('VEICULO_INVALIDO');
  }
  if (id) {
    const existente = await getVeiculoById(id);
    if (existente) {
      const placa = normalizarTexto(info.placa) || existente.placa;
      const marca = normalizarTexto(info.marca) || existente.marca;
      const modelo = normalizarTexto(info.modelo) || existente.modelo;
      const ano = normalizarTexto(info.ano) || existente.ano;
      await updateVeiculo(id, {
        placa: (placa || existente.placa).toUpperCase(),
        marca: marca || existente.marca,
        modelo: modelo || existente.modelo,
        ano: ano || existente.ano,
        clienteId,
      });
      return id;
    }
  }
  const placaInformada = normalizarTexto(info.placa);
  const descricao = normalizarTexto(info.descricao);
  const placaCandidata = placaInformada
    ? placaInformada.toUpperCase()
    : await gerarPlacaGenerica(descricao || 'VEICULO');
  const existentePorPlaca = await findVeiculoByPlaca(placaCandidata);
  if (existentePorPlaca) {
    const marca = normalizarTexto(info.marca) || existentePorPlaca.marca;
    const modelo = normalizarTexto(info.modelo) || existentePorPlaca.modelo;
    const ano = normalizarTexto(info.ano) || existentePorPlaca.ano;
    await updateVeiculo(existentePorPlaca.id, {
      placa: existentePorPlaca.placa,
      marca,
      modelo,
      ano,
      clienteId,
    });
    return existentePorPlaca.id;
  }
  const marca = normalizarTexto(info.marca) || descricao || placaCandidata;
  const modelo = normalizarTexto(info.modelo) || descricao || placaCandidata;
  const ano = normalizarTexto(info.ano) || new Date().getFullYear().toString();
  const novo = await addVeiculo({
    placa: placaCandidata,
    marca: marca || placaCandidata,
    modelo: modelo || placaCandidata,
    ano,
    clienteId,
  });
  return novo.id;
}

async function garantirServicoEntidade(info = {}) {
  const id = Number(info.id);
  const descricao = normalizarTexto(info.descricao);
  const preco = normalizarNumero(info.preco, 0);
  if (id) {
    const existente = await getServicoById(id);
    if (existente) {
      await updateServico(id, {
        descricao: descricao || existente.descricao,
        preco,
      });
      return id;
    }
  }
  if (!descricao) {
    return null;
  }
  const existenteDescricao = await findServicoByDescricao(descricao);
  if (existenteDescricao) {
    if (preco !== existenteDescricao.preco) {
      await updateServico(existenteDescricao.id, {
        descricao: existenteDescricao.descricao,
        preco,
      });
    }
    return existenteDescricao.id;
  }
  const novo = await addServico({ descricao, preco });
  return novo.id;
}

async function garantirPecaEntidade(info = {}) {
  const id = Number(info.id);
  const nome = normalizarTexto(info.nome);
  const preco = normalizarNumero(info.preco, 0);
  if (id) {
    const existente = await getPecaById(id);
    if (existente) {
      await updatePeca(id, {
        nome: nome || existente.nome,
        codigo: existente.codigo,
        estoque: existente.estoque,
        preco,
      });
      return id;
    }
  }
  if (!nome) {
    return null;
  }
  const existenteNome = await findPecaByNome(nome);
  if (existenteNome) {
    if (preco !== existenteNome.preco) {
      await updatePeca(existenteNome.id, {
        nome: existenteNome.nome,
        codigo: existenteNome.codigo,
        estoque: existenteNome.estoque,
        preco,
      });
    }
    return existenteNome.id;
  }
  const codigo = await gerarCodigoPeca(nome);
  const nova = await addPeca({ nome, codigo, estoque: 0, preco });
  return nova.id;
}

const STATUS_VALIDOS = new Set([
  'Em Andamento',
  'Aguardando Aprovação',
  'Finalizada',
  'Cancelada',
]);

async function prepararDadosOrdem(body) {
  if (!body || typeof body !== 'object') {
    return { error: 'Dados obrigatórios ausentes.' };
  }

  const usaFormatoNovo = body.cliente || body.veiculo;
  if (usaFormatoNovo) {
    const dataEntrada = normalizarTexto(body.dataEntrada);
    const status = normalizarTexto(body.status);
    if (!dataEntrada || !status) {
      return { error: 'Dados obrigatórios ausentes.' };
    }
    if (!STATUS_VALIDOS.has(status)) {
      return { error: 'Status inválido.' };
    }

    try {
      const clienteId = await garantirClienteEntidade(body.cliente || {});
      const veiculoId = await garantirVeiculoEntidade(body.veiculo || {}, clienteId);

      const servicosEntrada = Array.isArray(body.servicos) ? body.servicos : [];
      const pecasEntrada = Array.isArray(body.pecas) ? body.pecas : [];

      const servicosSanitizados = [];
      for (const item of servicosEntrada) {
        const idServico = await garantirServicoEntidade(item || {});
        if (!idServico) {
          continue;
        }
        const qtde = Math.max(1, Math.trunc(normalizarNumero(item?.qtde, 1)) || 1);
        servicosSanitizados.push({ id: idServico, qtde });
      }

      const pecasSanitizadas = [];
      for (const item of pecasEntrada) {
        const idPeca = await garantirPecaEntidade(item || {});
        if (!idPeca) {
          continue;
        }
        const qtde = Math.max(1, Math.trunc(normalizarNumero(item?.qtde, 1)) || 1);
        pecasSanitizadas.push({ id: idPeca, qtde });
      }

      if (!servicosSanitizados.length && !pecasSanitizadas.length) {
        return { error: 'Inclua ao menos um serviço ou peça.' };
      }

      return {
        dados: {
          clienteId,
          veiculoId,
          dataEntrada,
          status,
          servicos: servicosSanitizados,
          pecas: pecasSanitizadas,
          observacoes: normalizarTexto(body.observacoes) || undefined,
        },
      };
    } catch (erro) {
      if (erro?.message === 'CLIENTE_INVALIDO') {
        return { error: 'Cliente inválido.' };
      }
      if (erro?.message === 'VEICULO_INVALIDO') {
        return { error: 'Veículo inválido.' };
      }
      return { error: 'Não foi possível processar a ordem.' };
    }
  }

  const clienteId = Number(body.clienteId);
  const veiculoId = Number(body.veiculoId);
  const dataEntrada = normalizarTexto(body.dataEntrada);
  const status = normalizarTexto(body.status);
  if (!clienteId || !veiculoId || !dataEntrada || !status) {
    return { error: 'Dados obrigatórios ausentes.' };
  }
  if (!STATUS_VALIDOS.has(status)) {
    return { error: 'Status inválido.' };
  }

  const servicosEntrada = Array.isArray(body.servicos) ? body.servicos : [];
  const pecasEntrada = Array.isArray(body.pecas) ? body.pecas : [];

  const servicosSanitizados = [];
  for (const item of servicosEntrada) {
    const idServico = Number(item?.id);
    if (!idServico) {
      continue;
    }
    const qtde = Math.max(1, Math.trunc(normalizarNumero(item?.qtde, 1)) || 1);
    servicosSanitizados.push({ id: idServico, qtde });
  }

  const pecasSanitizadas = [];
  for (const item of pecasEntrada) {
    const idPeca = Number(item?.id);
    if (!idPeca) {
      continue;
    }
    const qtde = Math.max(1, Math.trunc(normalizarNumero(item?.qtde, 1)) || 1);
    pecasSanitizadas.push({ id: idPeca, qtde });
  }

  if (!servicosSanitizados.length && !pecasSanitizadas.length) {
    return { error: 'Inclua ao menos um serviço ou peça.' };
  }

  return {
    dados: {
      clienteId,
      veiculoId,
      dataEntrada,
      status,
      servicos: servicosSanitizados,
      pecas: pecasSanitizadas,
      observacoes: normalizarTexto(body.observacoes) || undefined,
    },
  };
}

async function handleRequest(req, res) {
  if (!req.url) {
    throw new HttpError(400, 'Requisição inválida.');
  }

  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  if (req.method === 'GET' && pathname === '/api/clientes') {
    const clientes = await getClientes();
    const resposta = clientes.map(cliente => ({
      ...cliente,
      email: cliente.email ?? undefined,
      telefone: cliente.telefone ?? undefined,
    }));
    sendSuccess(res, 200, resposta);
    return;
  }

  if (req.method === 'GET' && /^\/api\/clientes\/\d+$/.test(pathname)) {
    const id = Number(pathname.split('/').pop());
    const cliente = await getClienteById(id);
    if (!cliente) {
      throw new HttpError(404, 'Cliente não encontrado.');
    }
    sendSuccess(res, 200, {
      ...cliente,
      email: cliente.email ?? undefined,
      telefone: cliente.telefone ?? undefined,
    });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/clientes') {
    const body = await readJsonBody(req);
    const nome = normalizarTexto(body.nome);
    const email = normalizarTexto(body.email);
    const telefone = normalizarTexto(body.telefone);
    if (!nome) {
      throw new HttpError(400, 'Nome é obrigatório.');
    }
    const novo = await addCliente({
      nome,
      email: email || undefined,
      telefone: telefone || undefined,
    });
    sendSuccess(res, 201, novo);
    return;
  }

  if (req.method === 'PUT' && /^\/api\/clientes\/\d+$/.test(pathname)) {
    const id = Number(pathname.split('/').pop());
    const body = await readJsonBody(req);
    const nome = normalizarTexto(body.nome);
    const email = normalizarTexto(body.email);
    const telefone = normalizarTexto(body.telefone);
    if (!nome) {
      throw new HttpError(400, 'Nome é obrigatório.');
    }
    const atualizado = await updateCliente(id, {
      nome,
      email: email || undefined,
      telefone: telefone || undefined,
    });
    if (!atualizado) {
      throw new HttpError(404, 'Cliente não encontrado.');
    }
    sendSuccess(res, 200, atualizado);
    return;
  }

  if (req.method === 'DELETE' && /^\/api\/clientes\/\d+$/.test(pathname)) {
    const id = Number(pathname.split('/').pop());
    if (!id) {
      throw new HttpError(400, 'ID de cliente inválido.');
    }

    const removido = await deleteCliente(id);
    if (!removido) {
      throw new HttpError(404, 'Cliente não encontrado.');
    }

    sendSuccess(res, 200, true);
    return;
  }
  
  if (req.method === 'GET' && pathname === '/api/veiculos') {
    const veiculos = await getVeiculos();
    sendSuccess(res, 200, veiculos);
    return;
  }

  if (req.method === 'GET' && /^\/api\/veiculos\/\d+$/.test(pathname)) {
    const id = Number(pathname.split('/').pop());
    const veiculo = await getVeiculoById(id);
    if (!veiculo) {
      throw new HttpError(404, 'Veículo não encontrado.');
    }
    sendSuccess(res, 200, veiculo);
    return;
  }

  if (req.method === 'POST' && pathname === '/api/veiculos') {
    const body = await readJsonBody(req);
    const placa = normalizarTexto(body.placa);
    const marca = normalizarTexto(body.marca);
    const modelo = normalizarTexto(body.modelo);
    const ano = normalizarTexto(body.ano);
    const clienteId = Number(body.clienteId);
    if (!placa || !marca || !modelo || !ano || !clienteId) {
      throw new HttpError(400, 'Dados obrigatórios ausentes.');
    }
    if (await findVeiculoByPlaca(placa)) {
      throw new HttpError(409, 'Já existe um veículo com esta placa.');
    }
    const novo = await addVeiculo({
      placa: placa.toUpperCase(),
      marca,
      modelo,
      ano,
      clienteId,
    });
    sendSuccess(res, 201, novo);
    return;
  }

  if (req.method === 'PUT' && /^\/api\/veiculos\/\d+$/.test(pathname)) {
    const id = Number(pathname.split('/').pop());
    const body = await readJsonBody(req);
    const placa = normalizarTexto(body.placa);
    const marca = normalizarTexto(body.marca);
    const modelo = normalizarTexto(body.modelo);
    const ano = normalizarTexto(body.ano);
    const clienteId = Number(body.clienteId);
    if (!placa || !marca || !modelo || !ano || !clienteId) {
      throw new HttpError(400, 'Dados obrigatórios ausentes.');
    }
    const existenteComPlaca = await findVeiculoByPlaca(placa);
    if (existenteComPlaca && existenteComPlaca.id !== id) {
      throw new HttpError(409, 'Já existe um veículo com esta placa.');
    }
    const atualizado = await updateVeiculo(id, {
      placa: placa.toUpperCase(),
      marca,
      modelo,
      ano,
      clienteId,
    });
    if (!atualizado) {
      throw new HttpError(404, 'Veículo não encontrado.');
    }
    sendSuccess(res, 200, atualizado);
    return;
  }

  if (req.method === 'DELETE' && /^\/api\/veiculos\/\d+$/.test(pathname)) {
    const id = Number(pathname.split('/').pop());
    if (!id) {
      throw new HttpError(400, 'ID de veículo inválido.');
    }

    const removido = await deleteVeiculo(id);
    if (!removido) {
      throw new HttpError(404, 'Veículo não encontrado.');
    }

    sendSuccess(res, 200, true);
    return;
  }

  if (req.method === 'GET' && pathname === '/api/pecas') {
    const pecas = await getPecas();
    sendSuccess(res, 200, pecas);
    return;
  }

  if (req.method === 'GET' && /^\/api\/pecas\/\d+$/.test(pathname)) {
    const id = Number(pathname.split('/').pop());
    const peca = await getPecaById(id);
    if (!peca) {
      throw new HttpError(404, 'Peça não encontrada.');
    }
    sendSuccess(res, 200, peca);
    return;
  }

  if (req.method === 'POST' && pathname === '/api/pecas') {
    const body = await readJsonBody(req);
    const nome = normalizarTexto(body.nome);
    const codigo = normalizarTexto(body.codigo);
    const estoque = Number.isFinite(Number(body.estoque)) ? Number(body.estoque) : 0;
    const preco = Number.isFinite(Number(body.preco)) ? Number(body.preco) : 0;
    if (!nome || !codigo) {
      throw new HttpError(400, 'Nome e código são obrigatórios.');
    }
    const existenteCodigo = await findPecaByCodigo(codigo);
    if (existenteCodigo) {
      throw new HttpError(409, 'Já existe uma peça com este código.');
    }
    const nova = await addPeca({
      nome,
      codigo,
      estoque,
      preco,
    });
    sendSuccess(res, 201, nova);
    return;
  }

  if (req.method === 'PUT' && /^\/api\/pecas\/\d+$/.test(pathname)) {
    const id = Number(pathname.split('/').pop());
    const body = await readJsonBody(req);
    const nome = normalizarTexto(body.nome);
    const codigo = normalizarTexto(body.codigo);
    const estoque = Number.isFinite(Number(body.estoque)) ? Number(body.estoque) : 0;
    const preco = Number.isFinite(Number(body.preco)) ? Number(body.preco) : 0;
    if (!nome || !codigo) {
      throw new HttpError(400, 'Nome e código são obrigatórios.');
    }
    const existenteCodigo = await findPecaByCodigo(codigo);
    if (existenteCodigo && existenteCodigo.id !== id) {
      throw new HttpError(409, 'Já existe uma peça com este código.');
    }
    const atualizada = await updatePeca(id, {
      nome,
      codigo,
      estoque,
      preco,
    });
    if (!atualizada) {
      throw new HttpError(404, 'Peça não encontrada.');
    }
    sendSuccess(res, 200, atualizada);
    return;
  }

  if (req.method === 'DELETE' && /^\/api\/pecas\/\d+$/.test(pathname)) {
    const id = Number(pathname.split('/').pop());
    if (!id) {
      throw new HttpError(400, 'ID de peça inválido.');
    }

    const removida = await deletePeca(id);
    if (!removida) {
      throw new HttpError(404, 'Peça não encontrada.');
    }

    sendSuccess(res, 200, true);
    return;
  }


  if (req.method === 'GET' && pathname === '/api/servicos') {
    const servicos = await getServicos();
    sendSuccess(res, 200, servicos);
    return;
  }

  if (req.method === 'GET' && /^\/api\/servicos\/\d+$/.test(pathname)) {
    const id = Number(pathname.split('/').pop());
    const servico = await getServicoById(id);
    if (!servico) {
      throw new HttpError(404, 'Serviço não encontrado.');
    }
    sendSuccess(res, 200, servico);
    return;
  }

  if (req.method === 'POST' && pathname === '/api/servicos') {
    const body = await readJsonBody(req);
    const descricao = normalizarTexto(body.descricao);
    const preco = normalizarNumero(body.preco, 0);
    if (!descricao) {
      throw new HttpError(400, 'Descrição é obrigatória.');
    }
    const existente = await findServicoByDescricao(descricao);
    if (existente) {
      throw new HttpError(409, 'Já existe um serviço com esta descrição.');
    }
    const novo = await addServico({ descricao, preco });
    sendSuccess(res, 201, novo);
    return;
  }

  if (req.method === 'PUT' && /^\/api\/servicos\/\d+$/.test(pathname)) {
    const id = Number(pathname.split('/').pop());
    const body = await readJsonBody(req);
    const descricao = normalizarTexto(body.descricao);
    const preco = normalizarNumero(body.preco, 0);
    if (!descricao) {
      throw new HttpError(400, 'Descrição é obrigatória.');
    }
    const existente = await findServicoByDescricao(descricao);
    if (existente && existente.id !== id) {
      throw new HttpError(409, 'Já existe um serviço com esta descrição.');
    }
    const atualizado = await updateServico(id, { descricao, preco });
    if (!atualizado) {
      throw new HttpError(404, 'Serviço não encontrado.');
    }
    sendSuccess(res, 200, atualizado);
    return;
  }

  if (req.method === 'DELETE' && /^\/api\/servicos\/\d+$/.test(pathname)) {
    const id = Number(pathname.split('/').pop());
    if (!id) {
      throw new HttpError(400, 'ID de serviço inválido.');
    }

    const removido = await deleteServico(id);
    if (!removido) {
      throw new HttpError(404, 'Serviço não encontrado.');
    }

    sendSuccess(res, 200, true);
    return;
  }

  if (req.method === 'GET' && pathname === '/api/ordens-servico') {
    const ordens = await getOrdensServico();
    sendSuccess(res, 200, ordens);
    return;
  }

  if (req.method === 'GET' && /^\/api\/ordens-servico\/\d+$/.test(pathname)) {
    const id = Number(pathname.split('/').pop());
    const ordem = await getOrdemServicoById(id);
    if (!ordem) {
      throw new HttpError(404, 'Ordem de serviço não encontrada.');
    }
    sendSuccess(res, 200, ordem);
    return;
  }

  if (req.method === 'POST' && pathname === '/api/ordens-servico') {
    const body = await readJsonBody(req);
    const resultado = await prepararDadosOrdem(body);
    if (resultado.error) {
      throw new HttpError(400, resultado.error);
    }
    const nova = await addOrdemServico(resultado.dados);
    sendSuccess(res, 201, nova);
    return;
  }

  if (req.method === 'PUT' && /^\/api\/ordens-servico\/\d+$/.test(pathname)) {
    const id = Number(pathname.split('/').pop());
    const body = await readJsonBody(req);
    const resultado = await prepararDadosOrdem(body);
    if (resultado.error) {
      throw new HttpError(400, resultado.error);
    }
    const atualizada = await updateOrdemServico(id, resultado.dados);
    if (!atualizada) {
      throw new HttpError(404, 'Ordem de serviço não encontrada.');
    }
    sendSuccess(res, 200, atualizada);
    return;
  }

  if (req.method === 'DELETE' && /^\/api\/ordens-servico\/\d+$/.test(pathname)) {
    const id = Number(pathname.split('/').pop());
    const removida = await deleteOrdemServico(id);
    if (!removida) {
      throw new HttpError(404, 'Ordem de serviço não encontrada.');
    }
    sendSuccess(res, 200, true);
    return;
  }

  throw new HttpError(404, 'Rota não encontrada.');
}

const server = http.createServer((req, res) => {
  handleRequest(req, res).catch(error => {
    if (error instanceof HttpError) {
      sendError(res, error.status, error.message, error.details);
      return;
    }
    console.error('Erro inesperado:', error); 
    sendError(
      res,
      500,
      'Erro interno do servidor.',
      error instanceof Error ? error.message : error,
    );
  });
});

initializeDatabase()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Servidor da API iniciado em http://localhost:${PORT}`);
    });
  })
  .catch(error => {
    console.error('Não foi possível inicializar o banco de dados.', error);
    process.exit(1);
  });
