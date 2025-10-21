# Teste3

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.1.6.

## Development server

This project now possui um backend Node.js simples responsável por persistir os dados em `server/database.json`. Para desenvolver:

1. Em um terminal, inicie a API local:

   ```bash
   npm run server
   ```

   O serviço estará disponível em `http://localhost:3000/api`.

2. Em outro terminal, suba a aplicação Angular:

   ```bash
   ng serve
   ```

   Acesse `http://localhost:4200/` no navegador. As alterações nos arquivos front-end recarregam automaticamente a página.

> **Evite erros no console**: Se o frontend for aberto sem a API rodando, as chamadas HTTP resultarão em mensagens de erro. O serviço de dados agora entra automaticamente em um **modo offline** e exibe informações locais somente leitura, mas para trabalhar com dados reais (e impedir as mensagens de erro) mantenha `npm run server` ativo em paralelo ao `ng serve`.

### Credenciais de acesso de demonstração

O painel exige autenticação. Utilize um dos logins abaixo para acessar todos os recursos da oficina:

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Administrador | `admin@planucenter.com` | `Oficina@123` |
| Consultor de serviços | `consultor@planucenter.com` | `Servicos@123` |

### Principais funcionalidades

- **Gestão de ordens de serviço completa**: criação, edição, exclusão, seleção de serviços e peças com cálculo automático dos totais.
- **Resumo com impressão em PDF**: cada ordem possui um resumo detalhado com botão de impressão dedicado.
- **Filtros instantâneos** em todas as listas (clientes, veículos, estoque e ordens) para localizar registros rapidamente.
- **Ações administrativas seguras**: exclusão de clientes, veículos, peças e ordens diretamente das telas de edição, com confirmação.
- **Modo offline inteligente**: caso a API fique indisponível, os dados locais continuam acessíveis e sincronizam assim que o servidor volta a responder.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
