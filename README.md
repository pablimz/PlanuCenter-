# Teste3

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 20.1.6.

## Development server

This project now possui um backend Node.js que persiste os dados em um banco PostgreSQL. Para desenvolver:

1. Em um terminal, inicie a API local:

   ```bash
   npm run server
   ```

   O serviço estará disponível em `http://localhost:3000/api`. Antes de iniciar, configure a conexão com o banco seguindo as instruções abaixo.

2. Em outro terminal, suba a aplicação Angular:

   ```bash
   ng serve
   ```

   Acesse `http://localhost:4200/` no navegador. As alterações nos arquivos front-end recarregam automaticamente a página.

> **Evite erros no console**: Se o frontend for aberto sem a API rodando, as chamadas HTTP resultarão em mensagens de erro. O serviço de dados continua entrando automaticamente em um **modo offline** e exibe informações locais somente leitura, mas para trabalhar com dados reais (e impedir as mensagens de erro) mantenha `npm run server` ativo em paralelo ao `ng serve`.

## Configurando o PostgreSQL

O backend lê as credenciais de acesso ao banco via variáveis de ambiente. Crie um arquivo `.env` na raiz do projeto (ou defina as variáveis diretamente no ambiente) com os campos abaixo:

```ini
# Exemplo básico — ajuste conforme o seu servidor
PGHOST=localhost
PGPORT=5432
PGDATABASE=planucenter
PGUSER=postgres
PGPASSWORD=postgres
# Para provedores gerenciados que exigem SSL, habilite:
# PGSSLMODE=require

# Também é possível utilizar uma string completa:
# DATABASE_URL=postgres://usuario:senha@host:5432/planucenter
```

Após configurar a conexão execute:

```bash
npm install
# (Opcional) Popula o PostgreSQL com os dados de server/database.json caso o banco esteja vazio
npm run db:migrate
```

O arquivo `server/database.json` permanece disponível apenas como fallback offline para o frontend e como fonte de dados para a migração inicial. Em produção os dados oficiais passam a residir exclusivamente no PostgreSQL.

## Auditoria das operações

Toda inserção, atualização ou exclusão nas tabelas de clientes, veículos, peças, serviços e ordens registra automaticamente uma linha em `auditoria_operacoes`. Cada registro inclui a tabela afetada, o ID do item, a ação (`INSERT`, `UPDATE` ou `DELETE`) e os estados anterior/posterior em formato JSON, além do carimbo de data/hora. Esse log pode ser consultado diretamente no banco para rastreabilidade.

### Credenciais de acesso de demonstração

O painel exige autenticação. Utilize um dos logins abaixo para acessar todos os recursos da oficina:

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Administrador | `admin@planucenter.com` | `Oficina@123` |
| Consultor de serviços | `consultor@planucenter.com` | `Servicos@123` |

### Principais funcionalidades

- **Gestão de ordens de serviço completa**: criação, edição, exclusão, seleção de serviços e peças com cálculo automático dos totais.
- **Resumo com impressão em PDF**: cada ordem possui um resumo detalhado com botão de impressão dedicado.
- **Filtros instantâneos** em todas as listas (clientes, estoque e ordens) para localizar registros rapidamente.
- **Ações administrativas seguras**: exclusão de clientes, peças e ordens diretamente das telas de edição, com confirmação.
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
