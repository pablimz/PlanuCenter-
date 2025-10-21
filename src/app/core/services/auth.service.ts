import { Injectable, computed, signal } from '@angular/core';

export interface UsuarioAutenticado {
  id: string;
  nome: string;
  email: string;
  role: 'admin' | 'atendente' | 'mecanico';
}

type UsuarioPermitido = UsuarioAutenticado & { senha: string };

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly storageKey = 'planucenter.session';

  private readonly usuariosPermitidos: UsuarioPermitido[] = [
    {
      id: 'admin',
      nome: 'Administrador Geral',
      email: 'admin@planucenter.com',
      role: 'admin',
      senha: 'Oficina@123',
    },
    {
      id: 'consultor',
      nome: 'Consultor de Serviços',
      email: 'consultor@planucenter.com',
      role: 'atendente',
      senha: 'Servicos@123',
    },
  ];

  private readonly usuarioState = signal<UsuarioAutenticado | null>(this.restaurarSessao());

  readonly usuarioAtual = computed(() => this.usuarioState());
  readonly autenticado = computed(() => this.usuarioState() !== null);

  login(email: string, senha: string) {
    const normalizado = email.trim().toLowerCase();
    const credencial = this.usuariosPermitidos.find(
      usuario => usuario.email === normalizado && usuario.senha === senha,
    );

    if (!credencial) {
      return false;
    }

    const usuario: UsuarioAutenticado = {
      id: credencial.id,
      nome: credencial.nome,
      email: credencial.email,
      role: credencial.role,
    };

    this.usuarioState.set(usuario);
    this.persistirSessao(usuario);
    return true;
  }

  logout() {
    this.usuarioState.set(null);
    this.persistirSessao(null);
  }

  private restaurarSessao(): UsuarioAutenticado | null {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const salvo = window.localStorage.getItem(this.storageKey);
      if (!salvo) {
        return null;
      }
      const dados = JSON.parse(salvo) as UsuarioAutenticado | null;
      return dados ?? null;
    } catch (error) {
      console.warn('Não foi possível restaurar a sessão salva.', error);
      return null;
    }
  }

  private persistirSessao(usuario: UsuarioAutenticado | null) {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      if (!usuario) {
        window.localStorage.removeItem(this.storageKey);
        return;
      }
      window.localStorage.setItem(this.storageKey, JSON.stringify(usuario));
    } catch (error) {
      console.warn('Não foi possível persistir a sessão.', error);
    }
  }
}
