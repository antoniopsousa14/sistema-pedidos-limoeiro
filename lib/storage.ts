export function salvar(chave: string, dados: any) {
  localStorage.setItem(chave, JSON.stringify(dados));
}

export function carregar(chave: string) {
  const dados = localStorage.getItem(chave);
  return dados ? JSON.parse(dados) : null;
}