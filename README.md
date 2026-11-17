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

Quando você exporta seus dados, o aplicativo gera um arquivo JSON no seu aparelho e abre o menu de compartilhamento do sistema, para você salvá-lo onde quiser. Ao importar, você escolhe o arquivo pelo seletor do sistema; o aplicativo lê somente esse arquivo, valida o conteúdo e grava apenas no banco local. Não há envio automático de nenhum arquivo.

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

---

## Funcionalidades

- **Veículos**: cadastro e edição (nome, placa). Odômetro inicial 0 km. Suporte a mais de um veículo, com seletor na Home.
- **Odômetro**: atualização da quilometragem atual por um modal. Leituras com data anterior são aceitas se o km for compatível com o histórico; apenas a leitura mais recente atualiza o odômetro do veículo.
- **Itens de manutenção**: 16 itens padrão criados junto com cada veículo (óleo, filtros, limpeza dos sensores MAP e MAF, limpeza da sonda lambda, correia dentada, velas de ignição, freios, bateria etc.). É possível criar, editar e configurar intervalo por km, por meses, ou ambos. Cada item tem uma descrição opcional sobre para que serve e os benefícios da manutenção: os itens padrão já vêm com texto e os itens personalizados podem receber o texto do usuário.
- **Status por item**: `ok`, `atencao` (faltam pouco) e `vencido`, com badge colorido. A lista da Home é ordenada por urgência. Itens que nunca foram feitos recebem o selo "Nunca feito".
- **Previsão**: quando há histórico de quilometragem, o app estima a data do próximo vencimento pela média de km rodados por dia (janela de 90 dias).
- **Marcar como feito**: registra data, km, custo (opcional, em centavos) e observações. Atualiza a base de cálculo do próximo vencimento.
- **Histórico**: registros de execução de cada item na tela de detalhe.
- **Excluir item**: na tela de detalhe, com confirmação. Apaga o item e todo o seu histórico (cascata no banco) e refaz os lembretes. Para apenas silenciar os avisos, use a opção de lembrete na edição.
- **Lembretes**: notificações locais por item e um lembrete semanal de atualização do odômetro. O dia da semana e o horário do lembrete semanal são configuráveis em Configurações (padrão: segunda-feira, 09:00).
- **Toque na notificação**: abre o detalhe do item de manutenção ou a Home no lembrete semanal e no aviso de teste.
- **Máscaras de entrada**: data, quilometragem, custo, placa e campos numéricos são formatados enquanto o usuário digita.
- **Configurações**: ativar/desativar lembretes (ativos por padrão), tratamento de permissão negada, backup, sobre e aviso sobre intervalos genéricos.
- **Modo escuro**: segue o tema do sistema.

---

## Stack

| Área         | Tecnologia                                       |
| ------------ | ------------------------------------------------ |
| Framework    | Expo SDK 58 + React Native 0.88 + React 19       |
| Linguagem    | TypeScript (modo `strict`, sem `any`)            |
| Navegação    | Expo Router (rotas por arquivo)                  |
| Banco        | expo-sqlite + Drizzle ORM                        |
| Notificações | expo-notifications                               |
| Formulários  | react-hook-form + @hookform/resolvers            |
| Validação    | zod                                              |
| Testes       | Jest + jest-expo + @testing-library/react-native |
| Arquivos     | expo-file-system + expo-sharing (backup)         |
| Qualidade    | ESLint (eslint-config-expo) + Prettier           |
| Build        | EAS Build                                        |

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

Ao adicionar um pacote com código nativo (por exemplo `expo-sharing`), o recarregamento do Metro não basta: é preciso gerar de novo o build com `npm run android`. Um APK antigo não tem o módulo e mostra o erro `Cannot find native module`. Não é necessário desinstalar o app antes, desde que a assinatura seja a mesma.

---

## Scripts disponíveis

| Script                 | Função                                                     |
| ---------------------- | ---------------------------------------------------------- |
| `npm start`            | Inicia o Metro (Expo)                                      |
| `npm run android`      | Gera e executa o build nativo Android (`expo run:android`) |
| `npm run ios`          | Gera e executa o build nativo iOS (`expo run:ios`)         |
| `npm run web`          | Inicia a versão web (não é alvo do produto)                |
| `npm run typecheck`    | Verificação de tipos (`tsc --noEmit`)                      |
| `npm run lint`         | ESLint                                                     |
| `npm test`             | Executa a suíte Jest                                       |
| `npm run test:watch`   | Jest em modo watch                                         |
| `npm run format`       | Formata o projeto com Prettier                             |
| `npm run format:check` | Verifica formatação sem alterar arquivos                   |
| `npm run db:generate`  | Gera nova migration Drizzle a partir do schema             |

Antes de cada commit de fase, o projeto deve passar em `typecheck`, `lint` e `test`.

---

## Build e publicação (EAS)

O arquivo `eas.json` define dois perfis:

| Perfil       | Saída                          | Uso                           |
| ------------ | ------------------------------ | ----------------------------- |
| `preview`    | APK (`distribution: internal`) | Instalação direta para testes |
| `production` | AAB (`app-bundle`)             | Envio à Google Play           |

```bash
eas login

# APK para testes
eas build --platform android --profile preview

# AAB para a Play Store
eas build --platform android --profile production
```

Observações:

- `app.config.js` aplica `blockedPermissions` **somente** em builds do EAS (detectados pela variável `EAS_BUILD_PROFILE`). A lista remove permissões de rede, armazenamento externo e de badges de launchers. Builds locais de desenvolvimento não são afetados, porque precisam de rede para falar com o Metro.
- O `versionCode` (`app.json`, `android.versionCode`) deve ser incrementado a cada envio à Play Store. O perfil `production` usa `autoIncrement: true`, então o EAS incrementa o `versionCode` automaticamente a cada build; para envios manuais, garanta que ele seja maior que qualquer código já aceito pelo Play Console.
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
    │   ├── _layout.tsx       # Stack + DatabaseGate + handlers de notificações
    │   ├── index.tsx         # Home
    │   ├── settings.tsx      # Configurações
    │   ├── backup.tsx        # Exportar e importar dados
    │   ├── items/            # new.tsx, [id]/index.tsx, [id]/edit.tsx
    │   └── vehicles/         # new.tsx, [id]/edit.tsx
    ├── components/ui/        # Button, Card, TextField, ModalSheet, StatusBadge,
    │                         # WarningBanner, EmptyState, NeverDoneBadge etc.
    ├── forms/                # schemas.ts (zod), item-form, vehicle-form,
    │                         # odometer-modal, mark-done-modal, weekly-reminder-modal
    ├── domain/               # Regras puras + testes
    ├── data/
    │   ├── db/               # client.ts, schema.ts, migrations/, database-gate.tsx,
    │   │                     # default-maintenance-items.ts, testing/
    │   └── repositories/     # Um arquivo por entidade + index.ts
    ├── notifications/        # scheduler.ts, permissions.ts, android-channel.ts,
    │                         # notification-handler.ts, notification-response-handler.tsx,
    │                         # notification-target.ts, initial-permission.ts,
    │                         # initial-permission-prompt.tsx
    ├── utils/                # date.ts, currency.ts, numbers.ts, errors.ts,
    │                         # maintenance-view.ts, maintenance-item-descriptions.ts,
    │                         # weekly-reminder.ts, input-masks.ts,
    │                         # backup-file.ts
    ├── types/                # Declaração de módulos (*.sql)
    └── theme.ts              # Paletas claro/escuro e helpers de estilo
```

A pasta `src/store/` existe, mas está vazia. O Zustand previsto no `AGENTS.md` ainda não foi adicionado, pois o estado atual vem do banco.

---

## Regras de negócio

Todas em `src/domain/`, com testes de borda.

### Referência (baseline): `src/domain/baseline.ts`

A contagem do intervalo parte de uma referência:

- **Por km**: `últimoFeitoKm ?? baselineKm ?? odômetroAtual`.
- **Por tempo**: `últimoFeitoEm ?? baselineEm ?? odômetroAtualizadoEm`.

O `baselineKm`/`baselineEm` é gravado uma única vez, na criação do item, e não muda quando o odômetro é atualizado. Por isso, num item que nunca foi feito, cada nova leitura não empurra o vencimento. Veículos e itens antigos sem baseline usam o fallback do veículo.

### Próximo vencimento: `calcNextDue(item, vehicle)`

- **Por km**: `vencimentoKm = referênciaKm + intervaloKm`.
- **Por tempo**: `vencimentoData = referênciaEm`, somado a `intervaloMeses`. Se o dia não existir no mês de destino, usa o último dia do mês.
- Lança `OdometerDecreasedError` se o odômetro atual for menor que a referência de km.

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
- Gera título e corpo, e acrescenta o lembrete semanal no dia e horário configurados (`weeklyReminder`, padrão segunda-feira 09:00; valores inválidos voltam ao padrão).

### Validação de formulários (`src/forms/schemas.ts`)

- Odômetro não pode diminuir entre leituras. Leituras com data anterior são aceitas se o km for compatível com as leituras vizinhas; somente a leitura mais recente atualiza o odômetro do veículo.
- O km do último serviço não pode ser maior que o odômetro atual.
- Datas no formato `DD/MM/AAAA`, não podem estar no futuro.
- Custo digitado em reais é convertido para centavos (`parseCurrencyToCents`).
- Os campos com máscara guardam o texto formatado. O schema remove a formatação (`unmaskDigits`) antes de validar e converter.

### Máscaras de entrada (`src/utils/input-masks.ts`)

A prop `mask` do `TextField` formata o texto a cada alteração. As funções são puras:

| Campo                                          | Máscara                      | Exemplo                   |
| ---------------------------------------------- | ---------------------------- | ------------------------- |
| Quilometragem (odômetro, intervalo, última km) | Separador de milhar          | `52000` → `52.000`        |
| Datas (leitura, manutenção, última manutenção) | `DD/MM/AAAA`                 | `08112026` → `08/11/2026` |
| Custo                                          | Centavos em reais            | `25000` → `R$ 250,00`     |
| Placa                                          | Maiúsculas, até 7 caracteres | `abc1d23` → `ABC1D23`     |
| Intervalo em meses                             | Até 3 dígitos                | `12` → `12`               |
| Hora e minuto do lembrete semanal              | Até 2 dígitos                | `9` → `9`                 |

Nomes, descrições, observações e nome do veículo são texto livre e não têm máscara.

---

## Banco de dados

SQLite local, gerenciado por expo-sqlite e Drizzle. As chaves estrangeiras são ativadas com `PRAGMA foreign_keys`. As migrations rodam na inicialização, pelo `DatabaseGate`.

| Tabela              | Colunas principais                                                                                                                                                                  | Observações                                             |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `vehicles`          | `id`, `name`, `plate?`, `odometer_km`, `odometer_updated_at`                                                                                                                        | Odômetro atual fica aqui                                |
| `odometer_readings` | `id`, `vehicle_id` (FK), `km`, `read_at`                                                                                                                                            | Histórico de leituras, usado na média diária            |
| `maintenance_items` | `id`, `vehicle_id` (FK), `name`, `description?`, `interval_km?`, `interval_months?`, `last_done_km?`, `last_done_at?`, `baseline_km?`, `baseline_at?`, `notify_enabled`, `archived` | Cascade ao excluir veículo. Baseline gravado na criação |
| `maintenance_logs`  | `id`, `item_id` (FK), `done_at`, `km`, `cost_cents?`, `notes?`                                                                                                                      | Histórico de execuções                                  |

Migrations atuais: `0000_warm_sway.sql` (esquema inicial), `0001_bitter_zarda.sql` (adiciona `baseline_km`/`baseline_at` e preenche os itens existentes com a primeira leitura ou o odômetro do veículo), `0002_add_sensor_cleaning_items.sql` (acrescenta as limpezas dos sensores MAP e MAF e da sonda lambda aos veículos já existentes, sem duplicar itens), `0003_rename_velas_to_velas_de_ignicao.sql` (renomeia o item "velas" para "velas de ignição" nos veículos existentes) e `0004_add_maintenance_item_description.sql` (adiciona a coluna `description` aos itens de manutenção).

### Repositórios

| Repositório                      | Métodos                                                                                                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `VehicleRepository`              | `create` (transação, cria o veículo e os 16 itens padrão), `list`, `getById`, `update`, `delete`                                                                   |
| `MaintenanceItemRepository`      | `create`, `listByVehicle`, `getById`, `update`, `delete`                                                                                                           |
| `OdometerRepository`             | `create`, `listByVehicle`, `getById`, `latestForVehicle`, `update`, `delete`                                                                                       |
| `LogRepository`                  | `create`, `listByItem`, `getById`, `update`, `delete`                                                                                                              |
| `NotificationSettingsRepository` | `isEnabled`, `setEnabled`, `hasPromptedPermission`, `markPermissionPrompted`, `getWeeklyReminder`, `setWeeklyReminder` (usa `expo-sqlite/kv-store`, não o Drizzle) |
| `BackupRepository`               | `exportData`, `replaceAll` (apaga tudo e regrava numa transação)                                                                                                   |

Acesso via `getRepositories()` (`src/data/repositories/index.ts`), criado com `createRepositories(db)`.

---

## Notificações

- Canal Android dedicado (`android-channel.ts`).
- O agendador (`scheduler.ts`) mantém uma fila: cancela os lembretes anteriores e agenda os novos a partir do plano.
- Os lembretes vêm **ativados por padrão** (`isEnabled` é `true` enquanto a configuração nunca foi gravada). Na primeira abertura, o app pede a permissão de notificações uma única vez (`initial-permission.ts`). Se o usuário negar, os lembretes são desligados e ele pode religá-los em Configurações, onde um aviso mostra como liberar a permissão no sistema. Quem desligou manualmente os lembretes não recebe o pedido.
- Os lembretes são reagendados ao ganhar foco na Home e ao salvar um novo dia/horário do lembrete semanal.
- Notificação de teste disponível em Configurações, apenas em modo de desenvolvimento (`__DEV__`).
- Ao tocar em uma notificação, o app navega: manutenção abre o detalhe do item; lembrete semanal, aviso de teste e dados ausentes ou inválidos caem na Home. A resposta é limpa depois de tratada para não repetir a navegação.

---

## Backup (exportar e importar)

Tela `src/app/backup.tsx`.

- **Exportar**: gera o arquivo `manucar-backup-DD-MM-AAAA_EPOCH.json`, em que `EPOCH` é o timestamp Unix em milissegundos e a data é local. O conteúdo tem `schemaVersion: 3` e inclui o baseline e a descrição dos itens. O arquivo é gravado no diretório de cache do app e o menu de compartilhamento do Android é aberto, para o usuário salvar onde quiser (Downloads, Google Drive etc.). Se o aparelho não puder compartilhar, o caminho do arquivo é mostrado.
- **Importar**: o usuário escolhe um arquivo `.json` pelo seletor do sistema (`File.pickFileAsync`). Também aceita backups `schemaVersion: 1` e `2`, reconstruindo o baseline e preenchendo a descrição vazia quando ela não existir.
- O conteúdo é validado com zod e pela integridade referencial (ids duplicados, chaves inexistentes) antes de qualquer gravação. Um resumo é exibido e a importação precisa de confirmação.
- A importação substitui todos os dados atuais numa única transação. Se algo falhar, nada é alterado.

Dependências: `expo-file-system` (leitura e escrita) e `expo-sharing` (menu de compartilhamento). O `expo-file-system` declara permissões de armazenamento e internet no manifesto, mas os builds EAS as removem via `blockedPermissions`.

---

## Testes

```bash
npm test
```

Estrutura:

- Testes ficam ao lado do código testado, em `__tests__/` ou com sufixo `.test.ts(x)`.
- Repositórios e migrations são testados com SQLite em memória (`src/data/db/testing/test-database.ts`, via `node:sqlite`).
- Cobertura excluída para `src/app` (rotas).

Cobertura atual: domínio (7 arquivos), utils (8), forms (1), repositórios e backup (6), migrations (1), notificações (3) e o componente `WelcomeScreen` (não usado na navegação).

Não há testes para as telas de `src/app` nem para os componentes de `src/components/ui`.

---

## Permissões

| Permissão                           | Motivo                     |
| ----------------------------------- | -------------------------- |
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
