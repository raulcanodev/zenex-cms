# Revisión de Zenex CMS — 2026-08-31

## Cambios

- Node 24 LTS en desarrollo y Docker; Next 16.3.3, React 19.2.8, Auth.js beta.32 y Prisma 6.19.3. No se modificó el esquema ni se aplicaron migraciones.
- GitHub usa el issuer oficial `https://github.com/login/oauth`, conservando las comprobaciones OAuth. El alta usa upsert, rechaza email ausente y reutiliza el ID interno sin una segunda consulta JWT.
- API pública: solo posts publicados, parámetros validados, límite máximo de 100. `status=draft` y `status=all` devuelven 400. Dashboard y borradores internos no se cambian.
- `includeContent=false` omite el JSON de contenido desde Prisma y evita generar/enviar HTML. Compatibilidad por defecto: respuestas completas.
- Traducciones agrupadas en una consulta por página, restringidas al blog y a posts publicados. Caché de 60 s e invalidación al modificar/publicar/importar entradas.
- Renderizado HTML sanitizado; ejemplos de código escapados; soporte de listas anidadas y tablas. Los scripts, atributos ejecutables y iframes arbitrarios de bloques raw ya no se ejecutan; los embeds desconocidos se presentan como enlaces. Revisar entradas que dependieran de HTML activo antes de publicar.
- Preview de enlaces requiere sesión; bloquea IPs privadas/reservadas (IPv4, IPv6 y DNS), conecta a la IP validada, vuelve a validar cada redirección y limita descargas a 500 KB. Solo HTTP/HTTPS en puertos 80/443. Timeout de red de 10 s; la resolución DNS usa el timeout del sistema.
- Pool de base de datos creado solo al instanciar Prisma. Correcciones de tipos y efectos de React. Se conserva intacto el cambio que ya estaba staged en `components/PostForm/PostForm.tsx`.
- Lockfile incluido explícitamente y todas las variantes `.env.*` excluidas de Docker salvo el ejemplo.

## Verificación

Con Node 24.20.0: Prisma validate/generate, typecheck, build y 37 pruebas pasan. Lint no tiene errores, pero conserva 22 avisos de código existente (imports/variables sin usar, editor y una imagen). `npm audit`: 0 vulnerabilidades conocidas.

Las pruebas ejercitan el callback real de Auth.js con la red simulada: issuer correcto crea sesión e issuer ajeno se rechaza. También cubren API publicada, tamaño de página, respuestas ligeras, agrupación de idiomas, HTML y direcciones privadas. Descarga real de `https://example.com` comprobada con el nuevo preview.

HTTP local de producción: preview sin sesión devuelve 401; draft y límites inválidos devuelven 400. No se pudieron probar consultas contra la base de datos local porque devuelve ECONNREFUSED. El entorno local de producción también requiere configurar AUTH_URL/AUTH_TRUST_HOST para Auth.js; no se cambiaron secretos. No se ha probado el inicio de sesión real con la cuenta del usuario.

## Dependencia acotada

Prisma config fija `deepmerge-ts@7.1.5`, con una vulnerabilidad de recursión. Override únicamente en `@prisma/config` a 8.0.2: este consumidor usa `deepmerge`, no los hooks ni `deepmergeInto` modificados en v8. Se verificaron validate, generate y build. Retirar cuando Prisma actualice esta dependencia. Se mantiene Prisma 6 estable, sin migrar a una release candidate.

## Producción

Dokploy: Zenex → production → cms; dominio `cms.zenex.dev`, Dockerfile, puerto 3000. Auto-deploy activo en `main`. El MCP oculta variables de entorno: no se pudieron verificar valores OAuth ni se rotaron credenciales.

No se ha hecho push ni desplegado. Para publicar, revisar estos cambios y el comportamiento de raw/embeds, desplegar CMS y después portfolio. Tras desplegar, probar GitHub con callback `https://cms.zenex.dev/api/auth/callback/github`, publicación/edición de un artículo y actualización inmediata de API. No regenerar la clave OAuth salvo que aparezca un error de credenciales; el error proporcionado corresponde al issuer.

Fuentes: https://docs.github.com/en/apps/github-authentication-discovery-endpoints y https://nextjs.org/docs/app/api-reference/functions/updateTag.
