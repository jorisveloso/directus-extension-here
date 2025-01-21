# Directus - Extensão Bundle HERE.COM

Este projeto é uma extensão do tipo Bundle para o Directus voltada para para integração com a plataforma here.com.

## 🚀 Levantando um Directus a partir de docker-compose

- Baixe este projeto ou copie o arquivo `docker-compose.yml` e inicie uma instalação do zero;
- Com o docker instalado na máquina ([saiba mais](https://docs.docker.com/get-docker/)), rode o comando:

```
 docker compose up

 ou

 docker compose up -d --no-deps --build directus-extension-here; docker compose up
```

Para atualizar o schema/types

`npx @devix/directus2ts --host <directus-host> --token <auth-token> --typeName HereExtension --outFile src/here-extension.d.ts --simplified`

> [!IMPORTANT] > _O docker-compose usado neste projeto está configurado para permitir iframe de qualquer domínio. Em produção você deve liberar apenas domínios confiáveis."_
>
> Além disso, para que o mapa usado funcione, é preciso estar atento para duas configurações em relação ao CSP (content security policy):

```yaml
HERE_API_INTEGRACAO_ATIVADA: true # ativa a integração com o here.com
HERE_API_BASE_URL: "https://router.hereapi.com/v8/" # url da api
HERE_API_ROUTES_PATH: "routes" # path da api
HERE_API_TOKEN: "<apiKey>" # Apikey ou token da plataforma
```

## 📌 Links importantes

- [Quickstart Directus](https://docs.directus.io/getting-started/quickstart.html) (na aba Docker Installation)
- [Como Criar uma extensão](https://docs.directus.io/extensions/creating-extensions.html)
- [Acessar serviços do Directus](https://docs.directus.io/extensions/services/introduction.html)
- [Acessar itens gravados nas coleções](https://docs.directus.io/extensions/services/accessing-items.html)
- [Here.com - Routing API Reference v8](https://www.here.com/docs/bundle/routing-api-v8-api-reference/page/index.html)
