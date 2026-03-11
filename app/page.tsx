"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Role = "admin" | "usuario";

type AppUser = {
  id: number;
  nome: string;
  email: string;
  senha: string;
  tipo: Role;
};

type Cliente = {
  id: number;
  nome: string;
  cnpj: string;
  inscricaoEstadual: string;
  endereco: string;
  whatsapp: string;
};

type ItemPedido = {
  id: number;
  produto: string;
  categoria: string;
  safra: string;
  tsi: string;
  quantidade: string;
  valorUnitario: string;
};

type Parcela = {
  id: number;
  percentual: string;
  vencimento: string;
  valorPago: number;
  dataPagamento: string;
  formaPagamento: string;
};

type PedidoSalvo = {
  id: number;
  numeroPedido: string;
  dataEmissao: string;
  vendedor: string;
  cliente: Cliente;
  itens: ItemPedido[];
  parcelas: Parcela[];
  total: number;
  criadoPorId: number;
  criadoPorNome: string;
  criadoEm: string;
};

type Tela =
  | "menu"
  | "novo-pedido"
  | "pedidos"
  | "clientes"
  | "usuarios"
  | "financeiro";

const STORAGE_USERS = "sl_users";
const STORAGE_CLIENTES = "sl_clientes";
const STORAGE_USER_LOGADO = "sl_user_logado";

const opcoesProdutos = [
  "GH 2473 I2X",
  "GH 2478 IPRO",
  "GH 2581 I2X",
  "GH 2483 IPRO",
  "TMG 2370 IPRO",
  "TMG 2379 IPRO",
  "TMG INGÁ I2X",
  "TMG MURICI I2X",
  "TMG PAINEIRA I2X",
  "TMG JATOBÁ I2X",
  "TMG ITAÚBA I2X",
];

const opcoesCategoria = ["Genética", "Básica", "C1", "C2", "S1", "S2"];
const opcoesSafra = ["26/27", "27/28", "29/30"];
const opcoesTSI = [
  "-",
  "V&P",
  "Fortenza Elite",
  "Fortenza",
  "Avicta",
  "Maxim",
  "Maxim Quattro",
  "Standak Top",
  "Outro",
];

const usuariosPadrao: AppUser[] = [
  {
    id: 1,
    nome: "Antonio",
    email: "admin@sementeslimoeiro.com.br",
    senha: "123456",
    tipo: "admin",
  },
];

const clientesPadrao: Cliente[] = [
  {
    id: 1,
    nome: "GFP AGRICOLA LTDA - ID 2722",
    cnpj: "47.345.402/0001-91",
    inscricaoEstadual: "284753696",
    endereco:
      "Avenida Dois, Nº 401, Centro - Chapadão Do Sul - MS - CEP 79560-000",
    whatsapp: "(67) 99999-9999",
  },
];

function numero(valor: string) {
  if (!valor) return 0;
  const texto = valor.replace(",", ".");
  const convertido = Number(texto);
  return isNaN(convertido) ? 0 : convertido;
}

function moeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function criarItemVazio(): ItemPedido {
  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    produto: "",
    categoria: "",
    safra: "",
    tsi: "-",
    quantidade: "",
    valorUnitario: "",
  };
}

function criarParcelaVazia(percentual = ""): Parcela {
  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    percentual,
    vencimento: "",
    valorPago: 0,
    dataPagamento: "",
    formaPagamento: "",
  };
}

export default function Home() {
  const [carregado, setCarregado] = useState(false);

  const [usuarios, setUsuarios] = useState<AppUser[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pedidos, setPedidos] = useState<PedidoSalvo[]>([]);
  const [usuarioLogado, setUsuarioLogado] = useState<AppUser | null>(null);

  const [tela, setTela] = useState<Tela>("menu");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginSenha, setLoginSenha] = useState("");

  const [novoUsuarioNome, setNovoUsuarioNome] = useState("");
  const [novoUsuarioEmail, setNovoUsuarioEmail] = useState("");
  const [novoUsuarioSenha, setNovoUsuarioSenha] = useState("");
  const [novoUsuarioTipo, setNovoUsuarioTipo] = useState<Role>("usuario");

  const [clienteFormNome, setClienteFormNome] = useState("");
  const [clienteFormCnpj, setClienteFormCnpj] = useState("");
  const [clienteFormIe, setClienteFormIe] = useState("");
  const [clienteFormEndereco, setClienteFormEndereco] = useState("");
  const [clienteFormWhatsapp, setClienteFormWhatsapp] = useState("");
  const [clienteEditandoId, setClienteEditandoId] = useState<number | null>(
    null
  );
  const [buscaCliente, setBuscaCliente] = useState("");

  const [numeroPedidoInicial, setNumeroPedidoInicial] = useState("1234");
  const sufixoPedidoFixo = "SS2627";
  const dataAtual = new Date().toLocaleDateString("pt-BR");

  const [clienteSelecionadoId, setClienteSelecionadoId] = useState("");
  const [modoNovoClienteNoPedido, setModoNovoClienteNoPedido] = useState(false);

  const [nomeCliente, setNomeCliente] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [inscricaoEstadual, setInscricaoEstadual] = useState("");
  const [endereco, setEndereco] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  const [novoNomePedido, setNovoNomePedido] = useState("");
  const [novoCnpjPedido, setNovoCnpjPedido] = useState("");
  const [novaIePedido, setNovaIePedido] = useState("");
  const [novoEnderecoPedido, setNovoEnderecoPedido] = useState("");
  const [novoWhatsappPedido, setNovoWhatsappPedido] = useState("");

  const [vendedor, setVendedor] = useState("");

  const [itens, setItens] = useState<ItemPedido[]>([criarItemVazio()]);
  const [parcelas, setParcelas] = useState<Parcela[]>([
    criarParcelaVazia("100"),
  ]);

  const [pedidoEditandoId, setPedidoEditandoId] = useState<number | null>(null);

  const numeroPedidoCompleto = `${numeroPedidoInicial}${sufixoPedidoFixo}`;

  async function carregarPedidos() {
    const { data, error } = await supabase
      .from("pedidos")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error("Erro ao carregar pedidos:", error);
      setPedidos([]);
      return;
    }

    const pedidosFormatados: PedidoSalvo[] = (data || []).map((pedido: any) => ({
      id: Number(pedido.id),
      numeroPedido: pedido.numero_pedido || "",
      dataEmissao: pedido.data
        ? new Date(pedido.data).toLocaleDateString("pt-BR")
        : "",
      vendedor: pedido.vendedor || "",
      cliente: (pedido.cliente_json as Cliente) || {
        id: 0,
        nome: pedido.cliente || "",
        cnpj: "",
        inscricaoEstadual: "",
        endereco: "",
        whatsapp: "",
      },
      itens: (pedido.itens_json as ItemPedido[]) || [],
      parcelas: (pedido.parcelas_json as Parcela[]) || [],
      total: Number(pedido.valor_total || 0),
      criadoPorId: Number(pedido.criado_por_id || 0),
      criadoPorNome: pedido.criado_por_nome || "",
      criadoEm: pedido.criado_em || "",
    }));

    setPedidos(pedidosFormatados);
  }

  useEffect(() => {
    async function iniciar() {
      const usersSalvos = localStorage.getItem(STORAGE_USERS);
      const clientesSalvos = localStorage.getItem(STORAGE_CLIENTES);
      const userLogadoSalvo = localStorage.getItem(STORAGE_USER_LOGADO);

      const baseUsuarios = usersSalvos ? JSON.parse(usersSalvos) : usuariosPadrao;
      const baseClientes = clientesSalvos
        ? JSON.parse(clientesSalvos)
        : clientesPadrao;

      setUsuarios(baseUsuarios);
      setClientes(baseClientes);

      if (userLogadoSalvo) {
        setUsuarioLogado(JSON.parse(userLogadoSalvo));
      }

      if (!usersSalvos) {
        localStorage.setItem(STORAGE_USERS, JSON.stringify(usuariosPadrao));
      }
      if (!clientesSalvos) {
        localStorage.setItem(STORAGE_CLIENTES, JSON.stringify(clientesPadrao));
      }

      await carregarPedidos();
      setCarregado(true);
    }

    iniciar();
  }, []);

  useEffect(() => {
    if (!carregado) return;
    localStorage.setItem(STORAGE_USERS, JSON.stringify(usuarios));
  }, [usuarios, carregado]);

  useEffect(() => {
    if (!carregado) return;
    localStorage.setItem(STORAGE_CLIENTES, JSON.stringify(clientes));
  }, [clientes, carregado]);

  useEffect(() => {
    if (!carregado) return;
    if (usuarioLogado) {
      localStorage.setItem(STORAGE_USER_LOGADO, JSON.stringify(usuarioLogado));
    } else {
      localStorage.removeItem(STORAGE_USER_LOGADO);
    }
  }, [usuarioLogado, carregado]);

  function limparFormularioCliente() {
    setClienteFormNome("");
    setClienteFormCnpj("");
    setClienteFormIe("");
    setClienteFormEndereco("");
    setClienteFormWhatsapp("");
    setClienteEditandoId(null);
  }

  function limparPedido() {
    setPedidoEditandoId(null);
    setNumeroPedidoInicial("1234");
    setClienteSelecionadoId("");
    setModoNovoClienteNoPedido(false);
    setNomeCliente("");
    setCnpj("");
    setInscricaoEstadual("");
    setEndereco("");
    setWhatsapp("");
    setNovoNomePedido("");
    setNovoCnpjPedido("");
    setNovaIePedido("");
    setNovoEnderecoPedido("");
    setNovoWhatsappPedido("");
    setVendedor("");
    setItens([criarItemVazio()]);
    setParcelas([criarParcelaVazia("100")]);
  }

  function totalItem(item: ItemPedido) {
    return numero(item.quantidade) * numero(item.valorUnitario);
  }

  const totalGeral = useMemo(() => {
    return itens.reduce((soma, item) => soma + totalItem(item), 0);
  }, [itens]);

  const totalPercentualParcelas = useMemo(() => {
    return parcelas.reduce(
      (soma, parcela) => soma + numero(parcela.percentual),
      0
    );
  }, [parcelas]);

  const totalPago = useMemo(() => {
    return parcelas.reduce((soma, parcela) => soma + (parcela.valorPago || 0), 0);
  }, [parcelas]);

  const saldoAberto = useMemo(() => {
    return totalGeral - totalPago;
  }, [totalGeral, totalPago]);

  const clientesFiltrados = useMemo(() => {
    const termo = buscaCliente.trim().toLowerCase();

    if (!termo) return clientes;

    return clientes.filter((cliente) => {
      return (
        cliente.nome.toLowerCase().includes(termo) ||
        cliente.cnpj.toLowerCase().includes(termo) ||
        cliente.inscricaoEstadual.toLowerCase().includes(termo) ||
        cliente.endereco.toLowerCase().includes(termo) ||
        cliente.whatsapp.toLowerCase().includes(termo)
      );
    });
  }, [clientes, buscaCliente]);

  function valorParcela(percentual: string) {
    return totalGeral * (numero(percentual) / 100);
  }

  function valorParcelaPorTotal(totalPedido: number, percentual: string) {
    return totalPedido * (numero(percentual) / 100);
  }

  function statusParcela(parcela: Parcela, totalPedido: number) {
    const valorDaParcela = valorParcelaPorTotal(totalPedido, parcela.percentual);
    const pago = parcela.valorPago || 0;

    if (pago <= 0) return "Em aberto";
    if (pago < valorDaParcela) return "Parcial";
    return "Quitado";
  }

  function corStatusParcela(parcela: Parcela, totalPedido: number) {
    const status = statusParcela(parcela, totalPedido);
    if (status === "Quitado") return "text-green-700";
    if (status === "Parcial") return "text-yellow-600";
    return "text-red-600";
  }

  function fazerLogin() {
    const usuario = usuarios.find(
      (u) => u.email === loginEmail.trim() && u.senha === loginSenha
    );

    if (!usuario) {
      alert("E-mail ou senha inválidos.");
      return;
    }

    setUsuarioLogado(usuario);
    setTela("menu");
    setLoginEmail("");
    setLoginSenha("");
  }

  function sair() {
    setUsuarioLogado(null);
    setTela("menu");
  }

  function selecionarClientePedido(valor: string) {
    if (valor === "novo") {
      setModoNovoClienteNoPedido(true);
      setClienteSelecionadoId("novo");
      setNomeCliente("");
      setCnpj("");
      setInscricaoEstadual("");
      setEndereco("");
      setWhatsapp("");
      return;
    }

    setModoNovoClienteNoPedido(false);
    setClienteSelecionadoId(valor);

    const cliente = clientes.find((c) => String(c.id) === valor);
    if (!cliente) return;

    setNomeCliente(cliente.nome);
    setCnpj(cliente.cnpj);
    setInscricaoEstadual(cliente.inscricaoEstadual);
    setEndereco(cliente.endereco);
    setWhatsapp(cliente.whatsapp);
  }

  function salvarNovoClienteNoPedido() {
    if (
      !novoNomePedido ||
      !novoCnpjPedido ||
      !novaIePedido ||
      !novoEnderecoPedido ||
      !novoWhatsappPedido
    ) {
      alert("Preencha todos os dados do novo cliente.");
      return;
    }

    const novoCliente: Cliente = {
      id: Date.now(),
      nome: novoNomePedido,
      cnpj: novoCnpjPedido,
      inscricaoEstadual: novaIePedido,
      endereco: novoEnderecoPedido,
      whatsapp: novoWhatsappPedido,
    };

    setClientes((anterior) => [...anterior, novoCliente]);
    setClienteSelecionadoId(String(novoCliente.id));
    setModoNovoClienteNoPedido(false);

    setNomeCliente(novoCliente.nome);
    setCnpj(novoCliente.cnpj);
    setInscricaoEstadual(novoCliente.inscricaoEstadual);
    setEndereco(novoCliente.endereco);
    setWhatsapp(novoCliente.whatsapp);

    setNovoNomePedido("");
    setNovoCnpjPedido("");
    setNovaIePedido("");
    setNovoEnderecoPedido("");
    setNovoWhatsappPedido("");
  }

  function salvarClienteTelaClientes() {
    if (
      !clienteFormNome ||
      !clienteFormCnpj ||
      !clienteFormIe ||
      !clienteFormEndereco ||
      !clienteFormWhatsapp
    ) {
      alert("Preencha todos os campos do cliente.");
      return;
    }

    if (clienteEditandoId !== null) {
      setClientes((anterior) =>
        anterior.map((cliente) =>
          cliente.id === clienteEditandoId
            ? {
                ...cliente,
                nome: clienteFormNome,
                cnpj: clienteFormCnpj,
                inscricaoEstadual: clienteFormIe,
                endereco: clienteFormEndereco,
                whatsapp: clienteFormWhatsapp,
              }
            : cliente
        )
      );

      limparFormularioCliente();
      alert("Cliente atualizado com sucesso.");
      return;
    }

    const novoCliente: Cliente = {
      id: Date.now(),
      nome: clienteFormNome,
      cnpj: clienteFormCnpj,
      inscricaoEstadual: clienteFormIe,
      endereco: clienteFormEndereco,
      whatsapp: clienteFormWhatsapp,
    };

    setClientes((anterior) => [...anterior, novoCliente]);

    limparFormularioCliente();
    alert("Cliente cadastrado com sucesso.");
  }

  function editarCliente(cliente: Cliente) {
    setClienteEditandoId(cliente.id);
    setClienteFormNome(cliente.nome);
    setClienteFormCnpj(cliente.cnpj);
    setClienteFormIe(cliente.inscricaoEstadual);
    setClienteFormEndereco(cliente.endereco);
    setClienteFormWhatsapp(cliente.whatsapp);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function excluirCliente(id: number) {
    const confirmar = window.confirm("Tem certeza que deseja excluir este cliente?");
    if (!confirmar) return;

    setClientes((anterior) => anterior.filter((cliente) => cliente.id !== id));

    if (clienteEditandoId === id) {
      limparFormularioCliente();
    }

    alert("Cliente excluído com sucesso.");
  }

  function adicionarUsuario() {
    if (!usuarioLogado || usuarioLogado.tipo !== "admin") return;

    if (!novoUsuarioNome || !novoUsuarioEmail || !novoUsuarioSenha) {
      alert("Preencha os dados do usuário.");
      return;
    }

    const emailJaExiste = usuarios.some(
      (u) => u.email.toLowerCase() === novoUsuarioEmail.toLowerCase()
    );

    if (emailJaExiste) {
      alert("Já existe um usuário com esse e-mail.");
      return;
    }

    const novoUsuario: AppUser = {
      id: Date.now(),
      nome: novoUsuarioNome,
      email: novoUsuarioEmail,
      senha: novoUsuarioSenha,
      tipo: novoUsuarioTipo,
    };

    setUsuarios((anterior) => [...anterior, novoUsuario]);

    setNovoUsuarioNome("");
    setNovoUsuarioEmail("");
    setNovoUsuarioSenha("");
    setNovoUsuarioTipo("usuario");

    alert("Usuário cadastrado com sucesso.");
  }

  function adicionarItem() {
    setItens((anterior) => [...anterior, criarItemVazio()]);
  }

  function removerItem(id: number) {
    if (itens.length === 1) return;
    setItens((anterior) => anterior.filter((item) => item.id !== id));
  }

  function atualizarItem(id: number, campo: keyof ItemPedido, valor: string) {
    setItens((anterior) =>
      anterior.map((item) =>
        item.id === id ? { ...item, [campo]: valor } : item
      )
    );
  }

  function adicionarParcela() {
    setParcelas((anterior) => [...anterior, criarParcelaVazia()]);
  }

  function removerParcela(id: number) {
    if (parcelas.length === 1) return;
    setParcelas((anterior) => anterior.filter((parcela) => parcela.id !== id));
  }

  function atualizarParcela(
    id: number,
    campo: keyof Parcela,
    valor: string | number
  ) {
    setParcelas((anterior) =>
      anterior.map((parcela) =>
        parcela.id === id ? { ...parcela, [campo]: valor } : parcela
      )
    );
  }

  function registrarRecebimento(idParcela: number) {
    const parcela = parcelas.find((p) => p.id === idParcela);
    if (!parcela) return;

    const valorDaParcela = valorParcela(parcela.percentual);
    const saldoAtual = valorDaParcela - (parcela.valorPago || 0);

    const data = prompt(
      "Data do recebimento (ex: 20/03/2026):",
      new Date().toLocaleDateString("pt-BR")
    );
    if (!data) return;

    const valorTexto = prompt(
      `Valor recebido desta parcela.\nSaldo atual: ${moeda(saldoAtual)}`,
      saldoAtual > 0 ? saldoAtual.toFixed(2).replace(".", ",") : "0"
    );
    if (!valorTexto) return;

    const valorRecebido = numero(valorTexto);

    if (valorRecebido <= 0) {
      alert("Informe um valor válido.");
      return;
    }

    const forma = prompt(
      "Forma de pagamento (PIX, TED, Boleto, Dinheiro, Outro):",
      parcela.formaPagamento || "PIX"
    );
    if (!forma) return;

    atualizarParcela(idParcela, "valorPago", (parcela.valorPago || 0) + valorRecebido);
    atualizarParcela(idParcela, "dataPagamento", data);
    atualizarParcela(idParcela, "formaPagamento", forma);
  }

  function estornarRecebimento(idParcela: number) {
    const confirmar = window.confirm(
      "Tem certeza que deseja zerar o recebimento desta parcela?"
    );
    if (!confirmar) return;

    setParcelas((anterior) =>
      anterior.map((parcela) =>
        parcela.id === idParcela
          ? {
              ...parcela,
              valorPago: 0,
              dataPagamento: "",
              formaPagamento: "",
            }
          : parcela
      )
    );
  }

  function editarPedido(pedido: PedidoSalvo) {
    if (!usuarioLogado) return;

    const podeEditar =
      usuarioLogado.tipo === "admin" || usuarioLogado.id === pedido.criadoPorId;

    if (!podeEditar) {
      alert("Você não tem permissão para editar este pedido.");
      return;
    }

    const numeroSemSufixo = pedido.numeroPedido.endsWith(sufixoPedidoFixo)
      ? pedido.numeroPedido.replace(sufixoPedidoFixo, "")
      : pedido.numeroPedido;

    setPedidoEditandoId(pedido.id);
    setNumeroPedidoInicial(numeroSemSufixo);
    setClienteSelecionadoId(String(pedido.cliente.id));
    setModoNovoClienteNoPedido(false);

    setNomeCliente(pedido.cliente.nome);
    setCnpj(pedido.cliente.cnpj);
    setInscricaoEstadual(pedido.cliente.inscricaoEstadual);
    setEndereco(pedido.cliente.endereco);
    setWhatsapp(pedido.cliente.whatsapp);

    setVendedor(pedido.vendedor);
    setItens(pedido.itens);
    setParcelas(
      pedido.parcelas.map((parcela) => ({
        ...parcela,
        valorPago: parcela.valorPago || 0,
        dataPagamento: parcela.dataPagamento || "",
        formaPagamento: parcela.formaPagamento || "",
      }))
    );

    setTela("novo-pedido");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function salvarPedidoNoBanco() {
    if (!usuarioLogado) {
      alert("Faça login.");
      return;
    }

    if (!nomeCliente || !cnpj || !vendedor) {
      alert("Preencha cliente, CNPJ e vendedor.");
      return;
    }

    if (
      itens.some(
        (item) =>
          !item.produto ||
          !item.categoria ||
          !item.safra ||
          !item.quantidade ||
          !item.valorUnitario
      )
    ) {
      alert("Preencha todos os itens do pedido.");
      return;
    }

    if (totalPercentualParcelas !== 100) {
      alert("A soma das parcelas deve ser 100%.");
      return;
    }

    const clienteDoPedido: Cliente = {
      id:
        clienteSelecionadoId && clienteSelecionadoId !== "novo"
          ? Number(clienteSelecionadoId)
          : Date.now(),
      nome: nomeCliente,
      cnpj,
      inscricaoEstadual,
      endereco,
      whatsapp,
    };

    const payload = {
      numero_pedido: numeroPedidoCompleto,
      cliente: clienteDoPedido.nome,
      data: new Date().toISOString(),
      valor_total: totalGeral,
      vendedor,
      cliente_json: clienteDoPedido,
      itens_json: itens,
      parcelas_json: parcelas,
      criado_por_id: usuarioLogado.id,
      criado_por_nome: usuarioLogado.nome,
      criado_em: new Date().toLocaleString("pt-BR"),
    };

    if (pedidoEditandoId !== null) {
      const { error } = await supabase
        .from("pedidos")
        .update(payload)
        .eq("id", pedidoEditandoId);

      if (error) {
        console.error("Erro ao atualizar pedido:", error);
        alert("Erro ao atualizar pedido.");
        return;
      }

      alert("Pedido atualizado com sucesso.");
      await carregarPedidos();
      limparPedido();
      setTela("pedidos");
      return;
    }

    const { error } = await supabase.from("pedidos").insert([payload]);

    if (error) {
      console.error("Erro ao salvar pedido:", error);
      alert("Erro ao salvar pedido.");
      return;
    }

    alert("Pedido salvo com sucesso.");
    await carregarPedidos();
    limparPedido();
    setTela("pedidos");
  }

  function imprimirPedido() {
    window.print();
  }

  const pedidosVisiveis =
    usuarioLogado?.tipo === "admin"
      ? pedidos
      : pedidos.filter((p) => p.criadoPorId === usuarioLogado?.id);

  if (!carregado) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="rounded-xl bg-white p-6 shadow">Carregando...</div>
      </main>
    );
  }

  if (!usuarioLogado) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow">
          <h1 className="mb-2 text-3xl font-bold text-black">Login</h1>
          <p className="mb-6 text-sm text-black">Entre no sistema de pedidos.</p>

          <div className="space-y-4">
            <input
              className="w-full rounded-xl border p-3 text-black placeholder-black"
              placeholder="E-mail"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
            />
            <input
              type="password"
              className="w-full rounded-xl border p-3 text-black placeholder-black"
              placeholder="Senha"
              value={loginSenha}
              onChange={(e) => setLoginSenha(e.target.value)}
            />

            <button
              onClick={fazerLogin}
              className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Entrar
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 text-black">
      <div className="print:hidden">
        <header className="border-b bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-2xl font-bold">Sistema de Pedidos</h1>
              <p className="text-sm text-black">
                Usuário: {usuarioLogado.nome} ({usuarioLogado.tipo})
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  limparPedido();
                  setTela("menu");
                }}
                className="rounded-lg bg-gray-200 px-4 py-2 font-semibold"
              >
                Menu
              </button>
              <button
                onClick={sair}
                className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white"
              >
                Sair
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl p-6">
          {tela === "menu" && (
            <section>
              <h2 className="mb-6 text-3xl font-bold">Painel inicial</h2>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-5">
                <button
                  onClick={() => {
                    limparPedido();
                    setTela("novo-pedido");
                  }}
                  className="rounded-2xl bg-white p-6 text-left shadow transition hover:-translate-y-1"
                >
                  <h3 className="text-xl font-bold">Cadastrar novo pedido</h3>
                  <p className="mt-2 text-sm text-black">
                    Criar um novo pedido de venda.
                  </p>
                </button>

                <button
                  onClick={() => setTela("pedidos")}
                  className="rounded-2xl bg-white p-6 text-left shadow transition hover:-translate-y-1"
                >
                  <h3 className="text-xl font-bold">Conferir pedidos</h3>
                  <p className="mt-2 text-sm text-black">
                    Visualizar pedidos já cadastrados.
                  </p>
                </button>

                <button
                  onClick={() => setTela("clientes")}
                  className="rounded-2xl bg-white p-6 text-left shadow transition hover:-translate-y-1"
                >
                  <h3 className="text-xl font-bold">Clientes</h3>
                  <p className="mt-2 text-sm text-black">
                    Cadastrar e consultar clientes.
                  </p>
                </button>

                <button
                  onClick={() => setTela("financeiro")}
                  className="rounded-2xl bg-white p-6 text-left shadow transition hover:-translate-y-1"
                >
                  <h3 className="text-xl font-bold">Financeiro</h3>
                  <p className="mt-2 text-sm text-black">
                    Dar baixa nos recebimentos e acompanhar saldo.
                  </p>
                </button>

                {usuarioLogado.tipo === "admin" && (
                  <button
                    onClick={() => setTela("usuarios")}
                    className="rounded-2xl bg-white p-6 text-left shadow transition hover:-translate-y-1"
                  >
                    <h3 className="text-xl font-bold">Usuários</h3>
                    <p className="mt-2 text-sm text-black">
                      Gerenciar usuários do sistema.
                    </p>
                  </button>
                )}
              </div>
            </section>
          )}

          {tela === "clientes" && (
            <section className="space-y-6">
              <div className="rounded-2xl bg-white p-6 shadow">
                <h2 className="mb-4 text-2xl font-bold">
                  {clienteEditandoId !== null ? "Editar cliente" : "Cadastrar cliente"}
                </h2>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <input
                    className="rounded border p-3"
                    placeholder="Nome"
                    value={clienteFormNome}
                    onChange={(e) => setClienteFormNome(e.target.value)}
                  />
                  <input
                    className="rounded border p-3"
                    placeholder="CNPJ"
                    value={clienteFormCnpj}
                    onChange={(e) => setClienteFormCnpj(e.target.value)}
                  />
                  <input
                    className="rounded border p-3"
                    placeholder="Inscrição Estadual"
                    value={clienteFormIe}
                    onChange={(e) => setClienteFormIe(e.target.value)}
                  />
                  <input
                    className="rounded border p-3"
                    placeholder="Endereço"
                    value={clienteFormEndereco}
                    onChange={(e) => setClienteFormEndereco(e.target.value)}
                  />
                  <input
                    className="rounded border p-3 md:col-span-2"
                    placeholder="WhatsApp"
                    value={clienteFormWhatsapp}
                    onChange={(e) => setClienteFormWhatsapp(e.target.value)}
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={salvarClienteTelaClientes}
                    className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white"
                  >
                    {clienteEditandoId !== null ? "Atualizar cliente" : "Salvar cliente"}
                  </button>

                  {clienteEditandoId !== null && (
                    <button
                      onClick={limparFormularioCliente}
                      className="rounded-xl bg-gray-500 px-4 py-2 font-semibold text-white"
                    >
                      Cancelar edição
                    </button>
                  )}
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow">
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <h2 className="text-2xl font-bold">Clientes cadastrados</h2>

                  <input
                    className="w-full rounded border p-3 md:w-80"
                    placeholder="Buscar por nome, CNPJ, IE, endereço ou WhatsApp"
                    value={buscaCliente}
                    onChange={(e) => setBuscaCliente(e.target.value)}
                  />
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2">Nome</th>
                        <th className="py-2">CNPJ</th>
                        <th className="py-2">Inscrição Estadual</th>
                        <th className="py-2">Endereço</th>
                        <th className="py-2">WhatsApp</th>
                        <th className="py-2 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientesFiltrados.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-4 text-center">
                            Nenhum cliente encontrado.
                          </td>
                        </tr>
                      ) : (
                        clientesFiltrados.map((cliente) => (
                          <tr key={cliente.id} className="border-b">
                            <td className="py-2">{cliente.nome}</td>
                            <td className="py-2">{cliente.cnpj}</td>
                            <td className="py-2">{cliente.inscricaoEstadual}</td>
                            <td className="py-2">{cliente.endereco}</td>
                            <td className="py-2">{cliente.whatsapp}</td>
                            <td className="py-2">
                              <div className="flex justify-center gap-2">
                                <button
                                  onClick={() => editarCliente(cliente)}
                                  className="rounded bg-yellow-500 px-3 py-1 text-sm font-semibold text-white"
                                >
                                  ✏️ Editar
                                </button>
                                <button
                                  onClick={() => excluirCliente(cliente.id)}
                                  className="rounded bg-red-600 px-3 py-1 text-sm font-semibold text-white"
                                >
                                  🗑 Excluir
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {tela === "usuarios" && usuarioLogado.tipo === "admin" && (
            <section className="space-y-6">
              <div className="rounded-2xl bg-white p-6 shadow">
                <h2 className="mb-4 text-2xl font-bold">Cadastrar usuário</h2>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <input
                    className="rounded border p-3"
                    placeholder="Nome"
                    value={novoUsuarioNome}
                    onChange={(e) => setNovoUsuarioNome(e.target.value)}
                  />
                  <input
                    className="rounded border p-3"
                    placeholder="E-mail"
                    value={novoUsuarioEmail}
                    onChange={(e) => setNovoUsuarioEmail(e.target.value)}
                  />
                  <input
                    className="rounded border p-3"
                    placeholder="Senha"
                    value={novoUsuarioSenha}
                    onChange={(e) => setNovoUsuarioSenha(e.target.value)}
                  />
                  <select
                    className="rounded border p-3"
                    value={novoUsuarioTipo}
                    onChange={(e) => setNovoUsuarioTipo(e.target.value as Role)}
                  >
                    <option value="usuario">Usuário</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <button
                  onClick={adicionarUsuario}
                  className="mt-4 rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white"
                >
                  Salvar usuário
                </button>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow">
                <h2 className="mb-4 text-2xl font-bold">Usuários cadastrados</h2>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2">Nome</th>
                        <th className="py-2">E-mail</th>
                        <th className="py-2">Tipo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuarios.map((usuario) => (
                        <tr key={usuario.id} className="border-b">
                          <td className="py-2">{usuario.nome}</td>
                          <td className="py-2">{usuario.email}</td>
                          <td className="py-2">{usuario.tipo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {tela === "pedidos" && (
            <section className="rounded-2xl bg-white p-6 shadow">
              <h2 className="mb-4 text-2xl font-bold">Pedidos salvos</h2>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2">Pedido</th>
                      <th className="py-2">Data</th>
                      <th className="py-2">Cliente</th>
                      <th className="py-2">Vendedor</th>
                      <th className="py-2">Criado por</th>
                      <th className="py-2">Valor total</th>
                      <th className="py-2 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedidosVisiveis.length === 0 ? (
                      <tr>
                        <td className="py-3" colSpan={7}>
                          Nenhum pedido encontrado.
                        </td>
                      </tr>
                    ) : (
                      pedidosVisiveis.map((pedido) => (
                        <tr key={pedido.id} className="border-b">
                          <td className="py-2">{pedido.numeroPedido}</td>
                          <td className="py-2">{pedido.dataEmissao}</td>
                          <td className="py-2">{pedido.cliente.nome}</td>
                          <td className="py-2">{pedido.vendedor}</td>
                          <td className="py-2">{pedido.criadoPorNome}</td>
                          <td className="py-2">{moeda(pedido.total)}</td>
                          <td className="py-2">
                            <div className="flex justify-center">
                              {(usuarioLogado.tipo === "admin" ||
                                usuarioLogado.id === pedido.criadoPorId) && (
                                <button
                                  onClick={() => editarPedido(pedido)}
                                  className="rounded bg-blue-600 px-3 py-1 text-sm font-semibold text-white hover:bg-blue-700"
                                >
                                  Ver / Editar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {tela === "financeiro" && (
            <section className="space-y-6">
              <div className="rounded-2xl bg-white p-6 shadow">
                <h2 className="mb-4 text-2xl font-bold">
                  Financeiro / Baixa de recebimentos
                </h2>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2">Pedido</th>
                        <th className="py-2">Cliente</th>
                        <th className="py-2">Valor total</th>
                        <th className="py-2">Recebido</th>
                        <th className="py-2">Saldo</th>
                        <th className="py-2">Status</th>
                        <th className="py-2 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pedidosVisiveis.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-4 text-center">
                            Nenhum pedido encontrado.
                          </td>
                        </tr>
                      ) : (
                        pedidosVisiveis.map((pedido) => {
                          const totalRecebidoPedido = pedido.parcelas.reduce(
                            (soma, parcela) => soma + (parcela.valorPago || 0),
                            0
                          );

                          const saldoPedido = pedido.total - totalRecebidoPedido;

                          let statusPedido = "Em aberto";
                          if (
                            totalRecebidoPedido > 0 &&
                            totalRecebidoPedido < pedido.total
                          ) {
                            statusPedido = "Parcial";
                          }
                          if (totalRecebidoPedido >= pedido.total) {
                            statusPedido = "Quitado";
                          }

                          return (
                            <tr key={pedido.id} className="border-b">
                              <td className="py-2">{pedido.numeroPedido}</td>
                              <td className="py-2">{pedido.cliente.nome}</td>
                              <td className="py-2">{moeda(pedido.total)}</td>
                              <td className="py-2">{moeda(totalRecebidoPedido)}</td>
                              <td className="py-2">{moeda(saldoPedido)}</td>
                              <td className="py-2">
                                <span
                                  className={
                                    statusPedido === "Quitado"
                                      ? "font-bold text-green-700"
                                      : statusPedido === "Parcial"
                                      ? "font-bold text-yellow-600"
                                      : "font-bold text-red-600"
                                  }
                                >
                                  {statusPedido}
                                </span>
                              </td>
                              <td className="py-2">
                                <div className="flex justify-center gap-2">
                                  <button
                                    onClick={() => editarPedido(pedido)}
                                    className="rounded bg-blue-600 px-3 py-1 text-sm font-semibold text-white hover:bg-blue-700"
                                  >
                                    Abrir financeiro
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {tela === "novo-pedido" && (
            <section className="space-y-6">
              <div className="rounded-2xl bg-white p-6 shadow">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-2xl font-bold">
                    {pedidoEditandoId !== null ? "Editar pedido" : "Dados do pedido"}
                  </h2>

                  {pedidoEditandoId !== null && (
                    <button
                      onClick={() => {
                        limparPedido();
                        setTela("pedidos");
                      }}
                      className="rounded-lg bg-gray-500 px-4 py-2 font-semibold text-white"
                    >
                      Cancelar edição
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-sm font-semibold">
                      Número do pedido
                    </label>
                    <div className="flex overflow-hidden rounded border">
                      <input
                        className="w-24 px-3 py-3 outline-none"
                        placeholder="1234"
                        maxLength={4}
                        value={numeroPedidoInicial}
                        onChange={(e) =>
                          setNumeroPedidoInicial(
                            e.target.value.replace(/\D/g, "").slice(0, 4)
                          )
                        }
                      />
                      <span className="flex items-center bg-gray-100 px-3 py-3 font-semibold">
                        {sufixoPedidoFixo}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold">
                      Data de emissão
                    </label>
                    <input
                      className="rounded border bg-gray-100 p-3"
                      value={dataAtual}
                      readOnly
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-semibold">
                      Vendedor
                    </label>
                    <input
                      className="rounded border p-3"
                      placeholder="Vendedor"
                      value={vendedor}
                      onChange={(e) => setVendedor(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow">
                <h2 className="mb-4 text-2xl font-bold">Cliente</h2>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <select
                    className="rounded border p-3"
                    value={clienteSelecionadoId}
                    onChange={(e) => selecionarClientePedido(e.target.value)}
                  >
                    <option value="">Selecione um cliente</option>
                    <option value="novo">+ Cadastrar novo cliente</option>
                    {clientes.map((cliente) => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {modoNovoClienteNoPedido ? (
                  <div className="mt-4 rounded-xl border bg-gray-50 p-4">
                    <h3 className="mb-3 font-bold">Novo cliente</h3>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <input
                        className="rounded border p-3"
                        placeholder="Nome"
                        value={novoNomePedido}
                        onChange={(e) => setNovoNomePedido(e.target.value)}
                      />
                      <input
                        className="rounded border p-3"
                        placeholder="CNPJ"
                        value={novoCnpjPedido}
                        onChange={(e) => setNovoCnpjPedido(e.target.value)}
                      />
                      <input
                        className="rounded border p-3"
                        placeholder="Inscrição Estadual"
                        value={novaIePedido}
                        onChange={(e) => setNovaIePedido(e.target.value)}
                      />
                      <input
                        className="rounded border p-3"
                        placeholder="Endereço"
                        value={novoEnderecoPedido}
                        onChange={(e) => setNovoEnderecoPedido(e.target.value)}
                      />
                      <input
                        className="rounded border p-3 md:col-span-2"
                        placeholder="WhatsApp"
                        value={novoWhatsappPedido}
                        onChange={(e) => setNovoWhatsappPedido(e.target.value)}
                      />
                    </div>

                    <div className="mt-4 flex gap-3">
                      <button
                        type="button"
                        onClick={salvarNovoClienteNoPedido}
                        className="rounded bg-blue-600 px-4 py-2 font-semibold text-white"
                      >
                        Salvar cliente
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setModoNovoClienteNoPedido(false);
                          setClienteSelecionadoId("");
                        }}
                        className="rounded bg-gray-500 px-4 py-2 font-semibold text-white"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <input
                      className="rounded border p-3"
                      placeholder="Nome"
                      value={nomeCliente}
                      onChange={(e) => setNomeCliente(e.target.value)}
                    />
                    <input
                      className="rounded border p-3"
                      placeholder="CNPJ"
                      value={cnpj}
                      onChange={(e) => setCnpj(e.target.value)}
                    />
                    <input
                      className="rounded border p-3"
                      placeholder="Inscrição Estadual"
                      value={inscricaoEstadual}
                      onChange={(e) => setInscricaoEstadual(e.target.value)}
                    />
                    <input
                      className="rounded border p-3"
                      placeholder="Endereço"
                      value={endereco}
                      onChange={(e) => setEndereco(e.target.value)}
                    />
                    <input
                      className="rounded border p-3 md:col-span-2"
                      placeholder="WhatsApp"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-white p-6 shadow">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Itens do pedido</h2>
                  <button
                    type="button"
                    onClick={adicionarItem}
                    className="rounded bg-green-600 px-4 py-2 font-semibold text-white"
                  >
                    + Adicionar item
                  </button>
                </div>

                <div className="space-y-4">
                  {itens.map((item, index) => (
                    <div key={item.id} className="rounded-xl border p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="font-bold">Item {index + 1}</h3>
                        <button
                          type="button"
                          onClick={() => removerItem(item.id)}
                          className="rounded bg-red-600 px-3 py-1 text-sm font-semibold text-white"
                        >
                          Remover
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                        <select
                          className="rounded border p-3"
                          value={item.produto}
                          onChange={(e) =>
                            atualizarItem(item.id, "produto", e.target.value)
                          }
                        >
                          <option value="">Selecione o produto</option>
                          {opcoesProdutos.map((produto) => (
                            <option key={produto} value={produto}>
                              {produto}
                            </option>
                          ))}
                        </select>

                        <select
                          className="rounded border p-3"
                          value={item.categoria}
                          onChange={(e) =>
                            atualizarItem(item.id, "categoria", e.target.value)
                          }
                        >
                          <option value="">Selecione a categoria</option>
                          {opcoesCategoria.map((categoria) => (
                            <option key={categoria} value={categoria}>
                              {categoria}
                            </option>
                          ))}
                        </select>

                        <select
                          className="rounded border p-3"
                          value={item.safra}
                          onChange={(e) =>
                            atualizarItem(item.id, "safra", e.target.value)
                          }
                        >
                          <option value="">Selecione a safra</option>
                          {opcoesSafra.map((safra) => (
                            <option key={safra} value={safra}>
                              {safra}
                            </option>
                          ))}
                        </select>

                        <select
                          className="rounded border p-3"
                          value={item.tsi}
                          onChange={(e) =>
                            atualizarItem(item.id, "tsi", e.target.value)
                          }
                        >
                          {opcoesTSI.map((opcao) => (
                            <option key={opcao} value={opcao}>
                              {opcao}
                            </option>
                          ))}
                        </select>

                        <input
                          type="number"
                          className="rounded border p-3"
                          placeholder="Quantidade"
                          value={item.quantidade}
                          onChange={(e) =>
                            atualizarItem(item.id, "quantidade", e.target.value)
                          }
                        />

                        <input
                          className="rounded border bg-gray-100 p-3"
                          value="BB/5MI"
                          readOnly
                        />

                        <input
                          type="number"
                          step="0.01"
                          className="rounded border p-3"
                          placeholder="Valor unitário"
                          value={item.valorUnitario}
                          onChange={(e) =>
                            atualizarItem(item.id, "valorUnitario", e.target.value)
                          }
                        />

                        <input
                          className="rounded border bg-gray-100 p-3 font-semibold"
                          value={moeda(totalItem(item))}
                          readOnly
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex items-center justify-between rounded-xl bg-gray-100 p-4">
                  <span className="text-lg font-bold">Total geral do pedido</span>
                  <span className="text-2xl font-bold text-green-700">
                    {moeda(totalGeral)}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Parcelas / Pagamento</h2>
                  <button
                    type="button"
                    onClick={adicionarParcela}
                    className="rounded bg-green-600 px-4 py-2 font-semibold text-white"
                  >
                    + Adicionar parcela
                  </button>
                </div>

                <div className="space-y-4">
                  {parcelas.map((parcela, index) => {
                    const valorDaParcela = valorParcela(parcela.percentual);
                    const saldoDaParcela = valorDaParcela - (parcela.valorPago || 0);
                    const status = statusParcela(parcela, totalGeral);
                    const corStatus = corStatusParcela(parcela, totalGeral);

                    return (
                      <div key={parcela.id} className="rounded-xl border p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <h3 className="font-bold">Parcela {index + 1}</h3>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => registrarRecebimento(parcela.id)}
                              className="rounded bg-green-600 px-3 py-1 text-sm font-semibold text-white"
                            >
                              Lançar recebimento
                            </button>
                            <button
                              type="button"
                              onClick={() => estornarRecebimento(parcela.id)}
                              className="rounded bg-yellow-600 px-3 py-1 text-sm font-semibold text-white"
                            >
                              Estornar
                            </button>
                            <button
                              type="button"
                              onClick={() => removerParcela(parcela.id)}
                              className="rounded bg-red-600 px-3 py-1 text-sm font-semibold text-white"
                            >
                              Remover
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                          <div className="flex overflow-hidden rounded border">
                            <input
                              type="number"
                              step="0.01"
                              className="flex-1 px-3 py-3 outline-none"
                              placeholder="Percentual"
                              value={parcela.percentual}
                              onChange={(e) =>
                                atualizarParcela(
                                  parcela.id,
                                  "percentual",
                                  e.target.value
                                )
                              }
                            />
                            <span className="flex items-center bg-gray-100 px-3 py-3 font-semibold">
                              %
                            </span>
                          </div>

                          <input
                            className="rounded border p-3"
                            placeholder="Vencimento"
                            value={parcela.vencimento}
                            onChange={(e) =>
                              atualizarParcela(
                                parcela.id,
                                "vencimento",
                                e.target.value
                              )
                            }
                          />

                          <input
                            className="rounded border bg-gray-100 p-3 font-semibold"
                            value={moeda(valorDaParcela)}
                            readOnly
                          />
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
                          <div className="rounded-lg bg-gray-50 p-3">
                            <div className="text-xs font-semibold text-gray-600">
                              Recebido
                            </div>
                            <div className="mt-1 font-bold">
                              {moeda(parcela.valorPago || 0)}
                            </div>
                          </div>

                          <div className="rounded-lg bg-gray-50 p-3">
                            <div className="text-xs font-semibold text-gray-600">
                              Saldo
                            </div>
                            <div className="mt-1 font-bold">
                              {moeda(saldoDaParcela)}
                            </div>
                          </div>

                          <div className="rounded-lg bg-gray-50 p-3">
                            <div className="text-xs font-semibold text-gray-600">
                              Data pagamento
                            </div>
                            <div className="mt-1 font-bold">
                              {parcela.dataPagamento || "-"}
                            </div>
                          </div>

                          <div className="rounded-lg bg-gray-50 p-3">
                            <div className="text-xs font-semibold text-gray-600">
                              Forma
                            </div>
                            <div className="mt-1 font-bold">
                              {parcela.formaPagamento || "-"}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3">
                          <span className={`font-bold ${corStatus}`}>
                            Status: {status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 rounded-xl bg-gray-100 p-4">
                  <p className="font-semibold">
                    Soma dos percentuais: {totalPercentualParcelas.toFixed(2)}%
                  </p>
                  <p
                    className={`mt-1 font-semibold ${
                      totalPercentualParcelas === 100
                        ? "text-green-700"
                        : "text-red-700"
                    }`}
                  >
                    {totalPercentualParcelas === 100
                      ? "Percentual total correto."
                      : "A soma dos percentuais deve fechar em 100%."}
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-xl bg-blue-50 p-4">
                    <div className="text-sm font-semibold text-blue-900">
                      Total do pedido
                    </div>
                    <div className="mt-1 text-2xl font-bold text-blue-900">
                      {moeda(totalGeral)}
                    </div>
                  </div>

                  <div className="rounded-xl bg-green-50 p-4">
                    <div className="text-sm font-semibold text-green-900">
                      Total recebido
                    </div>
                    <div className="mt-1 text-2xl font-bold text-green-900">
                      {moeda(totalPago)}
                    </div>
                  </div>

                  <div className="rounded-xl bg-red-50 p-4">
                    <div className="text-sm font-semibold text-red-900">
                      Saldo em aberto
                    </div>
                    <div className="mt-1 text-2xl font-bold text-red-900">
                      {moeda(saldoAberto)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={salvarPedidoNoBanco}
                    className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white"
                  >
                    {pedidoEditandoId !== null ? "Atualizar pedido" : "Salvar pedido"}
                  </button>

                  <button
                    onClick={imprimirPedido}
                    className="rounded-xl bg-gray-700 px-6 py-3 font-semibold text-white"
                  >
                    Imprimir
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>

      {tela === "novo-pedido" && (
        <section className="mx-auto mt-6 max-w-[1000px] bg-white p-5 shadow print:max-w-none print:shadow-none">
          <div className="mb-5 border-b pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="h-16 w-auto object-contain"
                />

                <div className="text-[11px] leading-tight">
                  <div className="text-sm font-bold">
                    AGROPECUARIA LIMOEIRO E PILOES LTDA
                  </div>

                  <div>CNPJ: 46.272.036/0001-25 | IE: 0043338680040</div>
                  <div>RENASEM MG-16443/2022</div>
                  <div>Fazenda Limoeiro e Pilões KM 76 – Guarda-Mor MG</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-2 py-2 text-center">
            <div>
              Pedido <strong>{numeroPedidoCompleto}</strong>
            </div>
            <div>
              Emissão <strong>{dataAtual}</strong>
            </div>
          </div>

          <div className="mb-5 space-y-1 text-sm">
            <div className="text-center">
              <strong>Cliente:</strong> <span className="ml-2">{nomeCliente}</span>
            </div>
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-1">
              <div>
                <strong>CNPJ:</strong> <span className="ml-1">{cnpj}</span>
              </div>
              <div>
                <strong>Inscrição Estadual:</strong>{" "}
                <span className="ml-1">{inscricaoEstadual}</span>
              </div>
            </div>
            <div className="text-center">
              <strong>Endereço:</strong> <span className="ml-2">{endereco}</span>
            </div>
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-1">
              <div>
                <strong>WhatsApp:</strong> <span className="ml-2">{whatsapp}</span>
              </div>
              <div>
                <strong>Vendedor:</strong> <span className="ml-2">{vendedor}</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-center text-sm">
              <thead>
                <tr className="border-b font-semibold">
                  <th className="py-2">Produto</th>
                  <th className="py-2">Categoria</th>
                  <th className="py-2">Safra</th>
                  <th className="py-2">TSI</th>
                  <th className="py-2">Quantidade</th>
                  <th className="py-2">Unidade</th>
                  <th className="py-2">Valor Unitário (R$)</th>
                  <th className="py-2">Valor Total (R$)</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((item) => (
                  <tr key={item.id} className="border-b text-center">
                    <td className="py-2">{item.produto}</td>
                    <td className="py-2">{item.categoria}</td>
                    <td className="py-2">{item.safra}</td>
                    <td className="py-2">{item.tsi}</td>
                    <td className="py-2">{item.quantidade}</td>
                    <td className="py-2">BB/5MI</td>
                    <td className="py-2">{moeda(numero(item.valorUnitario))}</td>
                    <td className="py-2">{moeda(totalItem(item))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 text-sm">
            <div className="mb-2 text-center font-bold">Parcelas</div>

            <table className="w-full border-collapse text-center text-sm">
              <thead>
                <tr className="border-b font-semibold">
                  <th className="py-2">Parcela</th>
                  <th className="py-2">Percentual</th>
                  <th className="py-2">Vencimento</th>
                  <th className="py-2">Valor Parcela</th>
                  <th className="py-2">Valor Pago</th>
                  <th className="py-2">Saldo</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {parcelas.map((parcela, index) => {
                  const valorDaParcela = valorParcela(parcela.percentual);
                  const saldoDaParcela = valorDaParcela - (parcela.valorPago || 0);
                  const status = statusParcela(parcela, totalGeral);

                  return (
                    <tr key={parcela.id} className="border-b text-center">
                      <td className="py-2">{index + 1}</td>
                      <td className="py-2">
                        {numero(parcela.percentual).toFixed(2)}%
                      </td>
                      <td className="py-2">{parcela.vencimento}</td>
                      <td className="py-2">{moeda(valorDaParcela)}</td>
                      <td className="py-2">{moeda(parcela.valorPago || 0)}</td>
                      <td className="py-2">{moeda(saldoDaParcela)}</td>
                      <td className="py-2">{status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4 text-center text-sm md:grid-cols-4">
            <div>
              <div className="font-bold">Qtd. Parcelas</div>
              <div>{parcelas.length}</div>
            </div>
            <div>
              <div className="font-bold">Total Recebido</div>
              <div>{moeda(totalPago)}</div>
            </div>
            <div>
              <div className="font-bold">Saldo em Aberto</div>
              <div>{moeda(saldoAberto)}</div>
            </div>
            <div>
              <div className="font-bold">Valor Total do Pedido</div>
              <div className="font-bold">{moeda(totalGeral)}</div>
            </div>
          </div>

          <div className="mt-8 text-justify text-[12px] leading-5">
            <p>
              Para efetuar a retirada, bastará ao COMPRADOR remeter - com 48 horas
              de antecedência em relação à data do carregamento - via e-mail, ao
              VENDEDOR, uma Autorização de Carga, na qual deverão constar os dados
              do veículo que transportará a mercadoria e os dados do motorista,
              além da autorização expressa para que as sementes sejam entregues
              àquele transportador.
            </p>

            <p className="mt-4 font-bold">Condições Gerais</p>

            <p className="mt-2">
              As sementes, por serem organismos vivos, carecem de cuidados
              especiais no seu transporte, na sua guarda, no seu manuseio e no seu
              uso, estando sujeitas a danos caso sejam erroneamente transportadas
              ou acondicionadas. O COMPRADOR deverá seguir rigorosamente os
              preceitos técnicos indicados pelo engenheiro agrônomo responsável, bem
              como aqueles comuns na agricultura, para cada tipo de semente
              adquirida. Em caso de retirada na fazenda Limoeiro e Pilões (F. O.
              B.), a mercadoria viajará por conta e risco do COMPRADOR.
              Solicitamos que se faça teste de germinação para aferir a qualidade
              das sementes antes do plantio definitivo no campo. Reclamações
              somente serão aceitas quando efetuadas por escrito, acompanhadas de
              Boletim de Análise de Sementes emitido em laboratório credenciado
              pelo MAPA - Ministério da Agricultura, Pecuária e Abastecimento. A
              análise deverá ser realizada até 15 (quinze) dias após a retirada da
              mercadoria, e sempre antes do plantio definitivo no campo. Caso haja
              sementes que não correspondam aos padrões exigidos por lei, a
              responsabilidade do VENDEDOR limita-se à substituição dos fardos -
              aqueles pertencentes aos lotes que comprovadamente apresentarem
              problemas - por outros que estejam dentro do padrão de qualidade
              exigida pelo MAPA; ou, na impossibilidade de substituição, na
              devolução do valor pago acrescido de correção monetária. Em qualquer
              dos casos, as sementes devolvidas deverão ser entregues em suas
              embalagens originais lacradas e não danificadas. Pedido sujeito a
              aprovação de crédito. Em caso de não pagamento no prazo estipulado,
              este pedido poderá ser cancelado sem prévio aviso. Se cancelado o
              pedido, o cliente perderá o sinal pago.
            </p>

            <p className="mt-4">
              Li, compreendi e estou de acordo com as condições acima estabelecidas.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-2 gap-10 text-center text-sm">
            <div>
              <div className="mb-2 border-t border-black pt-2">
                AGROPECUARIA LIMOEIRO E PILOES LTDA
              </div>
            </div>
            <div>
              <div className="mb-2 border-t border-black pt-2">
                {nomeCliente || "CLIENTE"}
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}