import dotenv from "dotenv";
import { describe, expect, it, vi } from "vitest"; // Importa o vi
import { ApiClient } from "./api-client"; // Importa a classe do mesmo diretório

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

// Mock do fetch para simular a resposta da API
global.fetch = vi.fn();

describe("ApiClient", () => {
  // Validação das variáveis de ambiente obrigatórias
  if (
    !process.env.HERE_API_BASE_URL ||
    !process.env.HERE_API_ROUTES_PATH ||
    !process.env.HERE_API_TOKEN
  ) {
    throw new Error(
      "Variáveis de ambiente obrigatórias (HERE_API_BASE_URL, HERE_API_ROUTES_PATH, HERE_API_TOKEN) não foram definidas.",
    );
  }

  const baseUrl = process.env.HERE_API_BASE_URL; // URL base
  const path = process.env.HERE_API_ROUTES_PATH; // Path
  const token = process.env.HERE_API_TOKEN; // Token

  it("deve fazer uma requisição GET para a API HERE e retornar os dados corretamente", async () => {
    // Dados de exemplo que a API retornaria
    const mockResponse = {
      routes: [
        {
          id: "route-1",
          sections: [
            {
              id: "section-1",
              type: "vehicle",
              departure: {
                time: "2023-10-01T12:00:00Z",
                place: {
                  latitude: 52.5308,
                  longitude: 13.3847,
                },
              },
              arrival: {
                time: "2023-10-01T12:30:00Z",
                place: {
                  latitude: 52.5308,
                  longitude: 13.3847,
                },
              },
              summary: {
                duration: 1800,
                length: 5000,
              },
            },
          ],
        },
      ],
    };

    // Configura o mock do fetch para retornar a resposta simulada
    (fetch as vi.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    // Instancia o ApiClient com as variáveis de ambiente
    const apiClient = new ApiClient(baseUrl, token, path);

    // Faz a requisição GET
    const response = await apiClient.get();

    // Verifica se a resposta é a esperada
    expect(response).toEqual(mockResponse);

    // Verifica se o fetch foi chamado com a URL correta
    expect(fetch).toHaveBeenCalledWith(
      `${baseUrl}${path}`, // URL correta com o caminho /routes
      expect.objectContaining({
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Verifica se o token foi incluído no cabeçalho
        },
        signal: expect.any(AbortSignal), // Valida o AbortSignal de forma genérica
      }),
    );
  });

  it("deve lançar um erro se a requisição GET para a API HERE falhar", async () => {
    // Configura o mock do fetch para simular um erro
    (fetch as vi.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    // Instancia o ApiClient com as variáveis de ambiente
    const apiClient = new ApiClient(baseUrl, token, path);

    // Verifica se a requisição lança um erro
    await expect(apiClient.get()).rejects.toThrow("HTTP error! status: 500");
  });

  it("deve fazer uma requisição POST para a API HERE e retornar os dados corretamente", async () => {
    // Dados de exemplo que a API retornaria
    const mockResponse = {
      routes: [
        {
          id: "route-1",
          sections: [
            {
              id: "section-1",
              type: "vehicle",
              departure: {
                time: "2023-10-01T12:00:00Z",
                place: {
                  latitude: 52.5308,
                  longitude: 13.3847,
                },
              },
              arrival: {
                time: "2023-10-01T12:30:00Z",
                place: {
                  latitude: 52.5308,
                  longitude: 13.3847,
                },
              },
              summary: {
                duration: 1800,
                length: 5000,
              },
            },
          ],
        },
      ],
    };

    // Configura o mock do fetch para retornar a resposta simulada
    (fetch as vi.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    // Instancia o ApiClient com as variáveis de ambiente
    const apiClient = new ApiClient(baseUrl, token, path);

    // Corpo da requisição POST (exemplo baseado na documentação da HERE)
    const requestBody = {
      origins: [
        {
          lat: 52.5308,
          lng: 13.3847,
        },
      ],
      destinations: [
        {
          lat: 52.5308,
          lng: 13.3847,
        },
      ],
      transportMode: "car",
      routingMode: "fast",
      departureTime: "2023-10-01T12:00:00Z",
    };

    // Faz a requisição POST
    const response = await apiClient.post(requestBody);

    // Verifica se a resposta é a esperada
    expect(response).toEqual(mockResponse);

    // Verifica se o fetch foi chamado com a URL e o corpo corretos
    expect(fetch).toHaveBeenCalledWith(
      `${baseUrl}${path}`, // URL correta com o caminho /routes
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Verifica se o token foi incluído no cabeçalho
        },
        body: JSON.stringify(requestBody),
        signal: expect.any(AbortSignal), // Valida o AbortSignal de forma genérica
      }),
    );
  });

  it("deve lançar um erro se a requisição POST para a API HERE falhar", async () => {
    // Configura o mock do fetch para simular um erro
    (fetch as vi.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    // Instancia o ApiClient com as variáveis de ambiente
    const apiClient = new ApiClient(baseUrl, token, path);

    // Corpo da requisição POST (exemplo baseado na documentação da HERE)
    const requestBody = {
      origins: [
        {
          lat: 52.5308,
          lng: 13.3847,
        },
      ],
      destinations: [
        {
          lat: 52.5308,
          lng: 13.3847,
        },
      ],
      transportMode: "car",
      routingMode: "fast",
      departureTime: "2023-10-01T12:00:00Z",
    };

    // Verifica se a requisição lança um erro
    await expect(apiClient.post(requestBody)).rejects.toThrow(
      "HTTP error! status: 500",
    );
  });
});
