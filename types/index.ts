export type Role = "admin" | "usuario";

export type Usuario = {
  id: number;
  nome: string;
  email: string;
  senha: string;
  tipo: Role;
};

export type Cliente = {
  id: number;
  nome: string;
  cnpj: string;
  inscricaoEstadual: string;
  endereco: string;
  whatsapp: string;
};

export type ItemPedido = {
  id: number;
  produto: string;
  categoria: string;
  safra: string;
  tsi: string;
  quantidade: string;
  valorUnitario: string;
};

export type Parcela = {
  id: number;
  percentual: string;
  vencimento: string;
};

export type Pedido = {
  id: number;
  numeroPedido: string;
  data: string;
  cliente: Cliente;
  vendedor: string;
  itens: ItemPedido[];
  parcelas: Parcela[];
  total: number;
};