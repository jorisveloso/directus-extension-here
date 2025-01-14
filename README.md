# Directus - Extensão Bundle HERE.COM

Este projeto é uma extensão do tipo Bundle para o Directus voltada para para integração com a plataforma here.com.

##  🚀  Levantando um Directus a partir de docker-compose

- Baixe este projeto ou copie o arquivo `docker-compose.yml` e inicie uma instalação do zero;
- Com o docker instalado na máquina ([saiba mais](https://docs.docker.com/get-docker/)), rode o comando:
```
 docker compose up
 
 ou
 
 docker compose up -d --no-deps --build directus-extension-here; docker compose up
```

Atualiza types

  `npx @devix/directus2ts --host <directus-host> --token <auth-token> --typeName AgilizaAi --outFile src/here-extension.d.ts --simplified`


> [!IMPORTANT] 
> _O docker-compose usado neste projeto está configurado para permitir iframe de qualquer domínio. Em produção você deve liberar apenas domínios confiáveis."_
>
> Além disso, para que o mapa usado funcione, é preciso estar atento para duas configurações em relação ao CSP (content security policy): 
 ```yaml
CONTENT_SECURITY_POLICY_DIRECTIVES__FRAME_SRC: "*" # permite iframe de qualquer domínio
CONTENT_SECURITY_POLICY_DIRECTIVES__IMG_SRC: "self http://0.0.0.0:8055 https: https://*.tile.openstreetmap.org data:" # permite imagens do mapa
DIRECTUS_HTTP_HEADERS__CONTENT_SECURITY_POLICY: "default-src *; img-src * 'self' data: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' *; style-src 'self' 'unsafe-inline' *" # define uma política global de segurança para sua aplicação através do cabeçalho HTTP Content-Security-Policy
```

## 📌 Links importantes

- [Quickstart Directus](https://docs.directus.io/getting-started/quickstart.html) (na aba Docker Installation)
- [Como Criar uma extensão](https://docs.directus.io/extensions/creating-extensions.html) 
- [Acessar serviços do Directus](https://docs.directus.io/extensions/services/introduction.html)
- [Acessar itens gravados nas coleções](https://docs.directus.io/extensions/services/accessing-items.html) 
- [Here.com - Routing API Reference v8](https://www.here.com/docs/bundle/routing-api-v8-api-reference/page/index.html)
