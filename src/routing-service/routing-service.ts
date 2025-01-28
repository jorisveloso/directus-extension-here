import { HookExtensionContext } from "@directus/extensions";
import { decode } from "@here/flexpolyline";
import dotenv from "dotenv";
import { components } from "../here-extension";
import { ApiClient } from "../utils/api-client/api-client";
import { AbstractServiceOptions, ItemsService } from "../utils/DirectusImports";
import { StatusRota } from "./StatusRota";
dotenv.config();

type Schemas = components["schemas"];
type Rotas = Schemas["ItemsHereRouting"];

type GeoJSONLineString = {
  type: "LineString";
  coordinates: number[][];
};

interface Section {
  type?: string;
  language?: string;
  departure?: any;
  arrival?: any;
  spans?: Array<any>;
  transport?: any;
  polyline?: any;
  places?: Array<any>;
}

interface Route {
  id?: string;
  sections?: Section[];
}

interface RouteData {
  routes: Route[];
}

interface OutputResponse {
  data: RouteData[];
}

interface ApiResponse {
  routes?: Route[];
}

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

    if (
      !process.env.HERE_API_BASE_URL ||
      !process.env.HERE_API_ROUTES_PATH ||
      !process.env.HERE_API_TOKEN
    ) {
      throw new Error(
        "Variáveis de ambiente obrigatórias (HERE_API_BASE_URL, HERE_API_ROUTES_PATH, HERE_API_TOKEN) não foram definidas."
      );
    }

    this.baseUrl = process.env.HERE_API_BASE_URL;
    this.routePath = process.env.HERE_API_ROUTES_PATH;
    this.apiToken = process.env.HERE_API_TOKEN;
    this.apiClient = new ApiClient(this.baseUrl, this.apiToken, this.routePath);

    if (process.env.HERE_API_INTEGRACAO_ATIVADA !== "true") {
      throw new Error("Integração com a API da HERE está desativada.");
    }
  }

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
          if (!rota.origin || !rota.destination) {
            throw new Error(
              `Os campos 'origin' e 'destination' são obrigatórios para a rota ${rota.id}.`
            );
          }

          const originString = this.formatCoordinates(rota.origin);
          const destinationString = this.formatCoordinates(rota.destination);

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
          } as { [key: string]: any };

          if (rota.routingMode !== null) payload.routingMode = rota.routingMode;
          if (rota.vehicles_hipped_hazardous_goods !== null)
            payload["vehicle[shippedHazardousGoods]"] =
              rota.vehicles_hipped_hazardous_goods;
          if (rota.vehicle_current_weight !== null)
            payload["vehicle[currentWeight]"] = rota.vehicle_current_weight;
          if (rota.vehicle_tunnel_category !== null)
            payload["vehicle[tunnelCategory]"] = rota.vehicle_tunnel_category;
          if (rota.vehicle_axle_count !== null)
            payload["vehicle[axleCount]"] = rota.vehicle_axle_count;
          if (rota.vehicle_type !== null)
            payload["vehicle[type]"] = rota.vehicle_type;
          if (rota.vehicle_category !== null)
            payload["vehicle[category]"] = rota.vehicle_category;
          if (rota.vehicle_trailer_count !== null)
            payload["vehicle[trailerCount]"] = rota.vehicle_trailer_count;
          if (rota.vehicle_license_plate !== null)
            payload["vehicle[licensePlate]"] = rota.vehicle_license_plate;
          if (rota.vehicle_occupancy !== null)
            payload["vehicle[occupancy]"] = rota.vehicle_occupancy;
          if (rota.vehicle_engine_type !== null)
            payload["vehicle[engineType]"] = rota.vehicle_engine_type;
          if (rota.vehicle_height_above_first_axle !== null)
            payload["vehicle[heightAboveFirstAxle]"] =
              rota.vehicle_height_above_first_axle;
          if (rota.vehicle_commercial !== null)
            payload["vehicle[commercial]"] = rota.vehicle_commercial;

          const metodo = rota.method?.toUpperCase() || "GET";
          await this.gravarRequisicao(rota.id, JSON.stringify(payload));
          const resposta = await this.send2Here(metodo, payload);
          await this.gravarResposta(rota.id, JSON.stringify(resposta));
          await this.definirStatus(rota.id, StatusRota.Publicado.nome);
        } catch (error) {
          this.handleRouteError(rota.id, error);
        }
      }
    } catch (error) {
      this.handleSyncError(error);
    }
  }

  private convertResponse2Routes(responseData: ApiResponse): OutputResponse {
    const output: OutputResponse = {
      data: [
        {
          routes: [],
        },
      ],
    };

    if (!responseData.routes || !Array.isArray(responseData.routes)) {
      return output;
    }

    responseData.routes.forEach((route) => {
      const outputRoute: Route = {
        id: route.id || "",
        sections: [],
      };

      if (route.sections) {
        route.sections.forEach((section) => {
          const encodedPolyline = section.polyline;
          const decodedData = decode(encodedPolyline);

          // Corrigindo o erro de tipagem
          const decodedCoordinates = decodedData.polyline
            .map(([lat, lon]) => [lon, lat] as [number, number]) // Garantindo que lat e lon sejam números
            .filter(([lat, lon]) => lat !== undefined && lon !== undefined); // Removendo valores undefined

          // Convertendo as coordenadas para o formato GeoJSON LineString
          const geoJSONLineString: GeoJSONLineString = {
            type: "LineString",
            coordinates: decodedCoordinates,
          };

          const outputSection: Section = {
            type: section.type || "vehicle",
            language: section.language || "en-us",
            polyline: geoJSONLineString, // Usando o LineString diretamente
            transport: {
              mode: section.transport?.mode || "car",
              current_weight: section.transport?.current_weight || 3000,
            },
            places: [],
            spans: [],
          };

          if (section.departure) {
            outputSection.places!.push({
              name: "departure",
              location: {
                type: "Point",
                coordinates: [
                  section.departure.place.location.lng, // Longitude
                  section.departure.place.location.lat, // Latitude
                ],
              },
              originalLocation: {
                type: "Point",
                coordinates: [
                  section.departure.place.originalLocation.lng, // Longitude
                  section.departure.place.originalLocation.lat, // Latitude
                ],
              },
              type: "place",
              time: section.departure.time ?? "",
              place: section.departure.place ?? "",
            });
          }

          if (section.arrival) {
            outputSection.places!.push({
              name: "arrival",
              location: {
                type: "Point",
                coordinates: [
                  section.arrival.place?.location?.lng, // Longitude
                  section.arrival.place?.location?.lat, // Latitude
                ],
              },
              originalLocation: {
                type: "Point",
                coordinates: [
                  section.arrival.place?.originalLocation?.lng, // Longitude
                  section.arrival.place?.originalLocation?.lat, // Latitude
                ],
              },
              type: "place",
              time: section.arrival.time ?? "",
              place: section.arrival.place ?? "",
            });
          }

          if (section.spans) {
            section.spans.forEach((span) => {
              outputSection.spans = outputSection.spans || [];
              outputSection.spans.push({
                offset: span.offset,
                duration: span.duration,
                max_speed: this.formatNumber(span.maxSpeed, 7),
              });
            });
          }

          outputRoute.sections!.push(outputSection);
        });
      }

      if (output.data[0]) {
        output.data[0].routes.push(outputRoute);
      }
    });

    console.log("Output final:", JSON.stringify(output, null, 2));
    return output;
  }

  async gravarResposta(id: string, resposta: string): Promise<void> {
    try {
      console.log("Gravando resposta");
      const jsonResposta: ApiResponse = JSON.parse(resposta);
      const respostaFormatada = this.convertResponse2Routes(jsonResposta);

      await this.service.updateOne(id, {
        status: StatusRota.Publicado.nome,
        response: JSON.stringify(jsonResposta),
        routes: respostaFormatada.data[0]?.routes,
        log: respostaFormatada.data[0]?.routes,
        error: null,
      });
    } catch (error) {
      this.handleResponseError(id, error);
    }
  }

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
        this.handleQueryError(error);
      }
    }
    return this._rotas;
  }

  async definirStatus(id: string, status: string): Promise<void> {
    try {
      await this.service.updateOne(id, { status: status });
      this.ctx.logger.info(`Status da rota ${id} atualizado para ${status}`);
    } catch (error) {
      this.handleStatusUpdateError(id, error);
    }
  }

  async send2Here(metodo: string, payload: any): Promise<any> {
    if (!["GET", "POST"].includes(metodo)) {
      throw new Error(`Método HTTP não suportado: ${metodo}`);
    }

    const params = { ...payload, apikey: this.apiToken };

    try {
      if (metodo === "POST") {
        return await this.apiClient.post(params);
      } else {
        return await this.apiClient.get(params);
      }
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  async gravarRequisicao(id: string, request: string): Promise<void> {
    try {
      await this.service.updateOne(id, { request: request });
    } catch (error) {
      this.handleRequestError(id, error);
    }
  }

  async gravarErro(id: string, erro: string): Promise<void> {
    try {
      await this.service.updateOne(id, { error: erro });
    } catch (error) {
      throw error;
    }
  }

  private handleRouteError(id: string, error: unknown): void {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido";
    this.ctx.logger.error(`Erro na rota ${id}: ${message}`);
    this.gravarErro(id, message);
  }

  private handleSyncError(error: unknown): never {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido";
    this.ctx.logger.error("Erro geral na sincronização: ", message);
    throw new Error(message);
  }

  private handleQueryError(error: unknown): never {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido";
    this.ctx.logger.error("Erro na consulta de rotas: ", message);
    throw new Error(message);
  }

  private handleStatusUpdateError(id: string, error: unknown): never {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido";
    this.ctx.logger.error(`Erro ao atualizar status ${id}: ${message}`);
    throw new Error(message);
  }

  private handleApiError(error: unknown): Error {
    return error instanceof Error
      ? new Error(`Erro na API: ${error.message}`)
      : new Error("Erro desconhecido na API");
  }

  private handleResponseError(id: string, error: unknown): never {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido";
    this.ctx.logger.error(`Erro na resposta ${id}: ${message}`);
    throw new Error(message);
  }

  private handleRequestError(id: string, error: unknown): never {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido";
    this.ctx.logger.error(`Erro na requisição ${id}: ${message}`);
    throw new Error(message);
  }

  private formatNumber(
    speed?: number | null,
    decimals: number = 2
  ): number | null {
    if (speed === undefined || speed === null) return null;

    try {
      return Number(speed.toFixed(decimals));
    } catch (error) {
      console.error("Erro ao formatar número:", error);
      return null;
    }
  }
}
