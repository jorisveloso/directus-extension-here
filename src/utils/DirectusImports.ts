// Imports de tipagem do directus em um local centralizado para facilitar atualizacoes
// As vezes o directus troca isso de lugar quando atualiza a versão

export type { AssetsService, ItemsService } from "@directus/api/dist/services";
export type { AbstractServiceOptions } from "@directus/api/dist/types";
export type { ApiExtensionContext } from "@directus/extensions";
