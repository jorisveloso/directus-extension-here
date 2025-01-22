import { HookExtensionContext } from "@directus/extensions";
import { components } from "../here-extension";
import { ApiClient } from "../utils/api-client/api-client";
import { AbstractServiceOptions, ItemsService } from "../utils/DirectusImports";
import { StatusRota } from "./StatusRota";

import dotenv from "dotenv";
dotenv.config();

// interface Point {
//   type: string;
//   coordinates: [number, number];
// }

type Schemas = components["schemas"];
type Rotas = Schemas["ItemsHereRouting"];

export class RoutingService {
  ctx: HookExtensionContext;
  service: ItemsService<Schemas["ItemsHereRouting"]>;
  private _rotas: Rotas[];
  private baseUrl: string;
  private routePath: string;
  private apiToken: string;
  private apiClient: ApiClient;

  constructor(ctx: HookExtensionContext, opts: AbstractServiceOptions) {
    this.ctx = ctx;
    this.service = new this.ctx.services.ItemsService("here_routing", opts);
    this._rotas = [];

    // Validação das variáveis de ambiente obrigatórias
    if (
      !process.env.HERE_API_BASE_URL ||
      !process.env.HERE_API_ROUTES_PATH ||
      !process.env.HERE_API_TOKEN
    ) {
      throw new Error(
        "Variáveis de ambiente obrigatórias (HERE_API_BASE_URL, HERE_API_ROUTES_PATH, HERE_API_TOKEN) não foram definidas."
      );
    }

    // Atribui as variáveis de ambiente
    this.baseUrl = process.env.HERE_API_BASE_URL;
    this.routePath = process.env.HERE_API_ROUTES_PATH;
    this.apiToken = process.env.HERE_API_TOKEN;

    // Inicializa a instância do ApiClient com baseUrl, token e path
    this.apiClient = new ApiClient(this.baseUrl, this.apiToken, this.routePath);

    // Verifica se a integração está ativada
    const integracaoAtivada =
      process.env.HERE_API_INTEGRACAO_ATIVADA === "true";
    if (!integracaoAtivada) {
      console.log("Integração com a API da HERE está desativada.");
    }
  }

  async sincronizar(): Promise<void> {
    this._rotas = [];
    try {
      await this.obterRotasPorStatus(StatusRota.Rascunho.nome);
      for (const rota of this._rotas) {
        try {
          // Validação dos campos origin e destination
          console.log(JSON.stringify(rota));
          if (!rota.origin || !rota.destination) {
            throw new Error(
              `Os campos 'origin' e 'destination' são obrigatórios para a rota ${rota.id}.`
            );
          }

          // Verifica se origin e destination têm a estrutura correta
          const originPoint = rota.origin; //this.parsePoint(rota.origin);
          const destinationPoint = rota.destination; //this.parsePoint(rota.destination);

          if (!originPoint || !destinationPoint) {
            throw new Error(
              `Os campos 'origin' e 'destination' devem ser do tipo 'Point' com coordenadas válidas para a rota ${rota.id}.`
            );
          }

          // Extrai as coordenadas de origin e destination
          const originString = rota.origin; //extractLatLongAsString(originPoint);
          const destinationString = rota.destination; //extractLatLongAsString(destinationPoint);

          // Monta o payload corretamente
          const payload = {
            transportMode: rota.transport_mode,
            origin: originString,
            destination: destinationString,
            return: rota.return ? rota.return.join(",") : "",
            currency: rota.currency,
            spans: rota.spans ? rota.spans.join(",") : "",
            routingMode: rota.routingMode,
            "vehicle[speedCap]": rota.vehicle_speed_cap,
          };

          const metodo = rota.method?.toUpperCase() || "GET";
          const resposta = await this.send2Here(metodo, payload);
          await this.gravarResposta(rota.id, JSON.stringify(resposta));
          await this.definirStatus(rota.id, StatusRota.Publicado.nome);
        } catch (error) {
          if (error instanceof Error) {
            this.ctx.logger.error(
              `Erro ao consultar rotas ${rota.id}: ${error.message}`
            );
            await this.gravarErro(rota.id, error.message);
          } else {
            this.ctx.logger.error(
              `Erro desconhecido ao consultar rotas ${rota.id}`
            );
            await this.gravarErro(rota.id, "Erro desconhecido");
          }
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        this.ctx.logger.error(
          "Erro geral ao sincronizar com here: ",
          error.message
        );
      } else {
        this.ctx.logger.error("Erro desconhecido ao sincronizar com here");
      }
      throw error;
    }
  }

  // /**
  //  * Converte um objeto Record<string, unknown> para Point, se válido.
  //  */
  // private parsePoint(point: Record<string, unknown> | null): Point | null {
  //   if (
  //     point &&
  //     typeof point === "object" &&
  //     point.type === "Point" &&
  //     Array.isArray(point.coordinates) &&
  //     point.coordinates.length === 2
  //   ) {
  //     return {
  //       type: point.type as string,
  //       coordinates: point.coordinates as [number, number],
  //     };
  //   }
  //   return null;
  // }

  /**
   * Obtém rotas por status
   */
  async obterRotasPorStatus(status: string): Promise<Rotas[]> {
    if (this._rotas.length === 0) {
      try {
        const query = {
          fields: ["*"],
          limit: -1,
          filter: { status: { _eq: status } },
        };

        this._rotas = await this.service.readByQuery(query);
      } catch (error) {
        if (error instanceof Error) {
          this.ctx.logger.error(
            "Erro ao buscar rotas para sincronização:",
            error.message
          );
        } else {
          this.ctx.logger.error(
            "Erro desconhecido ao buscar rotas para sincronização"
          );
        }
        throw error;
      }
    }

    return this._rotas;
  }

  /**
   * Define o status da rota
   */
  async definirStatus(id: string, status: string): Promise<void> {
    try {
      await this.service.updateOne(id, { status: status });
      this.ctx.logger.info(`Status da rota ${id} atualizado para ${status}`);
    } catch (error) {
      if (error instanceof Error) {
        this.ctx.logger.error(
          `Erro ao atualizar status da rota ${id}: ${error.message}`
        );
      } else {
        this.ctx.logger.error(
          `Erro desconhecido ao atualizar status da rota ${id}`
        );
      }
      throw error;
    }
  }

  /**
   * Envia rotas para HERE usando a nova classe ApiClient
   */
  async send2Here(metodo: string, payload: any): Promise<any> {
    // Validação do método HTTP
    if (!["GET", "POST"].includes(metodo)) {
      throw new Error(`Método HTTP não suportado: ${metodo}`);
    }

    // Adiciona o token ao payload
    const params = {
      ...payload,
      apikey: this.apiToken,
    };

    try {
      let response: any;

      if (metodo === "POST") {
        // Para POST, envia o payload no corpo da requisição
        response = await this.apiClient.post(params);
      } else if (metodo === "GET") {
        // Para GET, passa os parâmetros diretamente para o método get
        response = await this.apiClient.get(params);
      } else {
        throw new Error(`Método HTTP não suportado: ${metodo}`);
      }

      return response;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Erro na requisição: ${error.message}`);
      } else {
        throw new Error("Erro desconhecido na requisição");
      }
    }
  }

  /**
   * Gravar resposta
   */
  async gravarResposta(id: string, resposta: string): Promise<void> {
    try {
      await this.service.updateOne(id, {
        status: StatusRota.Publicado.nome,
        response: resposta,
      });
    } catch (error) {
      if (error instanceof Error) {
        this.ctx.logger.error(
          `Erro ao gravar resposta ${id}: ${error.message}`
        );
      } else {
        this.ctx.logger.error(`Erro desconhecido ao gravar resposta ${id}`);
      }
      throw error;
    }
  }

  /**
   * Gravar erro
   */
  async gravarErro(id: string, erro: string): Promise<void> {
    try {
      await this.service.updateOne(id, {
        error: erro,
      });
    } catch (error) {
      if (error instanceof Error) {
        this.ctx.logger.error(`Erro ao gravar erro ${id}: ${error.message}`);
      } else {
        this.ctx.logger.error(`Erro desconhecido ao gravar erro ${id}`);
      }
      throw error;
    }
  }
}

// // Função para extrair latitude e longitude como string
// function extractLatLongAsString(point: Point): string {
//   if (point.type === "Point" && point.coordinates.length === 2) {
//     const [latitude, longitude] = point.coordinates;
//     return `${latitude}, ${longitude}`;
//   }
//   return ""; // Retorna uma string vazia se o tipo não for "Point" ou as coordenadas forem inválidas
// }
