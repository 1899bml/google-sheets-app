# 📊 Sistema de Gestão de Sócios

Este é um sistema web completo para gerir sócios de uma organização, com integração direta à Google Sheets. Permite registar, editar, remover e visualizar sócios, além de gerar relatórios e gráficos em tempo real.

## 🚀 Funcionalidades

- Login com Google OAuth 2.0
- Registo completo de sócio com:
  - Nome, Email, Telefone, Data de inscrição
  - Estado (Ativo/Inativo/Suspenso)
  - Cobrador responsável
  - Valor da cota, Estado da cota, Data de pagamento
  - Observações
- Edição e remoção de registos
- Filtros por cobrador e estado da cota
- Gráficos com estatísticas (Chart.js)
- Design moderno e responsivo
- Modo escuro opcional
- PWA instalável com cache offline
- Publicação via GitHub Pages

## 🛠️ Requisitos

- Conta Google com acesso à Google Sheets
- Google Cloud Project com:
  - API do Google Sheets ativada
  - OAuth 2.0 Client ID (tipo Web Application)
  - API Key
- Uma folha de cálculo com aba chamada `Sócios` e colunas:
