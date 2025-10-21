import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard.component';
import { EstoqueComponent } from './pages/estoque.component';
import { OrdensServicoComponent } from './pages/ordens-servico.component';
import { ResumoOsComponent } from './pages/resumo-os.component';
import { VeiculosComponent } from './pages/veiculos.component';
import { LoginComponent } from './pages/login.component';
import { ClientesComponent } from './pages/clientes.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'inicio', component: DashboardComponent, canActivate: [authGuard] },
    { path: 'ordens-servico', component: OrdensServicoComponent, canActivate: [authGuard] },
    { path: 'ordens-servico/:id', component: ResumoOsComponent, canActivate: [authGuard] },
    { path: 'veiculos', component: VeiculosComponent, canActivate: [authGuard] },
    { path: 'estoque', component: EstoqueComponent, canActivate: [authGuard] },
    { path: 'clientes', component: ClientesComponent, canActivate: [authGuard] },

    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: '**', redirectTo: '/login' }
];
