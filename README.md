# 📱 Grão Mestre – App Mobile

Aplicativo mobile do ecossistema **Grão Mestre**, uma plataforma completa para venda e gestão de cafés especiais.  
Este app é focado na experiência do cliente final: explorar produtos, montar pedidos, pagar via Mercado Pago e acompanhar o status em tempo real.

---

## ✨ Principais funcionalidades

- **Catálogo de produtos**
  - Listagem de cafés com imagem, descrição, preço e categoria.
  - Tela de detalhes com informações completas do produto.

- **Carrinho e pedidos**
  - Adição/remoção de itens, atualização de quantidade.
  - Criação de pedidos integrados à API (mesmo backend do web).
  - Consulta de histórico de pedidos e status em tempo real.

- **Pagamentos**
  - Integração com **Mercado Pago** usando o fluxo definido pelo backend.
  - Telas de acompanhamento de pagamento (pendente, sucesso, erro).

- **Autenticação e conta**
  - Login, registro de novos usuários e ativação de conta.
  - Esqueci minha senha / redefinição de senha com token.
  - Tela de conta com informações básicas do usuário.

- **Endereços**
  - Cadastro, edição e definição de endereço padrão.
  - Validação básica de CEP e campos obrigatórios.

- **Experiência de uso**
  - Layout responsivo adaptado para iOS e Android.
  - Feedbacks com toasts, loaders e estados vazios bem trabalhados.
  - Navegação em pilha e abas (stack/tab navigation).

---

## 🛠️ Stack Tecnológica

- **Framework:** React Native (Expo)
- **Linguagem:** TypeScript
- **Navegação:** React Navigation
- **Estado / Dados:**
  - Consumo de API REST do backend em Spring Boot
  - Armazenamento local para sessão/token (quando aplicável)
- **UI/UX:**
  - Componentização de botões, inputs, cards e layouts
  - Ícones (Lucide/Vector Icons, conforme o projeto)
  - Estilização consistente com a identidade do Grão Mestre (tipografia, cores, etc.)

---

## 🔗 Integração com o backend

Este app consome a mesma API do backend do projeto:

- Autenticação via JWT
- Endpoints de:
  - `/api/products` – catálogo de produtos
  - `/api/orders` – criação e consulta de pedidos
  - `/api/users` – registro, login, recuperação de senha
  - `/api/addresses` – gerenciamento de endereços
- Integração com **Mercado Pago** mediada pelo backend, incluindo:
  - Criação de preferência de pagamento
  - Webhook de confirmação
  - Rotas de redirecionamento (success / failure / pending)

> A URL base da API e as chaves sensíveis devem ser configuradas via variáveis de ambiente (ex.: `.env` no Expo).

---

## 🚀 Como rodar o app

1. **Clonar o repositório**

```bash
git clone https://github.com/seu-usuario/grao-mestre-mobile.git
cd grao-mestre-mobile
```

2. **Instalar dependências**

```bash
npm install
# ou
yarn install
```

3. **Configurar variáveis de ambiente**

Crie um arquivo `.env` na raiz com algo como:

```env
API_BASE_URL=https://sua-api.com
```

4. **Executar em desenvolvimento**

```bash
npx expo start
```

Abra no emulador Android, simulador iOS ou via Expo Go no seu dispositivo físico.


## 📂 Estrutura básica de pastas

```text
src/
  api/           # Configuração do cliente HTTP e serviços
  screens/       # Telas (Home, Products, ProductDetail, Cart, Orders, Account...)
  components/    # Componentes reutilizáveis (Button, Card, etc.)
  hooks/         # Hooks personalizados
  navigation/    # Stack/Tab navigators
  types/         # Tipos/DTOs compartilhados com backend
  config/        # Configuração de tema, constantes, etc.
```

---

## 🧩 Papel no ecossistema

O app mobile é um dos três pilares do projeto **Grão Mestre**:

- **Backend** – API REST em Spring Boot (auth, pedidos, pagamentos, relatórios).
- **Frontend Web** – loja + painel administrativo.
- **Mobile** – experiência de compra e acompanhamento de pedidos para o cliente final.

Ele demonstra sua capacidade de:

- Consumir APIs complexas
- Trabalhar com fluxo de autenticação e pagamento
- Criar experiências mobile de qualidade em cima de um domínio real (e-commerce de cafés especiais).

---

## 👤 Autor

Desenvolvido por **Lucas Liaw** como parte de uma aplicação full stack (backend + web + mobile), com foco em boas práticas, arquitetura organizada e integração real com meios de pagamento.
