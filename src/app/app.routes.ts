import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard.component';
import { EstoqueComponent } from './pages/estoque.component';
import { OrdensServicoComponent } from './pages/ordens-servico.component';
import { ResumoOsComponent } from './pages/resumo-os.component';
import { VeiculosComponent } from './pages/veiculos.component';

export const routes: Routes = [
    { path: 'inicio', component: DashboardComponent },
    { path: 'ordens-servico', component: OrdensServicoComponent },
    { path: 'ordens-servico/:id', component: ResumoOsComponent },
    { path: 'veiculos', component: VeiculosComponent },
    { path: 'estoque', component: EstoqueComponent },
    
    { path: '', redirectTo: '/inicio', pathMatch: 'full' }, // Redireciona a raiz para o dashboard
    { path: '**', redirectTo: '/inicio' } // Rota curinga para qualquer URL inválida
];