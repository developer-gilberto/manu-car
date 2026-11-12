# Política de Privacidade do ManuCar

**Última atualização:** 12/11/2026

O ManuCar ("aplicativo") é um aplicativo para lembrar manutenções do veículo por quilometragem e/ou tempo. Esta política explica quais dados são tratados e como.

## 1. Controlador e contato

- **Desenvolvedor:** Gilberto Lopes
- **E-mail para contato:** developer.gilberto@gmail.com

## 2. Resumo

- O aplicativo **funciona 100% offline**. Não há conta de usuário, login, servidor próprio, nem envio de dados para a internet.
- Todos os dados são armazenados **somente no seu aparelho**, em um banco de dados local.
- Não coletamos, não vendemos e não compartilhamos seus dados.
- Não utilizamos anúncios, ferramentas de analytics nem rastreamento.

## 3. Dados tratados

O aplicativo armazena localmente apenas as informações que você digita:

- Dados dos veículos cadastrados (ex.: nome, modelo, ano, quilometragem atual).
- Tipos de manutenção, intervalos configurados e histórico de manutenções realizadas (datas, quilometragem e, se informados, valores em reais).

Você não é obrigado a informar nenhum dado além do necessário para o funcionamento do app.

## 4. Finalidade

Os dados são usados exclusivamente para:

- calcular quando cada manutenção vence;
- exibir o histórico e os lembretes no aplicativo;
- enviar notificações locais de lembrete no seu aparelho;
- permitir exportar e importar seus dados por arquivo, quando você solicitar.

## 5. Notificações

O aplicativo usa **notificações locais** (geradas pelo próprio aparelho, sem servidor externo) para avisar sobre manutenções próximas ou vencidas. Você pode desativá-las a qualquer momento nas configurações do aplicativo ou do sistema Android.

## 6. Exportação e importação de dados

Quando você exporta seus dados, o arquivo é gerado no seu aparelho e compartilhado somente por você, pelos meios que escolher. Ao importar um arquivo, o conteúdo é validado e gravado apenas no banco local. Não há envio automático de nenhum arquivo.

## 7. Compartilhamento com terceiros

Não compartilhamos dados com terceiros, pois não os enviamos para nenhum lugar. Não há integração com redes sociais, serviços de publicidade ou serviços de análise.

## 8. Armazenamento e segurança

Os dados ficam no armazenamento interno do aplicativo no seu aparelho. Eles são removidos se você desinstalar o aplicativo ou limpar seus dados nas configurações do Android. Recomendamos manter um backup exportado caso troque de aparelho.

## 9. Permissões do Android

- **Notificações:** necessária para exibir os lembretes.

O aplicativo não solicita acesso a localização, contatos, câmera, microfone, fotos ou arquivos do aparelho, e não possui permissão de acesso à internet nas versões publicadas.

## 10. Crianças

O aplicativo não é direcionado a menores de idade e não coleta dados pessoais de crianças.

## 11. Seus direitos

Como os dados ficam apenas no seu aparelho, você tem controle total sobre eles: pode consultá-los, editá-los, exportá-los, excluí-los dentro do aplicativo ou desinstalá-lo para removê-los por completo. Para qualquer dúvida, entre em contato pelo e-mail informado acima.

Esta política segue a Lei Geral de Proteção de Dados (LGPD, Lei nº 13.709/2018).

## 12. Alterações

Esta política pode ser atualizada. Mudanças relevantes serão indicadas com nova data no topo deste documento e, quando aplicável, na própria versão do aplicativo.

## 13. Aviso sobre manutenção

Os intervalos de manutenção padrão do aplicativo são genéricos. O manual do fabricante do seu veículo prevalece sobre qualquer valor sugerido pelo ManuCar.

---

# ManuCar

App mobile pessoal que lembra o usuário das manutenções do carro (troca de óleo, correia dentada, filtros etc.) por **quilometragem** e/ou **tempo**.

- 100% offline: sem conta, sem servidor, sem envio de dados para a internet.
- Dados armazenados localmente em SQLite.
- Lembretes por notificações locais.
- Interface em português do Brasil.

> **Aviso:** os intervalos de manutenção padrão são genéricos. O **manual do fabricante do veículo prevalece** sobre qualquer valor sugerido pelo app.

---

## Sumário

1. [Funcionalidades](#funcionalidades)
2. [Stack](#stack)
3. [Pré-requisitos](#pré-requisitos)
4. [Instalação e execução](#instalação-e-execução)
5. [Scripts disponíveis](#scripts-disponíveis)
6. [Build e publicação (EAS)](#build-e-publicação-eas)
7. [Arquitetura](#arquitetura)
8. [Estrutura de pastas](#estrutura-de-pastas)
9. [Regras de negócio](#regras-de-negócio)
10. [Banco de dados](#banco-de-dados)
11. [Notificações](#notificações)
12. [Backup (exportar e importar)](#backup-exportar-e-importar)
13. [Testes](#testes)
14. [Permissões](#permissões)
15. [Convenções do projeto](#convenções-do-projeto)
16. [Roadmap e status](#roadmap-e-status)
17. [Limitações conhecidas](#limitações-conhecidas)
18. [Documentação adicional](#documentação-adicional)

---

## Funcionalidades

- **Veículos**: cadastro e edição (nome, placa). Odômetro inicial 0 km. Suporte a mais de um veículo, com seletor na Home.
- **Odômetro**: atualização da quilometragem atual por um modal. O app não aceita valor menor que o atual.
- **Itens de manutenção**: 13 itens padrão criados junto com cada veículo (óleo, filtros, correia dentada, velas, freios, bateria etc.). É possível criar, editar e configurar intervalo por km, por meses, ou ambos.
- **Status por item**: `ok`, `atencao` (faltam pouco) e `vencido`, com badge colorido. A lista da Home é ordenada por urgência.
- **Previsão**: quando há histórico de quilometragem, o app estima a data do próximo vencimento pela média de km rodados por dia (janela de 90 dias).
- **Marcar como feito**: registra data, km, custo (opcional, em centavos) e observações. Atualiza a base de cálculo do próximo vencimento.
- **Histórico**: registros de execução de cada item na tela de detalhe.
- **Lembretes**: notificações locais por item e um lembrete semanal de atualização do odômetro (segunda-feira, 09:00).
- **Configurações**: ativar/desativar lembretes, tratamento de permissão negada, backup, sobre e aviso sobre intervalos genéricos.
- **Modo escuro**: segue o tema do sistema.

---

## Stack

| Área | Tecnologia |
| --- | --- |
| Framework | Expo SDK 58 + React Native 0.88 + React 19 |
| Linguagem | TypeScript (modo `strict`, sem `any`) |
| Navegação | Expo Router (rotas por arquivo) |
| Banco | expo-sqlite + Drizzle ORM |
| Notificações | expo-notifications |
| Formulários | react-hook-form + @hookform/resolvers |
| Validação | zod |
| Testes | Jest + jest-expo + @testing-library/react-native |
| Qualidade | ESLint (eslint-config-expo) + Prettier |
| Build | EAS Build |

---

## Pré-requisitos

- Node.js (testado com a versão 24.14).
- npm.
- Para desenvolvimento nativo: Android Studio com SDK e um emulador ou aparelho físico com depuração USB.
- Para builds na nuvem: conta na Expo (`eas login`).

---

## Instalação e execução

```bash
# 1. Clonar o repositório
git clone <url-do-repositorio> manu-car
cd manu-car

# 2. Instalar dependências
npm install

# 3. Iniciar o servidor de desenvolvimento
npm start
```

Como o projeto usa `expo-dev-client`, o app precisa de um build de desenvolvimento instalado no aparelho. Para gerar e instalar localmente:

```bash
npm run android
```

Depois de instalado, use `npm start` e abra o app com o dev client.

---

## Scripts disponíveis

| Script | Função |
| --- | --- |
| `npm start` | Inicia o Metro (Expo) |
| `npm run android` | Gera e executa o build nativo Android (`expo run:android`) |
| `npm run ios` | Gera e executa o build nativo iOS (`expo run:ios`) |
| `npm run web` | Inicia a versão web (não é alvo do produto) |
| `npm run typecheck` | Verificação de tipos (`tsc --noEmit`) |
| `npm run lint` | ESLint |
| `npm test` | Executa a suíte Jest |
| `npm run test:watch` | Jest em modo watch |
| `npm run format` | Formata o projeto com Prettier |
| `npm run format:check` | Verifica formatação sem alterar arquivos |
| `npm run db:generate` | Gera nova migration Drizzle a partir do schema |

Antes de cada commit de fase, o projeto deve passar em `typecheck`, `lint` e `test`.

---

## Build e publicação (EAS)

O arquivo `eas.json` define dois perfis:

| Perfil | Saída | Uso |
| --- | --- | --- |
| `preview` | APK (`distribution: internal`) | Instalação direta para testes |
| `production` | AAB (`app-bundle`) | Envio à Google Play |

```bash
eas login

# APK para testes
eas build --platform android --profile preview

# AAB para a Play Store
eas build --platform android --profile production
```

Observações:

- `app.config.js` aplica `blockedPermissions` **somente** em builds do EAS (detectados pela variável `EAS_BUILD_PROFILE`). A lista remove permissões de rede, armazenamento externo e de badges de launchers. Builds locais de desenvolvimento não são afetados, porque precisam de rede para falar com o Metro.
- O `versionCode` (`app.json`, `android.versionCode`) deve ser incrementado a cada envio à Play Store.
- A política de privacidade está em `docs/politica-de-privacidade.md`. A Play Store exige uma URL pública para ela.

---

## Arquitetura

O projeto separa regras, dados e interface:

```
Telas (src/app) ──► Repositórios (src/data/repositories) ──► SQLite (expo-sqlite + Drizzle)
   │
   ├──► Domínio puro (src/domain)  — sem React, sem Expo, sem banco
   ├──► Utils (src/utils)          — datas, moeda, view-models
   └──► Notificações (src/notifications)
```

Regras fixas do projeto:

- **Lógica de negócio** fica em funções puras em `src/domain/`, sem imports de React ou Expo.
- **Acesso a dados** só acontece pelos repositórios em `src/data/repositories/`. Telas não consultam o banco diretamente.
- **Datas** são armazenadas em ISO 8601 (UTC) e exibidas no horário local.
- **Dinheiro** é armazenado em centavos (inteiro). Nunca usar float.
- **Estado de UI**: os dados vêm do banco. A tela recarrega ao ganhar foco.

---

## Estrutura de pastas

```
manu-car/
├── app.json                  # Configuração Expo (nome, ícones, plugins, package Android)
├── app.config.js             # Aplica blockedPermissions apenas em builds EAS
├── eas.json                  # Perfis de build (preview e production)
├── drizzle.config.ts         # Schema e pasta de migrations do Drizzle
├── jest.config.js            # Preset jest-expo; cobertura exclui src/app
├── eslint.config.js          # ESLint flat (eslint-config-expo)
├── PLAN.md                   # Plano de desenvolvimento por fases
├── AGENTS.md                 # Regras do projeto para agentes de código
├── docs/
│   └── politica-de-privacidade.md
├── assets/                   # Ícones e imagens
└── src/
    ├── app/                  # Rotas do Expo Router
    │   ├── _layout.tsx       # Stack + DatabaseGate + handler de notificações
    │   ├── index.tsx         # Home
    │   ├── settings.tsx      # Configurações
    │   ├── backup.tsx        # Exportar e importar dados
    │   ├── items/            # new.tsx, [id]/index.tsx, [id]/edit.tsx
    │   └── vehicles/         # new.tsx, [id]/edit.tsx
    ├── components/ui/        # Button, Card, TextField, ModalSheet, StatusBadge,
    │                         # WarningBanner, EmptyState etc.
    ├── forms/                # schemas.ts (zod), item-form, vehicle-form,
    │                         # odometer-modal, mark-done-modal
    ├── domain/               # Regras puras + testes
    ├── data/
    │   ├── db/               # client.ts, schema.ts, migrations/, database-gate.tsx,
    │   │                     # default-maintenance-items.ts, testing/
    │   └── repositories/     # Um arquivo por entidade + index.ts
    ├── notifications/        # scheduler.ts, permissions.ts, android-channel.ts,
    │                         # notification-handler.ts
    ├── utils/                # date.ts, currency.ts, numbers.ts, errors.ts,
    │                         # maintenance-view.ts
    ├── types/                # Declaração de módulos (*.sql)
    └── theme.ts              # Paletas claro/escuro e helpers de estilo
```

A pasta `src/store/` existe, mas está vazia. O Zustand previsto no `AGENTS.md` ainda não foi adicionado, pois o estado atual vem do banco.

---

## Regras de negócio

Todas em `src/domain/`, com testes de borda.

### Próximo vencimento: `calcNextDue(item, vehicle)`

- **Por km**: `vencimentoKm = (últimoFeitoKm ?? odômetroAtual) + intervaloKm`.
- **Por tempo**: `vencimentoData = últimoFeitoEm ?? odômetroAtualizadoEm`, somado a `intervaloMeses`. Se o dia não existir no mês de destino, usa o último dia do mês.
- Lança `OdometerDecreasedError` se o odômetro atual for menor que o km do último serviço.

### Status: `calcStatus(item, vehicle, now)`

- **Por km**: `vencido` quando restam ≤ 0 km; `atencao` quando restam ≤ 20% do intervalo.
- **Por tempo**: `vencido` quando já se passou o total de dias do intervalo; `atencao` quando passaram ≥ 80%.
- O status final é o pior entre os critérios aplicáveis (`worstStatus`).

### Previsão: `estimateDueDate(item, vehicle, avgKmPerDay)`

- Dias até o vencimento = `ceil(kmRestantes / mediaKmPorDia)`, contados a partir de `odometerUpdatedAt`.
- Retorna `null` se a média for ≤ 0 ou não finita, ou se o item não tiver intervalo por km.

### Média diária: `calcAvgKmPerDay(readings, now?)`

- Ordena as leituras por data.
- Lança erro se a quilometragem cair entre leituras.
- Usa a janela dos últimos 90 dias. Se houver menos de 2 leituras nessa janela, usa todas.
- Calcula `(kmÚltimo - kmPrimeiro) / dias`.

### Plano de notificações: `buildNotificationPlan(items, vehicle, now, opts)`

- Para cada item ativo com lembrete, escolhe a data mais próxima entre o vencimento por tempo e a previsão por km.
- Gera título e corpo, e acrescenta o lembrete semanal.

### Validação de formulários (`src/forms/schemas.ts`)

- Odômetro não pode diminuir.
- O km do último serviço não pode ser maior que o odômetro atual.
- Datas no formato `DD/MM/AAAA`, não podem estar no futuro.
- Custo digitado em reais é convertido para centavos (`parseCurrencyToCents`).

---

## Banco de dados

SQLite local, gerenciado por expo-sqlite e Drizzle. As chaves estrangeiras são ativadas com `PRAGMA foreign_keys`. As migrations rodam na inicialização, pelo `DatabaseGate`.

| Tabela | Colunas principais | Observações |
| --- | --- | --- |
| `vehicles` | `id`, `name`, `plate?`, `odometer_km`, `odometer_updated_at` | Odômetro atual fica aqui |
| `odometer_readings` | `id`, `vehicle_id` (FK), `km`, `read_at` | Histórico de leituras, usado na média diária |
| `maintenance_items` | `id`, `vehicle_id` (FK), `name`, `interval_km?`, `interval_months?`, `last_done_km?`, `last_done_at?`, `notify_enabled`, `archived` | Cascade ao excluir veículo |
| `maintenance_logs` | `id`, `item_id` (FK), `done_at`, `km`, `cost_cents?`, `notes?` | Histórico de execuções |

Migrations atuais: `src/data/db/migrations/0000_warm_sway.sql`.

### Repositórios

| Repositório | Métodos |
| --- | --- |
| `VehicleRepository` | `create` (transação, cria o veículo e os 13 itens padrão), `list`, `getById`, `update`, `delete` |
| `MaintenanceItemRepository` | `create`, `listByVehicle`, `getById`, `update`, `delete` |
| `OdometerRepository` | `create`, `listByVehicle`, `getById`, `latestForVehicle`, `update`, `delete` |
| `LogRepository` | `create`, `listByItem`, `getById`, `update`, `delete` |
| `NotificationSettingsRepository` | `isEnabled`, `setEnabled` (usa `expo-sqlite/kv-store`, não o Drizzle) |
| `BackupRepository` | `exportData`, `replaceAll` (apaga tudo e regrava numa transação) |

Acesso via `getRepositories()` (`src/data/repositories/index.ts`), criado com `createRepositories(db)`.

---

## Notificações

- Canal Android dedicado (`android-channel.ts`).
- O agendador (`scheduler.ts`) mantém uma fila: cancela os lembretes anteriores e agenda os novos a partir do plano.
- A permissão é pedida **somente** ao ativar os lembretes em Configurações. Se for negada, o app mostra um aviso com atalho para as configurações do sistema.
- Os lembretes são reagendados ao ganhar foco na Home.
- Notificação de teste disponível em Configurações, apenas em modo de desenvolvimento (`__DEV__`).

---

## Backup (exportar e importar)

Tela `src/app/backup.tsx`.

- **Exportar**: gera um JSON versionado (`schemaVersion: 1`) com todos os dados e abre o compartilhamento nativo.
- **Importar**: o usuário cola o JSON em um campo de texto. O conteúdo é validado com zod e pela integridade referencial (ids duplicados, chaves inexistentes) antes de qualquer gravação. Um resumo é exibido e a importação precisa de confirmação.
- A importação substitui todos os dados atuais numa única transação. Se algo falhar, nada é alterado.

Limitação: não há seletor de arquivo. A importação depende de colar o conteúdo.

---

## Testes

```bash
npm test
```

Estrutura:

- Testes ficam ao lado do código testado, em `__tests__/` ou com sufixo `.test.ts(x)`.
- Repositórios e migrations são testados com SQLite em memória (`src/data/db/testing/test-database.ts`, via `node:sqlite`).
- Cobertura excluída para `src/app` (rotas).

Cobertura atual: domínio (6 arquivos), utils (4), forms (1), repositórios e backup (5), migrations (1) e o componente `WelcomeScreen` (não usado na navegação).

Não há testes para `src/notifications`, para as telas de `src/app` nem para os componentes de `src/components/ui`.

---

## Permissões

| Permissão | Motivo |
| --- | --- |
| Notificações (`POST_NOTIFICATIONS`) | Exibir os lembretes locais |

Não são solicitadas localização, contatos, câmera, microfone, fotos ou arquivos. Nos builds EAS, a permissão de internet e outras são removidas via `app.config.js`.

---

## Convenções do projeto

- **Idioma da UI**: português do Brasil.
- **TypeScript strict**, sem `any`.
- **Commits**: um por fase, em Conventional Commits.
- **Sem requisições de rede**. O app é 100% offline.
- **Dependências**: não adicionar nada fora da stack sem aprovação (ver `AGENTS.md`).
- **Ao final de cada fase**: rodar `tsc --noEmit`, `eslint` e `jest`, e corrigir tudo.

---

## Roadmap e status

Detalhes por fase em `PLAN.md`.

| Fase | Descrição | Status |
| --- | --- | --- |
| 0 | Setup do projeto | Concluída |
| 1 | Dados (schema, migrations, repositórios) | Concluída |
| 2 | Domínio (regras puras) | Concluída, com pendência (ver abaixo) |
| 3 | Telas | Quase completa |
| 4 | Notificações | Implementada, não validada em aparelho |
| 5 | Acabamento (backup, tema escuro, ícone, splash) | Implementada |
| 6 | Build e publicação | Parcial: perfis configurados, build de produção não gerado |

---

## Limitações conhecidas

1. **Item nunca feito**: enquanto não há registro em `maintenance_logs`, o vencimento é calculado a partir do odômetro atual e de `odometerUpdatedAt`. Assim, cada nova leitura empurra o vencimento. Pode ser intencional, mas precisa ser confirmado.
2. **Leitura de odômetro retroativa**: o formulário não compara a data com as leituras anteriores. Uma leitura com km maior e data anterior à última pode fazer `calcAvgKmPerDay` lançar erro, sem tratamento na Home (`src/app/index.tsx`) e no detalhe do item.
3. **Toque na notificação não navega**: o handler só define a exibição. Não há listener de resposta, então `itemId` e `vehicleId` não levam a nenhuma tela.
4. **Reagendamento parcial**: criar ou editar veículo não chama `refreshScheduledNotifications()`. O reagendamento só ocorre ao voltar à Home.
5. **Erros silenciados**: `buildNotificationPlan` ignora com `continue` itens que falham, sem registro. A constante `REMINDER_HOUR` em `scheduler.ts` duplica `WEEKLY_ODOMETER_HOUR` do domínio.
6. **Sem telas para**: arquivar ou excluir item, excluir veículo, editar ou excluir registro do histórico, e listar o histórico de odômetro. Os repositórios já têm os métodos correspondentes.
7. **Validação em aparelho pendente**: notificações agendadas e vibração não foram testadas no celular, e o canal usa `vibrationPattern` enquanto `VIBRATE` e `WAKE_LOCK` estão bloqueadas nos builds EAS.
8. **Dependências fora da stack do `AGENTS.md`**: `expo-dev-client`, `react-native-web`, `babel-plugin-inline-import`, `test-renderer`, entre outras. Zustand e date-fns, previstos no `AGENTS.md`, não estão instalados.

---

## Documentação adicional

- `PLAN.md`: plano de desenvolvimento por fases.
- `AGENTS.md`: regras e convenções do projeto.
- `docs/politica-de-privacidade.md`: política de privacidade para a Play Store.
