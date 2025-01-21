export class StatusRota {
  static Rascunho = new StatusRota("draft");
  static Publicado = new StatusRota("published");
  static Arquivado = new StatusRota("archived");
  static Erro = new StatusRota("error");
  constructor(public nome: string) {}
}
