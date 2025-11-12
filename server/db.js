require('dotenv').config();
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

function carregarEnv(caminho) {
  if (!fs.existsSync(caminho)) {
    return;
  }
  const conteudo = fs.readFileSync(caminho, 'utf-8');
  for (const linhaBruta of conteudo.split(/\r?\n/)) {
    const linha = linhaBruta.trim();
    if (!linha || linha.startsWith('#')) {
      continue;
    }
    const [chave, ...resto] = linha.split('=');
    if (!chave) {
      continue;
    }
    const valor = resto.join('=').trim();
    if (Object.prototype.hasOwnProperty.call(process.env, chave)) {
      continue;
    }
    process.env[chave] = valor.replace(/^['"]|['"]$/g, '');
  }
}

const envPath = path.resolve(process.cwd(), '.env');
carregarEnv(envPath);

const connectionOptions = (() => {
  if (process.env.DATABASE_URL) {
    const sslMode = process.env.PGSSLMODE || process.env.PGSSL || process.env.POSTGRES_SSLMODE;
    const ssl = sslMode && sslMode.toLowerCase() === 'require' ? { rejectUnauthorized: false } : undefined;
    return {
      connectionString: process.env.DATABASE_URL,
      ssl,
    };
  }

  const sslMode = process.env.PGSSLMODE || process.env.PGSSL || process.env.POSTGRES_SSLMODE;
  const ssl = sslMode && sslMode.toLowerCase() === 'require' ? { rejectUnauthorized: false } : undefined;

  return {
    host: process.env.PGHOST || process.env.POSTGRES_HOST || 'localhost',
    port: Number(process.env.PGPORT || process.env.POSTGRES_PORT || 5432),
    database: process.env.PGDATABASE || process.env.POSTGRES_DB || 'planucenter',
    user: process.env.PGUSER || process.env.POSTGRES_USER || 'postgres',
    password: process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD || undefined,
    ssl,
  };
})();

const pool = new Pool(connectionOptions);

pool.on('error', error => {
  console.error('Erro inesperado no pool do PostgreSQL:', error);
});

async function query(text, params = [], client) {
  if (client) {
    return client.query(text, params);
  }
  return pool.query(text, params);
}

async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Falha ao executar ROLLBACK.', rollbackError);
    }
    throw error;
  } finally {
    client.release();
  }
}

async function initializeDatabase() {
  await query(`
    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      nome TEXT NOT NULL,
      email TEXT,
      telefone TEXT,
      endereco_rua TEXT,
      endereco_numero TEXT,
      endereco_cep TEXT,
      endereco_cidade TEXT,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS veiculos (
      id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      placa TEXT NOT NULL UNIQUE,
      marca TEXT NOT NULL,
      modelo TEXT NOT NULL,
      ano TEXT NOT NULL,
      cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS pecas (
      id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      nome TEXT NOT NULL,
      codigo TEXT NOT NULL UNIQUE,
      estoque INTEGER NOT NULL DEFAULT 0,
      preco NUMERIC(12,2) NOT NULL DEFAULT 0,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS servicos (
      id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      descricao TEXT NOT NULL UNIQUE,
      preco NUMERIC(12,2) NOT NULL DEFAULT 0,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS ordens_servico (
      id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
      veiculo_id INTEGER NOT NULL REFERENCES veiculos(id) ON DELETE CASCADE,
      data_entrada DATE NOT NULL,
      status TEXT NOT NULL,
      observacoes TEXT,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS ordens_servico_servicos (
      id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      ordem_servico_id INTEGER NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
      servico_id INTEGER NOT NULL REFERENCES servicos(id) ON DELETE RESTRICT,
      quantidade INTEGER NOT NULL DEFAULT 1
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS ordens_servico_pecas (
      id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      ordem_servico_id INTEGER NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
      peca_id INTEGER NOT NULL REFERENCES pecas(id) ON DELETE RESTRICT,
      quantidade INTEGER NOT NULL DEFAULT 1
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS auditoria_operacoes (
      id BIGSERIAL PRIMARY KEY,
      tabela TEXT NOT NULL,
      registro_id INTEGER NOT NULL,
      acao TEXT NOT NULL CHECK (acao IN ('INSERT', 'UPDATE', 'DELETE')),
      dados_antes JSONB,
      dados_depois JSONB,
      executado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      executado_por TEXT
    );
  `);

  await query(`ALTER TABLE clientes ADD COLUMN IF NOT EXISTS criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW();`);
  await query(`ALTER TABLE clientes ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW();`);
  await query(`ALTER TABLE clientes ADD COLUMN IF NOT EXISTS endereco_rua TEXT;`);
  await query(`ALTER TABLE clientes ADD COLUMN IF NOT EXISTS endereco_numero TEXT;`);
  await query(`ALTER TABLE clientes ADD COLUMN IF NOT EXISTS endereco_cep TEXT;`);
  await query(`ALTER TABLE clientes ADD COLUMN IF NOT EXISTS endereco_cidade TEXT;`);
  await query(`ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW();`);
  await query(`ALTER TABLE veiculos ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW();`);
  await query(`ALTER TABLE pecas ADD COLUMN IF NOT EXISTS criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW();`);
  await query(`ALTER TABLE pecas ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW();`);
  await query(`ALTER TABLE servicos ADD COLUMN IF NOT EXISTS criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW();`);
  await query(`ALTER TABLE servicos ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW();`);
  await query(`ALTER TABLE ordens_servico ADD COLUMN IF NOT EXISTS criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW();`);
  await query(`ALTER TABLE ordens_servico ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW();`);
}

function normalizarRegistro(registro) {
  if (!registro) {
    return null;
  }
  return Object.entries(registro).reduce((acc, [chave, valor]) => {
    acc[chave] = valor === null ? undefined : valor;
    return acc;
  }, {});
}

async function registrarAuditoria(client, tabela, registroId, acao, dadosAntes, dadosDepois, executadoPor = null) {
  await client.query(
    `INSERT INTO auditoria_operacoes (tabela, registro_id, acao, dados_antes, dados_depois, executado_por)
     VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6)`,
    [
      tabela,
      registroId,
      acao,
      dadosAntes ? JSON.stringify(dadosAntes) : null,
      dadosDepois ? JSON.stringify(dadosDepois) : null,
      executadoPor,
    ],
  );
}

function mapCliente(row) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    nome: row.nome,
    email: row.email ?? undefined,
    telefone: row.telefone ?? undefined,
    enderecoRua: row.endereco_rua ?? undefined,
    enderecoNumero: row.endereco_numero ?? undefined,
    enderecoCep: row.endereco_cep ?? undefined,
    enderecoCidade: row.endereco_cidade ?? undefined,
  };
}

async function getClientes() {
  const { rows } = await query(
    `SELECT id, nome, email, telefone, endereco_rua, endereco_numero, endereco_cep, endereco_cidade
     FROM clientes
     ORDER BY id DESC`
  );
  return rows.map(mapCliente);
}

async function getClienteById(id, client) {
  const { rows } = await query(
    `SELECT id, nome, email, telefone, endereco_rua, endereco_numero, endereco_cep, endereco_cidade
     FROM clientes
     WHERE id = $1`,
    [id],
    client,
  );
  return mapCliente(rows[0]);
}

async function findClienteByNome(nome) {
  const { rows } = await query(
    `SELECT id, nome, email, telefone, endereco_rua, endereco_numero, endereco_cep, endereco_cidade
     FROM clientes
     WHERE LOWER(nome) = LOWER($1)
     LIMIT 1`,
    [nome],
  );
  return mapCliente(rows[0]);
}

async function addCliente({ nome, email, telefone, enderecoRua, enderecoNumero, enderecoCep, enderecoCidade }) {
  return withTransaction(async client => {
    const { rows } = await client.query(
      `INSERT INTO clientes (nome, email, telefone, endereco_rua, endereco_numero, endereco_cep, endereco_cidade)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, nome, email, telefone, endereco_rua, endereco_numero, endereco_cep, endereco_cidade`,
      [
        nome,
        email ?? null,
        telefone ?? null,
        enderecoRua ?? null,
        enderecoNumero ?? null,
        enderecoCep ?? null,
        enderecoCidade ?? null,
      ],
    );
    const cliente = mapCliente(rows[0]);
    await registrarAuditoria(client, 'clientes', cliente.id, 'INSERT', null, cliente);
    return cliente;
  });
}

async function updateCliente(id, { nome, email, telefone, enderecoRua, enderecoNumero, enderecoCep, enderecoCidade }) {
  return withTransaction(async client => {
    const anterior = await getClienteById(id, client);
    if (!anterior) {
      return null;
    }
    const { rows } = await client.query(
      `UPDATE clientes
       SET nome = $1,
           email = $2,
           telefone = $3,
           endereco_rua = $4,
           endereco_numero = $5,
           endereco_cep = $6,
           endereco_cidade = $7,
           atualizado_em = NOW()
       WHERE id = $8
       RETURNING id, nome, email, telefone, endereco_rua, endereco_numero, endereco_cep, endereco_cidade`,
      [
        nome,
        email ?? null,
        telefone ?? null,
        enderecoRua ?? null,
        enderecoNumero ?? null,
        enderecoCep ?? null,
        enderecoCidade ?? null,
        id,
      ],
    );
    const atualizado = mapCliente(rows[0]);
    await registrarAuditoria(client, 'clientes', id, 'UPDATE', anterior, atualizado);
    return atualizado;
  });
}

async function deleteCliente(id) {
  return withTransaction(async (client) => {
    const anterior = await getClienteById(id, client);
    if (!anterior) {
      // não existe -> nada pra excluir
      return false;
    }

    // tenta apagar o cliente
    await client.query('DELETE FROM clientes WHERE id = $1', [id]);

    // registra na auditoria
    await registrarAuditoria(
      client,
      'clientes',
      id,
      'DELETE',
      anterior,
      null
    );

    return true;
  });
}

function mapVeiculo(row) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    placa: row.placa,
    marca: row.marca,
    modelo: row.modelo,
    ano: row.ano,
    clienteId: row.cliente_id,
    clienteNome: row.cliente_nome ?? 'Cliente não encontrado',
  };
}

async function getVeiculos() {
  const { rows } = await query(
    `SELECT v.id, v.placa, v.marca, v.modelo, v.ano, v.cliente_id, c.nome AS cliente_nome
     FROM veiculos v
     LEFT JOIN clientes c ON c.id = v.cliente_id
     ORDER BY v.id DESC`
  );
  return rows.map(mapVeiculo);
}

async function getVeiculoById(id, client) {
  const { rows } = await query(
    `SELECT v.id, v.placa, v.marca, v.modelo, v.ano, v.cliente_id, c.nome AS cliente_nome
     FROM veiculos v
     LEFT JOIN clientes c ON c.id = v.cliente_id
     WHERE v.id = $1`,
    [id],
    client,
  );
  return mapVeiculo(rows[0]);
}

async function findVeiculoByPlaca(placa) {
  const { rows } = await query(
    `SELECT v.id, v.placa, v.marca, v.modelo, v.ano, v.cliente_id, c.nome AS cliente_nome
     FROM veiculos v
     LEFT JOIN clientes c ON c.id = v.cliente_id
     WHERE LOWER(v.placa) = LOWER($1)
     LIMIT 1`,
    [placa],
  );
  return mapVeiculo(rows[0]);
}

async function addVeiculo({ placa, marca, modelo, ano, clienteId }) {
  return withTransaction(async client => {
    const { rows } = await client.query(
      `INSERT INTO veiculos (placa, marca, modelo, ano, cliente_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [placa, marca, modelo, ano, clienteId],
    );
    const id = rows[0].id;
    const veiculo = await getVeiculoById(id, client);
    await registrarAuditoria(client, 'veiculos', id, 'INSERT', null, veiculo);
    return veiculo;
  });
}

async function updateVeiculo(id, { placa, marca, modelo, ano, clienteId }) {
  return withTransaction(async client => {
    const anterior = await getVeiculoById(id, client);
    if (!anterior) {
      return null;
    }
    await client.query(
      `UPDATE veiculos
       SET placa = $1, marca = $2, modelo = $3, ano = $4, cliente_id = $5, atualizado_em = NOW()
       WHERE id = $6`,
      [placa, marca, modelo, ano, clienteId, id],
    );
    const atualizado = await getVeiculoById(id, client);
    await registrarAuditoria(client, 'veiculos', id, 'UPDATE', anterior, atualizado);
    return atualizado;
  });
}

async function deleteVeiculo(id) {
  return withTransaction(async client => {
    const anterior = await getVeiculoById(id, client);
    if (!anterior) {
      return false;
    }

    const { rows: ordensRelacionadas } = await client.query(
      'SELECT id FROM ordens_servico WHERE veiculo_id = $1',
      [id],
    );
    for (const ordem of ordensRelacionadas) {
      await removerOrdemServico(client, ordem.id);
    }

    await client.query('DELETE FROM veiculos WHERE id = $1', [id]);
    await registrarAuditoria(client, 'veiculos', id, 'DELETE', anterior, null);
    return true;
  });
}

function mapPeca(row) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    nome: row.nome,
    codigo: row.codigo,
    estoque: Number(row.estoque ?? 0),
    preco: Number(row.preco ?? 0),
  };
}

async function getPecas() {
  const { rows } = await query(
    'SELECT id, nome, codigo, estoque, preco FROM pecas ORDER BY id DESC'
  );
  return rows.map(mapPeca);
}

async function getPecaById(id, client) {
  const { rows } = await query(
    'SELECT id, nome, codigo, estoque, preco FROM pecas WHERE id = $1',
    [id],
    client,
  );
  return mapPeca(rows[0]);
}

async function findPecaByNome(nome) {
  const { rows } = await query(
    'SELECT id, nome, codigo, estoque, preco FROM pecas WHERE LOWER(nome) = LOWER($1) LIMIT 1',
    [nome],
  );
  return mapPeca(rows[0]);
}

async function findPecaByCodigo(codigo) {
  const { rows } = await query(
    'SELECT id, nome, codigo, estoque, preco FROM pecas WHERE LOWER(codigo) = LOWER($1) LIMIT 1',
    [codigo],
  );
  return mapPeca(rows[0]);
}

async function addPeca({ nome, codigo, estoque = 0, preco = 0 }) {
  return withTransaction(async client => {
    const { rows } = await client.query(
      `INSERT INTO pecas (nome, codigo, estoque, preco)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nome, codigo, estoque, preco`,
      [nome, codigo, estoque, preco],
    );
    const peca = mapPeca(rows[0]);
    await registrarAuditoria(client, 'pecas', peca.id, 'INSERT', null, peca);
    return peca;
  });
}

async function updatePeca(id, { nome, codigo, estoque = 0, preco = 0 }) {
  return withTransaction(async client => {
    const anterior = await getPecaById(id, client);
    if (!anterior) {
      return null;
    }
    const { rows } = await client.query(
      `UPDATE pecas
       SET nome = $1, codigo = $2, estoque = $3, preco = $4, atualizado_em = NOW()
       WHERE id = $5
       RETURNING id, nome, codigo, estoque, preco`,
      [nome, codigo, estoque, preco, id],
    );
    const atualizado = mapPeca(rows[0]);
    await registrarAuditoria(client, 'pecas', id, 'UPDATE', anterior, atualizado);
    return atualizado;
  });
}

async function deletePeca(id) {
  return withTransaction(async (client) => {
    const anterior = await getPecaById(id, client);
    if (!anterior) {
      return false;
    }

    await client.query(
      'DELETE FROM ordens_servico_pecas WHERE peca_id = $1',
      [id]
    );

    await client.query('DELETE FROM pecas WHERE id = $1', [id]);

    await registrarAuditoria(
      client,
      'pecas',
      id,
      'DELETE',
      anterior,
      null
    );

    return true;
  });
}

function mapServico(row) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    descricao: row.descricao,
    preco: Number(row.preco ?? 0),
  };
}

async function getServicos() {
  const { rows } = await query(
    'SELECT id, descricao, preco FROM servicos ORDER BY id DESC'
  );
  return rows.map(mapServico);
}

async function getServicoById(id, client) {
  const { rows } = await query(
    'SELECT id, descricao, preco FROM servicos WHERE id = $1',
    [id],
    client,
  );
  return mapServico(rows[0]);
}

async function findServicoByDescricao(descricao) {
  const { rows } = await query(
    'SELECT id, descricao, preco FROM servicos WHERE LOWER(descricao) = LOWER($1) LIMIT 1',
    [descricao],
  );
  return mapServico(rows[0]);
}

async function addServico({ descricao, preco = 0 }) {
  return withTransaction(async client => {
    const { rows } = await client.query(
      `INSERT INTO servicos (descricao, preco)
       VALUES ($1, $2)
       RETURNING id, descricao, preco`,
      [descricao, preco],
    );
    const servico = mapServico(rows[0]);
    await registrarAuditoria(client, 'servicos', servico.id, 'INSERT', null, servico);
    return servico;
  });
}

async function updateServico(id, { descricao, preco = 0 }) {
  return withTransaction(async client => {
    const anterior = await getServicoById(id, client);
    if (!anterior) {
      return null;
    }
    const { rows } = await client.query(
      `UPDATE servicos
       SET descricao = $1, preco = $2, atualizado_em = NOW()
       WHERE id = $3
       RETURNING id, descricao, preco`,
      [descricao, preco, id],
    );
    const atualizado = mapServico(rows[0]);
    await registrarAuditoria(client, 'servicos', id, 'UPDATE', anterior, atualizado);
    return atualizado;
  });
}

async function deleteServico(id) {
  return withTransaction(async client => {
    const anterior = await getServicoById(id, client);
    if (!anterior) {
      return false;
    }

    await client.query('DELETE FROM ordens_servico_servicos WHERE servico_id = $1', [id]);
    await client.query('DELETE FROM servicos WHERE id = $1', [id]);
    await registrarAuditoria(client, 'servicos', id, 'DELETE', anterior, null);
    return true;
  });
}

function mapItensArray(valor) {
  if (!Array.isArray(valor)) {
    return [];
  }
  return valor.map(item => ({
    id: Number(item.id),
    qtde: Number(item.qtde),
  }));
}

function mapOrdem(row) {
  if (!row) {
    return null;
  }
  const totalServicos = Number(row.total_servicos ?? 0);
  const totalPecas = Number(row.total_pecas ?? 0);
  const ordem = {
    id: row.id,
    clienteId: row.cliente_id,
    veiculoId: row.veiculo_id,
    dataEntrada: row.data_entrada,
    status: row.status,
    servicos: mapItensArray(row.servicos),
    pecas: mapItensArray(row.pecas),
    observacoes: row.observacoes ?? undefined,
  };
  ordem.totais = {
    totalServicos,
    totalPecas,
    totalGeral: totalServicos + totalPecas,
  };
  return ordem;
}

async function carregarOrdemCompleta(id, client) {
  const { rows } = await query(
    `SELECT os.id, os.cliente_id, os.veiculo_id,
            TO_CHAR(os.data_entrada, 'YYYY-MM-DD') AS data_entrada,
            os.status, os.observacoes,
            servicos.items AS servicos,
            pecas.items AS pecas,
            servicos.total AS total_servicos,
            pecas.total AS total_pecas
     FROM ordens_servico os
     LEFT JOIN LATERAL (
       SELECT json_agg(json_build_object('id', oss.servico_id, 'qtde', oss.quantidade) ORDER BY oss.id) AS items,
              SUM(oss.quantidade * s.preco) AS total
       FROM ordens_servico_servicos oss
       JOIN servicos s ON s.id = oss.servico_id
       WHERE oss.ordem_servico_id = os.id
     ) servicos ON TRUE
     LEFT JOIN LATERAL (
       SELECT json_agg(json_build_object('id', osp.peca_id, 'qtde', osp.quantidade) ORDER BY osp.id) AS items,
              SUM(osp.quantidade * p.preco) AS total
       FROM ordens_servico_pecas osp
       JOIN pecas p ON p.id = osp.peca_id
       WHERE osp.ordem_servico_id = os.id
     ) pecas ON TRUE
     WHERE os.id = $1`,
    [id],
    client,
  );
  return mapOrdem(rows[0]);
}

async function getOrdensServico() {
  const { rows } = await query(
    `SELECT os.id, os.cliente_id, os.veiculo_id,
            TO_CHAR(os.data_entrada, 'YYYY-MM-DD') AS data_entrada,
            os.status, os.observacoes,
            servicos.items AS servicos,
            pecas.items AS pecas,
            servicos.total AS total_servicos,
            pecas.total AS total_pecas
     FROM ordens_servico os
     LEFT JOIN LATERAL (
       SELECT json_agg(json_build_object('id', oss.servico_id, 'qtde', oss.quantidade) ORDER BY oss.id) AS items,
              SUM(oss.quantidade * s.preco) AS total
       FROM ordens_servico_servicos oss
       JOIN servicos s ON s.id = oss.servico_id
       WHERE oss.ordem_servico_id = os.id
     ) servicos ON TRUE
     LEFT JOIN LATERAL (
       SELECT json_agg(json_build_object('id', osp.peca_id, 'qtde', osp.quantidade) ORDER BY osp.id) AS items,
              SUM(osp.quantidade * p.preco) AS total
       FROM ordens_servico_pecas osp
       JOIN pecas p ON p.id = osp.peca_id
       WHERE osp.ordem_servico_id = os.id
     ) pecas ON TRUE
     ORDER BY os.id DESC`
  );
  return rows.map(mapOrdem);
}

async function getOrdemServicoById(id) {
  return carregarOrdemCompleta(id);
}

async function inserirServicosDaOrdem(client, ordemId, servicos) {
  if (!Array.isArray(servicos) || !servicos.length) {
    return;
  }
  const values = servicos.map(item => [ordemId, item.id, item.qtde]);
  const placeholders = values
    .map((_, indice) => `($${indice * 3 + 1}, $${indice * 3 + 2}, $${indice * 3 + 3})`)
    .join(', ');
  const flat = values.flat();
  await client.query(
    `INSERT INTO ordens_servico_servicos (ordem_servico_id, servico_id, quantidade)
     VALUES ${placeholders}`,
    flat,
  );
}

async function inserirPecasDaOrdem(client, ordemId, pecas) {
  if (!Array.isArray(pecas) || !pecas.length) {
    return;
  }
  const values = pecas.map(item => [ordemId, item.id, item.qtde]);
  const placeholders = values
    .map((_, indice) => `($${indice * 3 + 1}, $${indice * 3 + 2}, $${indice * 3 + 3})`)
    .join(', ');
  const flat = values.flat();
  await client.query(
    `INSERT INTO ordens_servico_pecas (ordem_servico_id, peca_id, quantidade)
     VALUES ${placeholders}`,
    flat,
  );
}

async function addOrdemServico({ clienteId, veiculoId, dataEntrada, status, servicos, pecas, observacoes }) {
  return withTransaction(async client => {
    const { rows } = await client.query(
      `INSERT INTO ordens_servico (cliente_id, veiculo_id, data_entrada, status, observacoes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [clienteId, veiculoId, dataEntrada, status, observacoes ?? null],
    );
    const ordemId = rows[0].id;
    if (Array.isArray(servicos) && servicos.length) {
      await inserirServicosDaOrdem(client, ordemId, servicos);
    }
    if (Array.isArray(pecas) && pecas.length) {
      await inserirPecasDaOrdem(client, ordemId, pecas);
    }
    const ordem = await carregarOrdemCompleta(ordemId, client);
    await registrarAuditoria(client, 'ordens_servico', ordemId, 'INSERT', null, ordem);
    return ordem;
  });
}

async function updateOrdemServico(id, { clienteId, veiculoId, dataEntrada, status, servicos, pecas, observacoes }) {
  return withTransaction(async client => {
    const anterior = await carregarOrdemCompleta(id, client);
    if (!anterior) {
      return null;
    }
    await client.query(
      `UPDATE ordens_servico
       SET cliente_id = $1, veiculo_id = $2, data_entrada = $3, status = $4, observacoes = $5, atualizado_em = NOW()
       WHERE id = $6`,
      [clienteId, veiculoId, dataEntrada, status, observacoes ?? null, id],
    );
    await client.query('DELETE FROM ordens_servico_servicos WHERE ordem_servico_id = $1', [id]);
    await client.query('DELETE FROM ordens_servico_pecas WHERE ordem_servico_id = $1', [id]);
    if (Array.isArray(servicos) && servicos.length) {
      await inserirServicosDaOrdem(client, id, servicos);
    }
    if (Array.isArray(pecas) && pecas.length) {
      await inserirPecasDaOrdem(client, id, pecas);
    }
    const atualizada = await carregarOrdemCompleta(id, client);
    await registrarAuditoria(client, 'ordens_servico', id, 'UPDATE', anterior, atualizada);
    return atualizada;
  });
}

async function removerOrdemServico(client, id) {
  const anterior = await carregarOrdemCompleta(id, client);
  if (!anterior) {
    return false;
  }
  await client.query('DELETE FROM ordens_servico_servicos WHERE ordem_servico_id = $1', [id]);
  await client.query('DELETE FROM ordens_servico_pecas WHERE ordem_servico_id = $1', [id]);
  await client.query('DELETE FROM ordens_servico WHERE id = $1', [id]);
  await registrarAuditoria(client, 'ordens_servico', id, 'DELETE', anterior, null);
  return true;
}

async function deleteOrdemServico(id) {
  return withTransaction(async client => removerOrdemServico(client, id));
}

async function closePool() {
  await pool.end();
}

module.exports = {
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
  closePool,
};
