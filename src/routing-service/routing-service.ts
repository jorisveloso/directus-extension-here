import { HookExtensionContext } from "@directus/extensions";
import { components } from "../here-extension";
import { ApiClient } from "../utils/api-client/api-client";
import { AbstractServiceOptions, ItemsService } from "../utils/DirectusImports";
import { StatusRota } from "./StatusRota";

import dotenv from "dotenv";
dotenv.config();

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
      throw new Error("Integração com a API da HERE está desativada.");
    }
  }

  /**
   * Extrai latitude e longitude de um objeto GeoJSON Point.
   * @param point Objeto GeoJSON Point.
   * @returns Uma tupla com [latitude, longitude].
   * @throws Erro se o ponto não for um GeoJSON Point válido.
   */
  private getCoordinates(point: any): [number, number] {
    if (
      typeof point !== "object" ||
      point === null ||
      point.type !== "Point" ||
      !Array.isArray(point.coordinates) ||
      point.coordinates.length !== 2
    ) {
      throw new Error("O ponto não é um GeoJSON Point válido.");
    }

    const [longitude, latitude] = point.coordinates;
    return [latitude, longitude];
  }

  /**
   * Formata as coordenadas no formato "latitude,longitude".
   * @param point Objeto GeoJSON Point.
   * @returns String formatada com as coordenadas.
   */
  private formatCoordinates(point: any): string {
    const [latitude, longitude] = this.getCoordinates(point);
    return `${latitude},${longitude}`;
  }

  async sincronizar(): Promise<void> {
    this._rotas = [];

    try {
      await this.obterRotasPorStatus(StatusRota.Rascunho.nome);
      for (const rota of this._rotas) {
        try {
          // Validação dos campos origin e destination
          if (!rota.origin || !rota.destination) {
            throw new Error(
              `Os campos 'origin' e 'destination' são obrigatórios para a rota ${rota.id}.`
            );
          }

          // Extrai e formata as coordenadas de origin e destination
          const originString = this.formatCoordinates(rota.origin);
          const destinationString = this.formatCoordinates(rota.destination);

          // Atualiza o payload com os valores formatados
          const payload = {
            transportMode: rota.transport_mode,
            origin: originString,
            destination: destinationString,
            return: rota.return ? rota.return.join(",") : "",
            currency: rota.currency,
            spans: rota.spans ? rota.spans.join(",") : "",
            "vehicle[speedCap]": rota.vehicle_speed_cap,
            "vehicle[grossWeight]": rota.vehicle_gross_weight,
            "vehicle[weightPerAxle]": rota.vehicle_weight_per_axle ?? 0,
            "vehicle[width]": rota.vehicle_width ?? 0,
            "vehicle[length]": rota.vehicle_length ?? 0,
            "vehicle[kpraLength]": rota.vehicle_kpra_length ?? 0,
            "vehicle[payloadCapacity]": rota.vehicle_payload_capacity ?? 0,
          } as { [key: string]: any }; // Força o tipo para permitir propriedades dinâmicas

          // Adiciona routingMode apenas se não for null
          if (rota.routingMode !== null) {
            payload.routingMode = rota.routingMode;
          }

          // Adiciona "vehicle[shippedHazardousGoods]" apenas se não for null
          if (rota.vehicles_hipped_hazardous_goods !== null) {
            payload["vehicle[shippedHazardousGoods]"] =
              rota.vehicles_hipped_hazardous_goods;
          }

          // Adiciona "vehicle[currentWeight]" apenas se não for null
          if (rota.vehicle_current_weight !== null) {
            payload["vehicle[currentWeight]"] = rota.vehicle_current_weight;
          }

          // Adiciona "vehicle[tunnelCategory]" apenas se não for null
          if (rota.vehicle_tunnel_category !== null) {
            payload["vehicle[tunnelCategory]"] = rota.vehicle_tunnel_category;
          }

          // Adiciona "vehicle[axleCount]" apenas se não for null
          if (rota.vehicle_axle_count !== null) {
            payload["vehicle[axleCount]"] = rota.vehicle_axle_count;
          }

          // Adiciona "vehicle[type]" apenas se não for null
          if (rota.vehicle_type !== null) {
            payload["vehicle[type]"] = rota.vehicle_type;
          }

          // Adiciona "vehicle[category]" apenas se não for null
          if (rota.vehicle_category !== null) {
            payload["vehicle[category]"] = rota.vehicle_category;
          }

          // Adiciona "vehicle[trailerCount]" apenas se não for null
          if (rota.vehicle_trailer_count !== null) {
            payload["vehicle[trailerCount]"] = rota.vehicle_trailer_count;
          }

          // Adiciona "vehicle[licensePlate]" apenas se não for null
          if (rota.vehicle_license_plate !== null) {
            payload["vehicle[licensePlate]"] = rota.vehicle_license_plate;
          }

          // Adiciona "vehicle[occupancy]" apenas se não for null
          if (rota.vehicle_occupancy !== null) {
            payload["vehicle[occupancy]"] = rota.vehicle_occupancy;
          }

          // Adiciona "vehicle[engineType]" apenas se não for null
          if (rota.vehicle_engine_type !== null) {
            payload["vehicle[engineType]"] = rota.vehicle_engine_type;
          }

          // Adiciona "vehicle[heightAboveFirstAxle]" apenas se não for null
          if (rota.vehicle_height_above_first_axle !== null) {
            payload["vehicle[heightAboveFirstAxle]"] =
              rota.vehicle_height_above_first_axle;
          }

          // Adiciona "vehicle[commercial]" apenas se não for null
          if (rota.vehicle_commercial !== null) {
            payload["vehicle[commercial]"] = rota.vehicle_commercial;
          }

          const metodo = rota.method?.toUpperCase() || "GET";
          await this.gravarRequisicao(rota.id, JSON.stringify(payload));
          const resposta = await this.send2Here(metodo, payload);
          await this.gravarResposta(rota.id, JSON.stringify(resposta));
          await this.definirStatus(rota.id, StatusRota.Publicado.nome);
        } catch (error) {
          if (error instanceof Error) {
            this.ctx.logger.error(
              `Erro ao consultar rotas ${rota.id}: ${error.message}`
            );

            await this.gravarErro(rota.id, `${error.message}`);
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
        error: null,
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

  async gravarRequisicao(id: string, request: string): Promise<void> {
    try {
      await this.service.updateOne(id, {
        request: request,
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
      throw error;
    }
  }
}
