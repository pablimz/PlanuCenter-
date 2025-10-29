const http = require('http');
const { URL } = require('url');
const {
  getClientes,
  addCliente,
  updateCliente,
  getVeiculos,
  addVeiculo,
  updateVeiculo,
  getPecas,
  addPeca,
  updatePeca,
  getServicos,
  addServico,
  updateServico,
  getOrdensServico,
  addOrdemServico,
  updateOrdemServico,
  deleteOrdemServico
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

function parseBody(req, res, callback) {
  const chunks = [];
  req.on('data', chunk => chunks.push(chunk));
  req.on('end', () => {
    if (chunks.length === 0) {
      callback({});
      return;
    }

    try {
      const body = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
      callback(body);
    } catch (error) {
      sendError(res, 400, 'JSON inválido no corpo da requisição.', error instanceof Error ? error.message : undefined);
    }
  });
}

function mapVeiculo(veiculo) {
  const cliente = getClientes().find(clienteAtual => clienteAtual.id === veiculo.clienteId);
  return {
    ...veiculo,
    clienteNome: cliente ? cliente.nome : 'Cliente não encontrado'
  };
}

function mapOrdem(ordem) {
  return {
    ...ordem,
    observacoes: ordem.observacoes || undefined,
    totais: calcularTotaisOrdem(ordem),
  };
}

function calcularTotaisOrdem(ordem) {
  const servicosCatalogo = getServicos();
  const pecasCatalogo = getPecas();
  const totalServicos = Array.isArray(ordem.servicos)
    ? ordem.servicos.reduce((total, item) => {
        const servico = servicosCatalogo.find(servicoAtual => servicoAtual.id === item.id);
        const preco = servico?.preco ?? 0;
        return total + preco * (item.qtde ?? 0);
      }, 0)
    : 0;
  const totalPecas = Array.isArray(ordem.pecas)
    ? ordem.pecas.reduce((total, item) => {
        const peca = pecasCatalogo.find(pecaAtual => pecaAtual.id === item.id);
        const preco = peca?.preco ?? 0;
        return total + preco * (item.qtde ?? 0);
      }, 0)
    : 0;
  return {
    totalServicos,
    totalPecas,
    totalGeral: totalServicos + totalPecas,
  };
}

const STATUS_VALIDOS = new Set([
  'Em Andamento',
  'Aguardando Aprovação',
  'Finalizada',
  'Cancelada'
]);

function normalizarTexto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

function normalizarNumero(valor, padrao = 0) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : padrao;
}

function gerarCodigoPeca(nome) {
  const base = normalizarTexto(nome).replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'PECA';
  const pecas = getPecas();
  let codigo = base.slice(0, 8) || 'PECA';
  let contador = 1;
  while (pecas.some(peca => peca.codigo?.toUpperCase() === codigo)) {
    const sufixo = String(contador).padStart(2, '0');
    const prefixo = base.slice(0, Math.max(0, 8 - sufixo.length)) || 'PC';
    codigo = `${prefixo}${sufixo}`;
    contador += 1;
  }
  return codigo;
}

function gerarPlacaGenerica(baseTexto) {
  const base = normalizarTexto(baseTexto).replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'VEICULO';
  const veiculos = getVeiculos();
  let tentativa = base.slice(0, 7) || 'VEICULO';
  let contador = 1;
  while (veiculos.some(veiculo => veiculo.placa?.toUpperCase() === tentativa)) {
    const sufixo = String(contador).padStart(2, '0');
    const prefixo = base.slice(0, Math.max(0, 7 - sufixo.length)) || 'VEIC';
    tentativa = `${prefixo}${sufixo}`;
    contador += 1;
  }
  return tentativa;
}

function garantirClienteEntidade(info = {}) {
  const id = Number(info.id);
  const nome = normalizarTexto(info.nome);
  if (id) {
    const existente = getClientes().find(cliente => cliente.id === id);
    if (existente) {
      if (nome && existente.nome !== nome) {
        updateCliente(id, {
          nome,
          email: existente.email || undefined,
          telefone: existente.telefone || undefined
        });
      }
      return id;
    }
  }
  if (!nome) {
    throw new Error('CLIENTE_INVALIDO');
  }
  const existentePorNome = getClientes().find(
    cliente => cliente.nome?.trim().toLowerCase() === nome.toLowerCase()
  );
  if (existentePorNome) {
    return existentePorNome.id;
  }
  const novo = addCliente({ nome });
  return novo.id;
}

function garantirVeiculoEntidade(info = {}, clienteId) {
  const id = Number(info.id);
  if (!clienteId) {
    throw new Error('VEICULO_INVALIDO');
  }
  if (id) {
    const existente = getVeiculos().find(veiculo => veiculo.id === id);
    if (existente) {
      const placa = normalizarTexto(info.placa) || existente.placa;
      const marca = normalizarTexto(info.marca) || existente.marca;
      const modelo = normalizarTexto(info.modelo) || existente.modelo;
      const ano = normalizarTexto(info.ano) || existente.ano;
      const atualizados = {
        placa: (placa || existente.placa).toUpperCase(),
        marca: marca || existente.marca,
        modelo: modelo || existente.modelo,
        ano: ano || existente.ano,
        clienteId
      };
      updateVeiculo(id, atualizados);
      return id;
    }
  }

  const veiculos = getVeiculos();
  const placaInformada = normalizarTexto(info.placa);
  const descricao = normalizarTexto(info.descricao);
  const placaCandidata = placaInformada ? placaInformada.toUpperCase() : gerarPlacaGenerica(descricao || 'VEICULO');
  const existentePorPlaca = veiculos.find(
    veiculo => veiculo.placa?.toLowerCase() === placaCandidata.toLowerCase()
  );
  if (existentePorPlaca) {
    const marca = normalizarTexto(info.marca) || existentePorPlaca.marca;
    const modelo = normalizarTexto(info.modelo) || existentePorPlaca.modelo;
    const ano = normalizarTexto(info.ano) || existentePorPlaca.ano;
    updateVeiculo(existentePorPlaca.id, {
      placa: existentePorPlaca.placa,
      marca,
      modelo,
      ano,
      clienteId
    });
    return existentePorPlaca.id;
  }

  const marca = normalizarTexto(info.marca) || descricao || placaCandidata;
  const modelo = normalizarTexto(info.modelo) || descricao || placaCandidata;
  const ano = normalizarTexto(info.ano) || new Date().getFullYear().toString();
  const novo = addVeiculo({
    placa: placaCandidata,
    marca: marca || placaCandidata,
    modelo: modelo || placaCandidata,
    ano,
    clienteId
  });
  return novo.id;
}

function garantirServicoEntidade(info = {}) {
  const id = Number(info.id);
  const descricao = normalizarTexto(info.descricao);
  const preco = normalizarNumero(info.preco, 0);
  if (id) {
    const existente = getServicos().find(servico => servico.id === id);
    if (existente) {
      const atualizados = {
        descricao: descricao || existente.descricao,
        preco
      };
      updateServico(id, atualizados);
      return id;
    }
  }
  if (!descricao) {
    return null;
  }
  const existenteDescricao = getServicos().find(
    servico => servico.descricao?.trim().toLowerCase() === descricao.toLowerCase()
  );
  if (existenteDescricao) {
    if (preco !== existenteDescricao.preco) {
      updateServico(existenteDescricao.id, {
        descricao: existenteDescricao.descricao,
        preco
      });
    }
    return existenteDescricao.id;
  }
  const novo = addServico({ descricao, preco });
  return novo.id;
}

function garantirPecaEntidade(info = {}) {
  const id = Number(info.id);
  const nome = normalizarTexto(info.nome);
  const preco = normalizarNumero(info.preco, 0);
  if (id) {
    const existente = getPecas().find(peca => peca.id === id);
    if (existente) {
      updatePeca(id, {
        nome: nome || existente.nome,
        codigo: existente.codigo,
        estoque: existente.estoque,
        preco
      });
      return id;
    }
  }
  if (!nome) {
    return null;
  }
  const existenteNome = getPecas().find(
    peca => peca.nome?.trim().toLowerCase() === nome.toLowerCase()
  );
  if (existenteNome) {
    if (preco !== existenteNome.preco) {
      updatePeca(existenteNome.id, {
        nome: existenteNome.nome,
        codigo: existenteNome.codigo,
        estoque: existenteNome.estoque,
        preco
      });
    }
    return existenteNome.id;
  }
  const codigo = gerarCodigoPeca(nome);
  const nova = addPeca({ nome, codigo, estoque: 0, preco });
  return nova.id;
}

function prepararDadosOrdem(body) {
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
      const clienteId = garantirClienteEntidade(body.cliente || {});
      const veiculoId = garantirVeiculoEntidade(body.veiculo || {}, clienteId);

      const servicos = Array.isArray(body.servicos) ? body.servicos : [];
      const pecas = Array.isArray(body.pecas) ? body.pecas : [];

      const servicosSanitizados = servicos.reduce((lista, itemAtual) => {
        const idServico = garantirServicoEntidade(itemAtual || {});
        if (!idServico) {
          return lista;
        }
        const qtde = Math.max(1, Math.trunc(normalizarNumero(itemAtual.qtde, 1)) || 1);
        lista.push({ id: idServico, qtde });
        return lista;
      }, []);

      const pecasSanitizadas = pecas.reduce((lista, itemAtual) => {
        const idPeca = garantirPecaEntidade(itemAtual || {});
        if (!idPeca) {
          return lista;
        }
        const qtde = Math.max(1, Math.trunc(normalizarNumero(itemAtual.qtde, 1)) || 1);
        lista.push({ id: idPeca, qtde });
        return lista;
      }, []);

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
          observacoes: normalizarTexto(body.observacoes) || undefined
        }
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

  const servicos = Array.isArray(body.servicos) ? body.servicos : [];
  const pecas = Array.isArray(body.pecas) ? body.pecas : [];

  const servicosSanitizados = servicos.reduce((lista, itemAtual) => {
    const idServico = Number(itemAtual?.id);
    if (!idServico) {
      return lista;
    }
    const qtde = Math.max(1, Math.trunc(normalizarNumero(itemAtual.qtde, 1)) || 1);
    lista.push({ id: idServico, qtde });
    return lista;
  }, []);

  const pecasSanitizadas = pecas.reduce((lista, itemAtual) => {
    const idPeca = Number(itemAtual?.id);
    if (!idPeca) {
      return lista;
    }
    const qtde = Math.max(1, Math.trunc(normalizarNumero(itemAtual.qtde, 1)) || 1);
    lista.push({ id: idPeca, qtde });
    return lista;
  }, []);

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
      observacoes: normalizarTexto(body.observacoes) || undefined
    }
  };
}

const server = http.createServer((req, res) => {
  if (!req.url) {
    sendError(res, 400, 'Requisição inválida.');
    return;
  }

  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  try {
    if (req.method === 'GET' && pathname === '/api/clientes') {
      const clientes = [...getClientes()].sort((a, b) => b.id - a.id).map(cliente => ({
        ...cliente,
        email: cliente.email || undefined,
        telefone: cliente.telefone || undefined
      }));
      sendSuccess(res, 200, clientes);
      return;
    }

    if (req.method === 'POST' && pathname === '/api/clientes') {
      parseBody(req, res, body => {
        const { nome, email, telefone } = body || {};
        if (!nome || !nome.trim()) {
          sendError(res, 400, 'Nome é obrigatório.');
          return;
        }

        const novo = addCliente({
          nome: nome.trim(),
          email: email?.trim() || undefined,
          telefone: telefone?.trim() || undefined
        });
        sendSuccess(res, 201, novo);
      });
      return;
    }

    if (req.method === 'PUT' && /^\/api\/clientes\/\d+$/.test(pathname)) {
      const id = Number(pathname.split('/').pop());
      parseBody(req, res, body => {
        const { nome, email, telefone } = body || {};
        if (!nome || !nome.trim()) {
          sendError(res, 400, 'Nome é obrigatório.');
          return;
        }
        const atualizado = updateCliente(id, {
          nome: nome.trim(),
          email: email?.trim() || undefined,
          telefone: telefone?.trim() || undefined
        });
        if (!atualizado) {
          sendError(res, 404, 'Cliente não encontrado.');
          return;
        }
        sendSuccess(res, 200, atualizado);
      });
      return;
    }

    if (req.method === 'GET' && pathname === '/api/veiculos') {
      const veiculos = [...getVeiculos()].sort((a, b) => b.id - a.id).map(mapVeiculo);
      sendSuccess(res, 200, veiculos);
      return;
    }

    if (req.method === 'POST' && pathname === '/api/veiculos') {
      parseBody(req, res, body => {
        const { placa, marca, modelo, ano, clienteId } = body || {};
        if (!placa || !marca || !modelo || !ano || !clienteId) {
          sendError(res, 400, 'Dados obrigatórios ausentes.');
          return;
        }
        const jaExiste = getVeiculos().some(v => v.placa.toLowerCase() === placa.trim().toLowerCase());
        if (jaExiste) {
          sendError(res, 409, 'Já existe um veículo com esta placa.');
          return;
        }
        const novo = addVeiculo({
          placa: placa.trim(),
          marca: marca.trim(),
          modelo: modelo.trim(),
          ano: ano.trim(),
          clienteId: Number(clienteId)
        });
        sendSuccess(res, 201, mapVeiculo(novo));
      });
      return;
    }

    if (req.method === 'PUT' && /^\/api\/veiculos\/\d+$/.test(pathname)) {
      const id = Number(pathname.split('/').pop());
      parseBody(req, res, body => {
        const { placa, marca, modelo, ano, clienteId } = body || {};
        if (!placa || !marca || !modelo || !ano || !clienteId) {
          sendError(res, 400, 'Dados obrigatórios ausentes.');
          return;
        }
        const outroVeiculo = getVeiculos().find(v => v.placa.toLowerCase() === placa.trim().toLowerCase() && v.id !== id);
        if (outroVeiculo) {
          sendError(res, 409, 'Já existe um veículo com esta placa.');
          return;
        }
        const atualizado = updateVeiculo(id, {
          placa: placa.trim(),
          marca: marca.trim(),
          modelo: modelo.trim(),
          ano: ano.trim(),
          clienteId: Number(clienteId)
        });
        if (!atualizado) {
          sendError(res, 404, 'Veículo não encontrado.');
          return;
        }
        sendSuccess(res, 200, mapVeiculo(atualizado));
      });
      return;
    }

    if (req.method === 'GET' && pathname === '/api/pecas') {
      const pecas = [...getPecas()].sort((a, b) => b.id - a.id);
      sendSuccess(res, 200, pecas);
      return;
    }

    if (req.method === 'POST' && pathname === '/api/pecas') {
      parseBody(req, res, body => {
        const { nome, codigo, estoque, preco } = body || {};
        if (!nome || !codigo) {
          sendError(res, 400, 'Nome e código são obrigatórios.');
          return;
        }
        const novo = addPeca({
          nome: nome.trim(),
          codigo: codigo.trim(),
          estoque: Number.isFinite(Number(estoque)) ? Number(estoque) : 0,
          preco: Number.isFinite(Number(preco)) ? Number(preco) : 0
        });
        sendSuccess(res, 201, novo);
      });
      return;
    }

    if (req.method === 'PUT' && /^\/api\/pecas\/\d+$/.test(pathname)) {
      const id = Number(pathname.split('/').pop());
      parseBody(req, res, body => {
        const { nome, codigo, estoque, preco } = body || {};
        if (!nome || !codigo) {
          sendError(res, 400, 'Nome e código são obrigatórios.');
          return;
        }
        const atualizada = updatePeca(id, {
          nome: nome.trim(),
          codigo: codigo.trim(),
          estoque: Number.isFinite(Number(estoque)) ? Number(estoque) : 0,
          preco: Number.isFinite(Number(preco)) ? Number(preco) : 0
        });
        if (!atualizada) {
          sendError(res, 404, 'Peça não encontrada.');
          return;
        }
        sendSuccess(res, 200, atualizada);
      });
      return;
    }

    if (req.method === 'GET' && pathname === '/api/servicos') {
      const servicos = [...getServicos()].sort((a, b) => b.id - a.id);
      sendSuccess(res, 200, servicos);
      return;
    }

    if (req.method === 'GET' && pathname === '/api/ordens-servico') {
      const ordens = [...getOrdensServico()].sort((a, b) => b.id - a.id).map(mapOrdem);
      sendSuccess(res, 200, ordens);
      return;
    }

    if (req.method === 'GET' && /^\/api\/ordens-servico\/\d+$/.test(pathname)) {
      const id = Number(pathname.split('/').pop());
      const ordem = getOrdensServico().find(item => item.id === id);
      if (!ordem) {
        sendError(res, 404, 'Ordem de serviço não encontrada.');
        return;
      }
      sendSuccess(res, 200, mapOrdem(ordem));
      return;
    }

    if (req.method === 'POST' && pathname === '/api/ordens-servico') {
      parseBody(req, res, body => {
        const resultado = prepararDadosOrdem(body);
        if (resultado.error) {
          sendError(res, 400, resultado.error);
          return;
        }
        const nova = addOrdemServico(resultado.dados);
        sendSuccess(res, 201, mapOrdem(nova));
      });
      return;
    }

    if (req.method === 'PUT' && /^\/api\/ordens-servico\/\d+$/.test(pathname)) {
      const id = Number(pathname.split('/').pop());
      parseBody(req, res, body => {
        const resultado = prepararDadosOrdem(body);
        if (resultado.error) {
          sendError(res, 400, resultado.error);
          return;
        }
        const atualizada = updateOrdemServico(id, resultado.dados);
        if (!atualizada) {
          sendError(res, 404, 'Ordem de serviço não encontrada.');
          return;
        }
        sendSuccess(res, 200, mapOrdem(atualizada));
      });
      return;
    }

    if (req.method === 'DELETE' && /^\/api\/ordens-servico\/\d+$/.test(pathname)) {
      const id = Number(pathname.split('/').pop());
      const removida = deleteOrdemServico(id);
      if (!removida) {
        sendError(res, 404, 'Ordem de serviço não encontrada.');
        return;
      }
      sendSuccess(res, 200, true);
      return;
    }

    sendError(res, 404, 'Rota não encontrada.');
  } catch (error) {
    console.error('Erro inesperado:', error);
    sendError(
      res,
      500,
      'Erro interno do servidor.',
      error instanceof Error ? error.message : error,
    );
  }
});

server.listen(PORT, () => {
  console.log(`Servidor da API iniciado em http://localhost:${PORT}`);
});
