import dotenv from "dotenv";
dotenv.config();

export class ApiClient {
  private baseUrl: string;
  private apiKey: string; // Alterado de 'token' para 'apiKey'
  private path: string;
  private requestTimeout: number;

  constructor(
    baseUrl: string,
    apiKey: string, // Alterado de 'token' para 'apiKey'
    path: string,
    requestTimeout: number = 10000,
  ) {
    // Validação dos parâmetros obrigatórios
    if (!baseUrl || !apiKey || !path) {
      throw new Error(
        "Parâmetros obrigatórios (baseUrl, apiKey, path) não foram fornecidos.",
      );
    }

    // Atribui os parâmetros
    this.baseUrl = baseUrl;
    this.apiKey = apiKey; // Alterado de 'token' para 'apiKey'
    this.path = path;
    this.requestTimeout = requestTimeout;
  }

  private async request(method: "GET" | "POST", data?: any): Promise<any> {
    // Monta a URL completa usando baseUrl e path
    let url = `${this.baseUrl}${this.path}`;

    // Adiciona a chave da API como query parameter
    url += `?apikey=${this.apiKey}`;

    // Se o método for GET e houver dados, adiciona-os como query parameters
    if (method === "GET" && data) {
      const queryParams = new URLSearchParams(data).toString();
      url += `&${queryParams}`;
    }

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (method === "POST" && data) {
      options.body = JSON.stringify(data);
    }

    // Configura o timeout usando AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);
    options.signal = controller.signal;

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseData = await response.json();

      return responseData;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Request timed out after ${this.requestTimeout}ms`);
      } else {
        throw error;
      }
    } finally {
      clearTimeout(timeoutId); // Limpa o timeout
    }
  }

  public async get(data?: any): Promise<any> {
    return this.request("GET", data);
  }

  public async post(data: any): Promise<any> {
    return this.request("POST", data);
  }
}
