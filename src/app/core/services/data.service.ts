import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ApiResponse, Cliente, OrdemServico, OrdemServicoPayload, Peca, Servico, Veiculo } from '../models/models';

type OfflineDatabase = {
  clientes: Cliente[];
  veiculos: Veiculo[];
  pecas: Peca[];
  servicos: Servico[];
  ordensServico: OrdemServico[];
};

const OFFLINE_DATA: OfflineDatabase = {
  clientes: [
    { id: 1, nome: 'Carlos Alberto', email: 'carlos.alberto@email.com', telefone: '(11) 91234-5678' },
    { id: 2, nome: 'Joana Pereira', email: 'joana.pereira@email.com', telefone: '(11) 98765-4321' },
    { id: 3, nome: 'Pedro Henrique', email: 'pedro.henrique@email.com', telefone: '(21) 99876-5432' },
    { id: 4, nome: 'João da Silva', email: 'joao.silva@email.com', telefone: '(31) 93456-7890' }
  ],
  veiculos: [
    { id: 1, placa: 'ROZ-1295', marca: 'Toyota', modelo: 'Corolla', ano: '2022', clienteId: 1, clienteNome: 'Carlos Alberto' },
    { id: 2, placa: 'PEA-0M40', marca: 'Honda', modelo: 'Civic', ano: '2021', clienteId: 3, clienteNome: 'Pedro Henrique' },
    { id: 3, placa: 'LBT-3954', marca: 'Ford', modelo: 'Ranger', ano: '2023', clienteId: 4, clienteNome: 'João da Silva' },
    { id: 4, placa: 'XYZ-7890', marca: 'Chevrolet', modelo: 'Onix', ano: '2020', clienteId: 2, clienteNome: 'Joana Pereira' }
  ],
  pecas: [
    { id: 101, nome: 'Filtro de Óleo', codigo: 'FO-001', estoque: 15, preco: 35 },
    { id: 102, nome: 'Pastilha de Freio', codigo: 'PF-002', estoque: 8, preco: 120.5 },
    { id: 103, nome: 'Vela de Ignição', codigo: 'VI-003', estoque: 32, preco: 25 },
    { id: 104, nome: 'Óleo Motor 5W30', codigo: 'OM-004', estoque: 20, preco: 55 }
  ],
  servicos: [
    { id: 201, descricao: 'Troca de Óleo e Filtro', preco: 150 },
    { id: 202, descricao: 'Alinhamento e Balanceamento', preco: 180 },
    { id: 203, descricao: 'Revisão Sistema de Freios', preco: 250 }
  ],
  ordensServico: [
    {
      id: 974,
      clienteId: 1,
      veiculoId: 1,
      dataEntrada: '2025-09-07',
      status: 'Em Andamento',
      servicos: [{ id: 201, qtde: 1 }],
      pecas: [{ id: 101, qtde: 1 }, { id: 104, qtde: 1 }]
    },
    {
      id: 973,
      clienteId: 1,
      veiculoId: 1,
      dataEntrada: '2025-09-06',
      status: 'Finalizada',
      servicos: [{ id: 202, qtde: 1 }],
      pecas: [],
      observacoes: 'Cliente autorizou serviços adicionais.'
    },
    {
      id: 971,
      clienteId: 3,
      veiculoId: 2,
      dataEntrada: '2025-09-05',
      status: 'Aguardando Aprovação',
      servicos: [{ id: 203, qtde: 1 }],
      pecas: [{ id: 102, qtde: 2 }]
    },
    {
      id: 968,
      clienteId: 4,
      veiculoId: 3,
      dataEntrada: '2025-09-02',
      status: 'Finalizada',
      servicos: [{ id: 201, qtde: 1 }],
      pecas: [{ id: 101, qtde: 1 }, { id: 104, qtde: 1 }],
      observacoes: 'Veículo entregue ao cliente.'
    }
  ]
};

const deepClone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const sortByIdDesc = <T extends { id: number }>(lista: T[]): T[] => [...lista].sort((a, b) => b.id - a.id);

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/api';
  private readonly offlineState: OfflineDatabase = deepClone(OFFLINE_DATA);

  readonly clientes = signal<Cliente[]>([]);
  readonly veiculos = signal<Veiculo[]>([]);
  readonly pecas = signal<Peca[]>([]);
  readonly servicos = signal<Servico[]>([]);
  readonly ordensServico = signal<OrdemServico[]>([]);
  readonly modoOffline = signal(false);

  constructor() {
    void this.carregarDadosIniciais();
  }

  private obterDados<T>(resposta: ApiResponse<T>): T {
    if (!resposta.success || typeof resposta.data === 'undefined') {
      throw new Error(resposta.message ?? 'Operação não pôde ser concluída.');
    }
    return resposta.data;
  }

  private garantirSucesso(resposta: ApiResponse<unknown>) {
    if (!resposta.success) {
      throw new Error(resposta.message ?? 'Operação não pôde ser concluída.');
    }
  }

  async carregarDadosIniciais() {
    await Promise.all([
      this.carregarClientes(),
      this.carregarVeiculos(),
      this.carregarPecas(),
      this.carregarServicos(),
      this.carregarOrdensServico(),
    ]);
  }

  async carregarClientes() {
    if (this.modoOffline()) {
      this.reaplicarClientesOffline();
      return;
    }
    try {
      const resposta = await firstValueFrom(this.http.get<ApiResponse<Cliente[]>>(`${this.apiUrl}/clientes`));
      const clientes = this.obterDados(resposta);
      this.atualizarClientes(clientes);
    } catch (error) {
      console.error('Erro ao carregar clientes', error);
      this.ativarModoOffline();
    }
  }

  async criarCliente(dados: Omit<Cliente, 'id'>) {
    if (this.modoOffline()) {
      return this.criarClienteOffline(dados);
    }

    try {
      const resposta = await firstValueFrom(this.http.post<ApiResponse<Cliente>>(`${this.apiUrl}/clientes`, dados));
      const novo = this.obterDados(resposta);
      this.clientes.update(lista => [novo, ...lista.filter(cliente => cliente.id !== novo.id)]);
      this.offlineState.clientes = deepClone(this.clientes());
      return novo;
    } catch (error) {
      console.error('Erro ao criar cliente', error);
      this.ativarModoOffline();
      return this.criarClienteOffline(dados);
    }
  }

  async atualizarCliente(id: number, dados: Omit<Cliente, 'id'>) {
    if (this.modoOffline()) {
      return this.atualizarClienteOffline(id, dados);
    }

    try {
      const resposta = await firstValueFrom(this.http.put<ApiResponse<Cliente>>(`${this.apiUrl}/clientes/${id}`, dados));
      const atualizado = this.obterDados(resposta);
      this.clientes.update(lista => lista.map(cliente => (cliente.id === id ? atualizado : cliente)));
      this.offlineState.clientes = deepClone(this.clientes());
      await this.carregarVeiculos();
      return atualizado;
    } catch (error) {
      console.error('Erro ao atualizar cliente', error);
      this.ativarModoOffline();
      return this.atualizarClienteOffline(id, dados);
    }
  }

  async excluirCliente(id: number) {
    if (this.modoOffline()) {
      return this.excluirClienteOffline(id);
    }

    try {
      const resposta = await firstValueFrom(this.http.delete<ApiResponse<unknown>>(`${this.apiUrl}/clientes/${id}`));
      this.garantirSucesso(resposta);
      this.clientes.update(lista => lista.filter(cliente => cliente.id !== id));
      this.veiculos.update(lista => lista.filter(veiculo => veiculo.clienteId !== id));
      this.ordensServico.update(lista => lista.filter(ordem => ordem.clienteId !== id));
      this.offlineState.clientes = deepClone(this.clientes());
      this.offlineState.veiculos = deepClone(this.veiculos());
      this.offlineState.ordensServico = deepClone(this.ordensServico());
      return true;
    } catch (error) {
      console.error('Erro ao excluir cliente', error);
      this.ativarModoOffline();
      return this.excluirClienteOffline(id);
    }
  }

  async carregarVeiculos() {
    if (this.modoOffline()) {
      this.reaplicarVeiculosOffline();
      return;
    }
    try {
      const resposta = await firstValueFrom(this.http.get<ApiResponse<Veiculo[]>>(`${this.apiUrl}/veiculos`));
      const veiculos = this.obterDados(resposta);
      this.atualizarVeiculos(veiculos);
    } catch (error) {
      console.error('Erro ao carregar veículos', error);
      this.ativarModoOffline();
    }
  }

  async criarVeiculo(dados: Omit<Veiculo, 'id' | 'clienteNome'>) {
    if (this.modoOffline()) {
      return this.criarVeiculoOffline(dados);
    }

    try {
      const resposta = await firstValueFrom(this.http.post<ApiResponse<Veiculo>>(`${this.apiUrl}/veiculos`, dados));
      const novo = this.obterDados(resposta);
      this.veiculos.update(lista => [novo, ...lista.filter(veiculo => veiculo.id !== novo.id)]);
      this.offlineState.veiculos = deepClone(this.veiculos());
      return novo;
    } catch (error) {
      console.error('Erro ao criar veículo', error);
      this.ativarModoOffline();
      return this.criarVeiculoOffline(dados);
    }
  }

  async atualizarVeiculo(id: number, dados: Omit<Veiculo, 'id' | 'clienteNome'>) {
    if (this.modoOffline()) {
      return this.atualizarVeiculoOffline(id, dados);
    }

    try {
      const resposta = await firstValueFrom(this.http.put<ApiResponse<Veiculo>>(`${this.apiUrl}/veiculos/${id}`, dados));
      const atualizado = this.obterDados(resposta);
      this.veiculos.update(lista => lista.map(veiculo => (veiculo.id === id ? atualizado : veiculo)));
      this.offlineState.veiculos = deepClone(this.veiculos());
      return atualizado;
    } catch (error) {
      console.error('Erro ao atualizar veículo', error);
      this.ativarModoOffline();
      return this.atualizarVeiculoOffline(id, dados);
    }
  }

  async excluirVeiculo(id: number) {
    if (this.modoOffline()) {
      return this.excluirVeiculoOffline(id);
    }

    try {
      const resposta = await firstValueFrom(this.http.delete<ApiResponse<unknown>>(`${this.apiUrl}/veiculos/${id}`));
      this.garantirSucesso(resposta);
      this.veiculos.update(lista => lista.filter(veiculo => veiculo.id !== id));
      this.ordensServico.update(lista => lista.filter(ordem => ordem.veiculoId !== id));
      this.offlineState.veiculos = deepClone(this.veiculos());
      this.offlineState.ordensServico = deepClone(this.ordensServico());
      return true;
    } catch (error) {
      console.error('Erro ao excluir veículo', error);
      this.ativarModoOffline();
      return this.excluirVeiculoOffline(id);
    }
  }

  async carregarPecas() {
    if (this.modoOffline()) {
      this.reaplicarPecasOffline();
      return;
    }
    try {
      const resposta = await firstValueFrom(this.http.get<ApiResponse<Peca[]>>(`${this.apiUrl}/pecas`));
      const pecas = this.obterDados(resposta);
      this.atualizarPecas(pecas);
    } catch (error) {
      console.error('Erro ao carregar peças', error);
      this.ativarModoOffline();
    }
  }

  async criarPeca(dados: Omit<Peca, 'id'>) {
    if (this.modoOffline()) {
      return this.criarPecaOffline(dados);
    }

    try {
      const resposta = await firstValueFrom(this.http.post<ApiResponse<Peca>>(`${this.apiUrl}/pecas`, dados));
      const nova = this.obterDados(resposta);
      this.pecas.update(lista => [nova, ...lista.filter(peca => peca.id !== nova.id)]);
      this.offlineState.pecas = deepClone(this.pecas());
      return nova;
    } catch (error) {
      console.error('Erro ao criar peça', error);
      this.ativarModoOffline();
      return this.criarPecaOffline(dados);
    }
  }

  async atualizarPeca(id: number, dados: Omit<Peca, 'id'>) {
    if (this.modoOffline()) {
      return this.atualizarPecaOffline(id, dados);
    }

    try {
      const resposta = await firstValueFrom(this.http.put<ApiResponse<Peca>>(`${this.apiUrl}/pecas/${id}`, dados));
      const atualizada = this.obterDados(resposta);
      this.pecas.update(lista => lista.map(peca => (peca.id === id ? atualizada : peca)));
      this.offlineState.pecas = deepClone(this.pecas());
      return atualizada;
    } catch (error) {
      console.error('Erro ao atualizar peça', error);
      this.ativarModoOffline();
      return this.atualizarPecaOffline(id, dados);
    }
  }

  async excluirPeca(id: number) {
    if (this.modoOffline()) {
      return this.excluirPecaOffline(id);
    }

    try {
      const resposta = await firstValueFrom(this.http.delete<ApiResponse<unknown>>(`${this.apiUrl}/pecas/${id}`));
      this.garantirSucesso(resposta);
      this.pecas.update(lista => lista.filter(peca => peca.id !== id));
      this.ordensServico.update(lista =>
        lista.map(ordem => ({
          ...ordem,
          pecas: ordem.pecas.filter(item => item.id !== id),
        }))
      );
      this.offlineState.pecas = deepClone(this.pecas());
      this.offlineState.ordensServico = deepClone(this.ordensServico());
      return true;
    } catch (error) {
      console.error('Erro ao excluir peça', error);
      this.ativarModoOffline();
      return this.excluirPecaOffline(id);
    }
  }

  async carregarServicos() {
    if (this.modoOffline()) {
      this.reaplicarServicosOffline();
      return;
    }
    try {
      const resposta = await firstValueFrom(this.http.get<ApiResponse<Servico[]>>(`${this.apiUrl}/servicos`));
      const servicos = this.obterDados(resposta);
      this.atualizarServicos(servicos);
    } catch (error) {
      console.error('Erro ao carregar serviços', error);
      this.ativarModoOffline();
    }
  }

  async carregarOrdensServico() {
    if (this.modoOffline()) {
      this.reaplicarOrdensOffline();
      return;
    }
    try {
      const resposta = await firstValueFrom(this.http.get<ApiResponse<OrdemServico[]>>(`${this.apiUrl}/ordens-servico`));
      const ordens = this.obterDados(resposta);
      this.atualizarOrdens(ordens);
    } catch (error) {
      console.error('Erro ao carregar ordens de serviço', error);
      this.ativarModoOffline();
    }
  }

  async criarOrdemServico(dados: OrdemServicoPayload) {
    if (this.modoOffline()) {
      return this.criarOrdemOffline(dados);
    }

    try {
      const resposta = await firstValueFrom(this.http.post<ApiResponse<OrdemServico>>(`${this.apiUrl}/ordens-servico`, dados));
      const nova = this.obterDados(resposta);
      this.ordensServico.update(lista => [nova, ...lista.filter(ordem => ordem.id !== nova.id)]);
      this.offlineState.ordensServico = deepClone(this.ordensServico());
      await this.recarregarRelacionados();
      return nova;
    } catch (error) {
      console.error('Erro ao criar ordem de serviço', error);
      this.ativarModoOffline();
      return this.criarOrdemOffline(dados);
    }
  }

  async atualizarOrdemServico(id: number, dados: OrdemServicoPayload) {
    if (this.modoOffline()) {
      return this.atualizarOrdemOffline(id, dados);
    }

    try {
      const resposta = await firstValueFrom(this.http.put<ApiResponse<OrdemServico>>(`${this.apiUrl}/ordens-servico/${id}`, dados));
      const atualizada = this.obterDados(resposta);
      this.ordensServico.update(lista => lista.map(ordem => (ordem.id === id ? atualizada : ordem)));
      this.offlineState.ordensServico = deepClone(this.ordensServico());
      await this.recarregarRelacionados();
      return atualizada;
    } catch (error) {
      console.error('Erro ao atualizar ordem de serviço', error);
      this.ativarModoOffline();
      return this.atualizarOrdemOffline(id, dados);
    }
  }

  async excluirOrdemServico(id: number) {
    if (this.modoOffline()) {
      return this.excluirOrdemOffline(id);
    }

    try {
      const resposta = await firstValueFrom(this.http.delete<ApiResponse<unknown>>(`${this.apiUrl}/ordens-servico/${id}`));
      this.garantirSucesso(resposta);
      this.ordensServico.update(lista => lista.filter(ordem => ordem.id !== id));
      this.offlineState.ordensServico = deepClone(this.ordensServico());
      return true;
    } catch (error) {
      console.error('Erro ao excluir ordem de serviço', error);
      this.ativarModoOffline();
      return this.excluirOrdemOffline(id);
    }
  }

  async obterOrdemServicoDetalhado(id: number) {
    if (this.modoOffline()) {
      return this.getOrdemServicoById(id);
    }

    try {
      const resposta = await firstValueFrom(this.http.get<ApiResponse<OrdemServico>>(`${this.apiUrl}/ordens-servico/${id}`));
      const ordem = this.obterDados(resposta);
      this.ordensServico.update(lista => [ordem, ...lista.filter(item => item.id !== ordem.id)]);
      this.offlineState.ordensServico = deepClone(this.ordensServico());
      return ordem;
    } catch (error) {
      console.error('Erro ao carregar ordem de serviço', error);
      this.ativarModoOffline();
      return this.getOrdemServicoById(id);
    }
  }

  getOrdemServicoById(id: number): OrdemServico | undefined {
    return this.ordensServico().find(os => os.id === id);
  }

  private ativarModoOffline() {
    if (this.modoOffline()) {
      return;
    }
    this.modoOffline.set(true);
    console.warn('API indisponível. Entrando em modo offline com dados locais.');
    this.reaplicarClientesOffline();
    this.reaplicarVeiculosOffline();
    this.reaplicarPecasOffline();
    this.reaplicarServicosOffline();
    this.reaplicarOrdensOffline();
  }

  private gerarProximoId(lista: { id: number }[]) {
    return lista.reduce((max, item) => (item.id > max ? item.id : max), 0) + 1;
  }

  private async recarregarRelacionados() {
    if (this.modoOffline()) {
      return;
    }
    await Promise.all([
      this.carregarClientes(),
      this.carregarVeiculos(),
      this.carregarServicos(),
      this.carregarPecas(),
      this.carregarOrdensServico(),
    ]);
  }

  private reaplicarClientesOffline() {
    this.clientes.set(sortByIdDesc(deepClone(this.offlineState.clientes)));
  }

  private reaplicarVeiculosOffline() {
    this.veiculos.set(sortByIdDesc(deepClone(this.offlineState.veiculos)));
  }

  private reaplicarPecasOffline() {
    this.pecas.set(sortByIdDesc(deepClone(this.offlineState.pecas)));
  }

  private reaplicarServicosOffline() {
    this.servicos.set(sortByIdDesc(deepClone(this.offlineState.servicos)));
  }

  private reaplicarOrdensOffline() {
    this.ordensServico.set(sortByIdDesc(deepClone(this.offlineState.ordensServico)));
  }

  private atualizarClientes(clientes: Cliente[]) {
    const ordenados = sortByIdDesc(clientes);
    const copiados = deepClone(ordenados);
    this.clientes.set(copiados);
    this.offlineState.clientes = deepClone(copiados);
  }

  private atualizarVeiculos(veiculos: Veiculo[]) {
    const ordenados = sortByIdDesc(veiculos);
    const copiados = deepClone(ordenados);
    this.veiculos.set(copiados);
    this.offlineState.veiculos = deepClone(copiados);
  }

  private atualizarPecas(pecas: Peca[]) {
    const ordenadas = sortByIdDesc(pecas);
    const copiadas = deepClone(ordenadas);
    this.pecas.set(copiadas);
    this.offlineState.pecas = deepClone(copiadas);
  }

  private atualizarServicos(servicos: Servico[]) {
    const ordenados = sortByIdDesc(servicos);
    const copiados = deepClone(ordenados);
    this.servicos.set(copiados);
    this.offlineState.servicos = deepClone(copiados);
  }

  private atualizarOrdens(ordens: OrdemServico[]) {
    const ordenadas = sortByIdDesc(ordens);
    const copiadas = deepClone(ordenadas);
    this.ordensServico.set(copiadas);
    this.offlineState.ordensServico = deepClone(copiadas);
  }

  private criarClienteOffline(dados: Omit<Cliente, 'id'>) {
    const novo: Cliente = { id: this.gerarProximoId(this.offlineState.clientes), ...dados };
    const atualizados = [novo, ...this.offlineState.clientes];
    this.atualizarClientes(atualizados);
    this.atualizarVeiculos(
      this.offlineState.veiculos.map(veiculo =>
        veiculo.clienteId === novo.id ? { ...veiculo, clienteNome: novo.nome } : veiculo
      )
    );
    return novo;
  }

  private atualizarClienteOffline(id: number, dados: Omit<Cliente, 'id'>) {
    let atualizado: Cliente | undefined;
    const atualizados = this.offlineState.clientes.map(cliente => {
      if (cliente.id === id) {
        atualizado = { ...cliente, ...dados };
        return atualizado;
      }
      return cliente;
    });
    if (!atualizado) {
      return undefined;
    }
    this.atualizarClientes(atualizados);
    this.atualizarVeiculos(
      this.offlineState.veiculos.map(veiculo =>
        veiculo.clienteId === id ? { ...veiculo, clienteNome: atualizado!.nome } : veiculo
      )
    );
    return atualizado;
  }

  private criarVeiculoOffline(dados: Omit<Veiculo, 'id' | 'clienteNome'>) {
    const cliente = this.clientes().find(item => item.id === dados.clienteId);
    const novo: Veiculo = {
      id: this.gerarProximoId(this.offlineState.veiculos),
      ...dados,
      clienteNome: cliente ? cliente.nome : 'Cliente não encontrado'
    };
    const atualizados = [novo, ...this.offlineState.veiculos];
    this.atualizarVeiculos(atualizados);
    return novo;
  }

  private atualizarVeiculoOffline(id: number, dados: Omit<Veiculo, 'id' | 'clienteNome'>) {
    const cliente = this.clientes().find(item => item.id === dados.clienteId);
    let atualizado: Veiculo | undefined;
    const atualizados = this.offlineState.veiculos.map(veiculo => {
      if (veiculo.id === id) {
        atualizado = {
          ...veiculo,
          ...dados,
          clienteNome: cliente ? cliente.nome : 'Cliente não encontrado'
        };
        return atualizado;
      }
      return veiculo;
    });
    if (!atualizado) {
      return undefined;
    }
    this.atualizarVeiculos(atualizados);
    return atualizado;
  }

  private criarPecaOffline(dados: Omit<Peca, 'id'>) {
    const nova: Peca = { id: this.gerarProximoId(this.offlineState.pecas), ...dados };
    const atualizadas = [nova, ...this.offlineState.pecas];
    this.atualizarPecas(atualizadas);
    return nova;
  }

  private criarServicoOffline(dados: Omit<Servico, 'id'>) {
    const novo: Servico = { id: this.gerarProximoId(this.offlineState.servicos), ...dados };
    const atualizados = [novo, ...this.offlineState.servicos];
    this.atualizarServicos(atualizados);
    return novo;
  }

  private atualizarPecaOffline(id: number, dados: Omit<Peca, 'id'>) {
    let atualizada: Peca | undefined;
    const atualizadas = this.offlineState.pecas.map(peca => {
      if (peca.id === id) {
        atualizada = { ...peca, ...dados };
        return atualizada;
      }
      return peca;
    });
    if (!atualizada) {
      return undefined;
    }
    this.atualizarPecas(atualizadas);
    return atualizada;
  }

  private prepararOrdemParaPersistencia(payload: OrdemServicoPayload): Omit<OrdemServico, 'id'> {
    const nomeCliente = payload.cliente.nome?.trim() || 'Cliente';
    const clienteId = this.garantirClienteLocal({ id: payload.cliente.id, nome: nomeCliente });
    const veiculoId = this.garantirVeiculoLocal(payload.veiculo, clienteId);

    const servicos = payload.servicos
      .filter(item => (item.id != null) || item.descricao?.trim())
      .map(item => {
        const descricao = item.descricao?.trim() || 'Serviço';
        const preco = Math.max(0, Number(item.preco) || 0);
        const id = this.garantirServicoLocal({ id: item.id, descricao, preco });
        return { id, qtde: Math.max(1, Number(item.qtde) || 1) };
      });

    const pecas = payload.pecas
      .filter(item => (item.id != null) || item.nome?.trim())
      .map(item => {
        const nome = item.nome?.trim() || 'Peça';
        const preco = Math.max(0, Number(item.preco) || 0);
        const id = this.garantirPecaLocal({ id: item.id, nome, preco });
        return { id, qtde: Math.max(1, Number(item.qtde) || 1) };
      });

    return {
      clienteId,
      veiculoId,
      dataEntrada: payload.dataEntrada,
      status: payload.status,
      observacoes: payload.observacoes,
      servicos,
      pecas,
    };
  }

  private garantirClienteLocal(info: { id?: number; nome: string }) {
    if (info.id) {
      const existente = this.offlineState.clientes.find(cliente => cliente.id === info.id);
      if (existente) {
        return existente.id;
      }
    }
    const nome = info.nome.trim() || 'Cliente';
    const existentePorNome = this.offlineState.clientes.find(cliente => cliente.nome.toLowerCase() === nome.toLowerCase());
    if (existentePorNome) {
      return existentePorNome.id;
    }
    return this.criarClienteOffline({ nome }).id;
  }

  private garantirVeiculoLocal(info: OrdemServicoPayload['veiculo'], clienteId: number) {
    if (info.id) {
      const existente = this.offlineState.veiculos.find(veiculo => veiculo.id === info.id);
      if (existente) {
        if (existente.clienteId !== clienteId) {
          this.atualizarVeiculoOffline(existente.id, {
            placa: existente.placa,
            marca: existente.marca,
            modelo: existente.modelo,
            ano: existente.ano,
            clienteId,
          });
        }
        return existente.id;
      }
    }

    const placaBase = (info.placa || info.descricao || 'VEICULO').trim().toUpperCase();
    const existentePorPlaca = this.offlineState.veiculos.find(veiculo => veiculo.placa.toLowerCase() === placaBase.toLowerCase());
    if (existentePorPlaca) {
      if (existentePorPlaca.clienteId !== clienteId) {
        this.atualizarVeiculoOffline(existentePorPlaca.id, {
          placa: existentePorPlaca.placa,
          marca: existentePorPlaca.marca,
          modelo: existentePorPlaca.modelo,
          ano: existentePorPlaca.ano,
          clienteId,
        });
      }
      return existentePorPlaca.id;
    }

    const marca = info.marca?.trim() || info.descricao?.trim() || placaBase;
    const modelo = info.modelo?.trim() || info.descricao?.trim() || placaBase;
    const ano = info.ano?.trim() || new Date().getFullYear().toString();
    const novo = this.criarVeiculoOffline({
      placa: placaBase,
      marca,
      modelo,
      ano,
      clienteId,
    });
    return novo.id;
  }

  private garantirServicoLocal(info: { id?: number; descricao: string; preco: number }) {
    if (info.id) {
      const existente = this.offlineState.servicos.find(servico => servico.id === info.id);
      if (existente) {
        return existente.id;
      }
    }
    const descricao = info.descricao.trim() || 'Serviço';
    const existenteDescricao = this.offlineState.servicos.find(servico => servico.descricao.toLowerCase() === descricao.toLowerCase());
    if (existenteDescricao) {
      return existenteDescricao.id;
    }
    return this.criarServicoOffline({ descricao, preco: Math.max(0, Number(info.preco) || 0) }).id;
  }

  private garantirPecaLocal(info: { id?: number; nome: string; preco: number }) {
    if (info.id) {
      const existente = this.offlineState.pecas.find(peca => peca.id === info.id);
      if (existente) {
        return existente.id;
      }
    }
    const nome = info.nome.trim() || 'Peça';
    const existenteNome = this.offlineState.pecas.find(peca => peca.nome.toLowerCase() === nome.toLowerCase());
    if (existenteNome) {
      return existenteNome.id;
    }
    const codigo = this.gerarCodigoPeca(nome);
    return this.criarPecaOffline({ nome, codigo, estoque: 0, preco: Math.max(0, Number(info.preco) || 0) }).id;
  }

  private gerarCodigoPeca(nome: string) {
    const base = nome.replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'PECA';
    let codigo = base.slice(0, 8);
    let sufixo = 1;
    while (this.offlineState.pecas.some(peca => peca.codigo === codigo)) {
      codigo = `${base.slice(0, 6)}${String(sufixo).padStart(2, '0')}`;
      sufixo += 1;
    }
    return codigo;
  }

  private criarOrdemOffline(payload: OrdemServicoPayload) {
    const dados = this.prepararOrdemParaPersistencia(payload);
    const nova: OrdemServico = {
      id: this.gerarProximoId(this.offlineState.ordensServico),
      ...dados,
    };
    const atualizadas = [nova, ...this.offlineState.ordensServico];
    this.atualizarOrdens(atualizadas);
    return nova;
  }

  private atualizarOrdemOffline(id: number, payload: OrdemServicoPayload) {
    const dados = this.prepararOrdemParaPersistencia(payload);
    let atualizada: OrdemServico | undefined;
    const atualizadas = this.offlineState.ordensServico.map(ordem => {
      if (ordem.id === id) {
        atualizada = { ...ordem, ...dados, id };
        return atualizada;
      }
      return ordem;
    });
    if (!atualizada) {
      return undefined;
    }
    this.atualizarOrdens(atualizadas);
    return atualizada;
  }

  private excluirClienteOffline(id: number) {
    const clientesRestantes = this.offlineState.clientes.filter(cliente => cliente.id !== id);
    if (clientesRestantes.length === this.offlineState.clientes.length) {
      return false;
    }

    const veiculosRestantes = this.offlineState.veiculos.filter(veiculo => veiculo.clienteId !== id);
    const ordensRestantes = this.offlineState.ordensServico.filter(ordem => ordem.clienteId !== id);

    this.atualizarClientes(clientesRestantes);
    this.atualizarVeiculos(veiculosRestantes);
    this.atualizarOrdens(ordensRestantes);
    return true;
  }

  private excluirVeiculoOffline(id: number) {
    const veiculosRestantes = this.offlineState.veiculos.filter(veiculo => veiculo.id !== id);
    if (veiculosRestantes.length === this.offlineState.veiculos.length) {
      return false;
    }

    const ordensRestantes = this.offlineState.ordensServico.filter(ordem => ordem.veiculoId !== id);
    this.atualizarVeiculos(veiculosRestantes);
    this.atualizarOrdens(ordensRestantes);
    return true;
  }

  private excluirPecaOffline(id: number) {
    const pecasRestantes = this.offlineState.pecas.filter(peca => peca.id !== id);
    if (pecasRestantes.length === this.offlineState.pecas.length) {
      return false;
    }

    const ordensAjustadas = this.offlineState.ordensServico.map(ordem => ({
      ...ordem,
      pecas: ordem.pecas.filter(item => item.id !== id),
    }));

    this.atualizarPecas(pecasRestantes);
    this.atualizarOrdens(ordensAjustadas);
    return true;
  }

  private excluirOrdemOffline(id: number) {
    const ordensRestantes = this.offlineState.ordensServico.filter(ordem => ordem.id !== id);
    if (ordensRestantes.length === this.offlineState.ordensServico.length) {
      return false;
    }

    this.atualizarOrdens(ordensRestantes);
    return true;
  }
}
