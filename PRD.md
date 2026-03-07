# PRD: Modernización y publicación de `@obseqia/openpay-node`

**Estado:** En progreso  
**Versión objetivo:** 3.1.0  
**Fecha de creación:** 2026-03-06  
**Repositorio:** https://github.com/obseqia/openpay-node

---

## Contexto

Este repositorio es un fork modernizado del SDK oficial de Openpay para Node.js. El objetivo es:

1. Mantener compatibilidad con el repositorio upstream para poder contribuir de vuelta.
2. Publicarlo como paquete propio bajo el scope `@obseqia` en npmjs.

El análisis a continuación cubre tres dimensiones: **problemas urgentes**, **cobertura funcional/documentación**, y **configuraciones de publicación**.

---

## 1. Problemas urgentes

### 1.1 Inconsistencia crítica: `.vscode/` apunta a Prettier, el proyecto usa Biome

**Severidad:** Alta  
**Archivos afectados:** `.vscode/settings.json`, `.vscode/extensions.json`

El proyecto tiene Biome configurado como formatter/linter (`AGENTS.md` lo especifica, `biome.json` debería existir pero no existe en el repositorio), sin embargo `.vscode/settings.json` configura Prettier como formatter y `.vscode/extensions.json` recomienda solo Prettier. Esto provoca que los colaboradores que usen VS Code no apliquen las convenciones del proyecto automáticamente.

**Acción requerida:**

- Crear `biome.json` en la raíz del proyecto (actualmente ausente a pesar de que `pnpm lint` ejecuta `biome lint`).
- Actualizar `.vscode/settings.json` para usar `biomejs.biome`.
- Actualizar `.vscode/extensions.json` para recomendar `biomejs.biome` y desrecomendar Prettier.

### 1.2 `biome.json` ausente

**Severidad:** Alta  
**Impacto:** El script `pnpm lint` falla si Biome no está instalado globalmente y no hay config local.

`AGENTS.md` documenta que el proyecto usa `biome.json` para formateo/lint, pero el archivo no existe en el repositorio. Biome está instalado como devDependency (implícito por `pnpm exec biome`), pero sin config el comportamiento es el predeterminado de Biome que puede diferir de las reglas documentadas en `AGENTS.md` (single quotes, semicolons, 110 cols).

**Acción requerida:**

- Crear `biome.json` con las reglas que describe `AGENTS.md`.

### 1.3 `package.json`: nombre incorrecto / falta metadata esencial para npm

**Severidad:** Alta  
**Archivo:** `package.json`

El `name` actual es `@obseqia/openpay` pero el repositorio y el nombre deseado es `@obseqia/openpay-node`. Además faltan campos esenciales para una publicación npm correcta:

| Campo faltante                       | Por qué importa                                                                       |
| ------------------------------------ | ------------------------------------------------------------------------------------- |
| `license`                            | npm lo muestra en el registro; algunos consumidores lo requieren                      |
| `keywords`                           | Mejora el descubrimiento en npmjs                                                     |
| `author` / `contributors`            | Atribución clara; requerido para separarse del proyecto upstream                      |
| `homepage`                           | Link al README o sitio del paquete                                                    |
| `bugs`                               | URL de issues para reportes                                                           |
| `publishConfig`                      | Control de acceso (`public`) y registro de publicación                                |
| `Biome` como devDependency explícita | Actualmente solo se invoca con `pnpm exec biome` pero no aparece en `devDependencies` |

**Acción requerida:**

- Renombrar `name` a `@obseqia/openpay-node`.
- Agregar `license`, `keywords`, `author`, `homepage`, `bugs`, `publishConfig`.
- Agregar `biome` a `devDependencies`.

### 1.4 Tipo de retorno incorrecto en `stores.list`

**Severidad:** Media  
**Archivo:** `src/types.ts:557`

```ts
// Actual (incorrecto):
list(query?: Store.ListQuery): Promise<Store>;

// Correcto:
list(query?: Store.ListQuery): Promise<Store[]>;
```

La API de tiendas devuelve un array de tiendas, no una sola tienda. El tipo actual es inconsistente con todos los demás métodos `list` del SDK.

### 1.5 Tipo `any` en tipos públicos

**Severidad:** Media  
**Archivos:** `src/types.ts`

Los siguientes campos usan `any` en la API pública, lo que deteriora la seguridad de tipos para consumidores:

```ts
// Plan (línea 397-398):
default_charge_quantity?: any | null;

// Subscription (línea 444):
default_charge_quantity?: any | null;

// Checkout.update (línea 646):
update(checkoutId: string, status: Checkout.Status, data: any): Promise<Checkout>;
```

**Acción requerida:**

- Investigar la forma real de `default_charge_quantity` en la API de Openpay y tiparlo explícitamente, o usar `unknown`.
- Tipificar `data` en `Checkouts.update` con al menos `Partial<Checkout.CreateInput>`.

### 1.6 Validación de IP no soporta IPv6

**Severidad:** Baja / Deuda técnica  
**Archivo:** `src/openpay.ts:52`

La regex actual solo valida IPv4. Si un consumidor pasa una IPv6 válida, el SDK la rechaza con un error de runtime. Esto puede ser un problema en entornos modernos.

**Acción requerida:**

- Ampliar la validación o documentar explícitamente que solo IPv4 es soportada.

### 1.7 Tests sin `biome` check en CI / sin CI configurado

**Severidad:** Media  
**Impacto:** No hay pipeline de CI (GitHub Actions u otro) en el repositorio.

Sin CI, un PR puede romper build o lint sin que nadie lo note. Para un paquete publicado esto es especialmente importante.

**Acción requerida:**

- Crear workflow de GitHub Actions que ejecute `pnpm build` y `pnpm lint` en cada PR.
- Los tests de integración (que requieren credenciales de sandbox) quedan opcionales en CI.

### 1.8 `testPayouts` flag hardcodeado en `false`

**Severidad:** Baja  
**Archivo:** `tests/mexico.spec.ts:6`

```ts
const testPayouts = false;
```

Los tests de payouts están deshabilitados permanentemente con una variable hardcodeada. Si se quiere activarlos eventualmente, debería controlarse con una variable de entorno.

---

## 2. Cobertura funcional y documentación (README)

El README actual es funcional pero incompleto. Las siguientes áreas requieren actualización:

### 2.1 Recursos no documentados en el README

Los siguientes recursos/métodos existen en el SDK pero no tienen ejemplo ni mención en el README:

| Recurso                   | Métodos implementados                       | Documentado en README |
| ------------------------- | ------------------------------------------- | --------------------- |
| `tokens`                  | `create`, `get`                             | No                    |
| `stores`                  | `list` (con geolocalizacion)                | No                    |
| `pse`                     | `create`                                    | No                    |
| `checkouts`               | `create`, `list`, `get`, `update`           | No                    |
| `plans`                   | `create`, `list`, `get`, `update`, `delete` | No                    |
| `customers.transfers`     | `create`, `list`, `get`                     | No                    |
| `customers.subscriptions` | `create`, `list`, `get`, `update`, `delete` | No                    |
| `customers.pse`           | `create`                                    | No                    |
| `customers.checkouts`     | `create`                                    | No                    |
| `customers.bankaccounts`  | `create`, `list`, `get`, `delete`           | No                    |
| `fees`                    | `create`, `list`                            | No                    |
| `payouts`                 | `create`, `list`, `get`                     | No                    |
| `webhooks`                | `create`, `list`, `get`, `delete`           | No                    |
| `setTimeout`              | setter de timeout global                    | No                    |

El README solo documenta `customers.create` y `charges.create` como ejemplos.

### 2.2 Diferencias por país no documentadas

El SDK soporta campos y endpoints distintos por país. El README no comunica claramente cuáles métodos son exclusivos de un país:

- `pse` / `customers.pse` → Solo Colombia
- `customers.checkouts` / `checkouts` → Solo Perú (basado en tests)
- `customers.transfers` → Solo México (Colombia no tiene tests para esto)
- Campo `iva` en `Charge.CreateBase` → Colombia
- Campo `customer_address` en `Customer` → Colombia
- Campo `clientIP` como requerido con IPv4 → Documentado pero la validación strict no está explicada

### 2.3 Correcciones menores en README existente

- Línea 68: typo `"yo need"` → `"you need"`
- La sección de instalación dice `npm i openpay` / `pnpm i openpay` → debe actualizarse al nuevo nombre `@obseqia/openpay-node`.
- Los imports en los ejemplos (`from "openpay"`) deben actualizarse.
- `error.data.description` está tipado como `boolean` en la tabla de la línea 120, debería ser `string`.

### 2.4 Sección de compatibilidad desactualizada

El README dice "Node.js v14.0.0 and above" lo que es correcto según `engines` en `package.json`, pero Node 14 alcanzó EOL en abril 2023. Considerar elevar el mínimo a Node 18 (LTS activo) y actualizar la documentación.

---

## 3. Configuraciones para publicar en npm

### 3.1 Cambios en `package.json`

```json
{
  "name": "@obseqia/openpay-node",
  "version": "3.1.0",
  "description": "Modern Openpay SDK for Node.js — supports México, Colombia and Perú",
  "license": "MIT",
  "author": "Obseqia <dev@obseqia.com>",
  "homepage": "https://github.com/obseqia/openpay-node#readme",
  "bugs": {
    "url": "https://github.com/obseqia/openpay-node/issues"
  },
  "keywords": ["openpay", "payments", "mexico", "colombia", "peru", "sdk", "node"],
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  }
}
```

### 3.2 Archivo `.npmignore` o campo `files` en `package.json`

El campo `files` ya está configurado correctamente:

```json
"files": ["dist"]
```

Esto es suficiente. No se necesita `.npmignore`. Verificar que `dist/` se genere correctamente antes de publicar.

### 3.3 Agregar `LICENSE`

El repositorio no tiene archivo `LICENSE`. Para publicar un paquete npm de código abierto, se debe incluir.

**Acción requerida:**

- Crear `LICENSE` con la licencia MIT (o la que corresponda).

### 3.4 Script de publicación / workflow de release

Actualmente no hay script automatizado de release. Para publicar manualmente:

```bash
pnpm build
npm publish --access public
```

**Acción requerida (a futuro):**

- Agregar script `release` en `package.json`.
- Considerar usar `changesets` o un workflow de GitHub Actions para automatizar releases.

### 3.5 Autenticación en npmjs

Para publicar bajo `@obseqia`, la cuenta de npm asociada al scope debe existir y el token de publicación debe configurarse:

```bash
npm login
# o usando token:
npm config set //registry.npmjs.org/:_authToken <TOKEN>
```

### 3.6 Relación con upstream

Para mantener compatibilidad con el repositorio upstream (`openpay` en npm), se recomienda:

- Mantener la misma API pública (no romper breaking changes sin bumpar `major`).
- Documentar en el README que este es un fork modernizado del SDK oficial.
- Usar un `upstream` remote en git para facilitar cherry-picks de cambios del original.

---

## Roadmap de tareas

### Fase 1: Correcciones urgentes (pre-publicación)

- [ ] **P1** Crear `biome.json` con reglas documentadas en `AGENTS.md`
- [ ] **P1** Actualizar `.vscode/settings.json` y `.vscode/extensions.json` para Biome
- [ ] **P1** Renombrar paquete a `@obseqia/openpay-node` en `package.json`
- [ ] **P1** Agregar metadata faltante en `package.json` (`license`, `keywords`, `author`, etc.)
- [ ] **P1** Crear archivo `LICENSE`
- [ ] **P2** Corregir tipo de retorno `stores.list` → `Promise<Store[]>`
- [ ] **P2** Reemplazar `any` en `Plan.default_charge_quantity`, `Subscription.default_charge_quantity`, `Checkouts.update`
- [ ] **P2** Actualizar README: corregir nombre del paquete en ejemplos de instalación e imports
- [ ] **P2** Corregir typo `"yo need"` en README línea 68
- [ ] **P2** Corregir tipo `description: boolean` → `description: string` en tabla de errores

### Fase 2: Mejoras de documentación

- [ ] **P2** Documentar todos los recursos en README con al menos un ejemplo por recurso
- [ ] **P2** Agregar tabla de compatibilidad por país
- [ ] **P3** Actualizar compatibilidad de Node.js (evaluar elevar mínimo a Node 18)
- [ ] **P3** Documentar `setTimeout` en la sección de configuración

### Fase 3: Infraestructura

- [ ] **P2** Crear workflow de GitHub Actions para CI (lint + build en PRs)
- [ ] **P3** Controlar `testPayouts` con variable de entorno en lugar de flag hardcodeado
- [ ] **P3** Evaluar soporte IPv6 en validación de `clientIP`
- [ ] **P3** Agregar script/workflow de release automatizado
- [ ] **P3** Agregar remote `upstream` apuntando al repositorio oficial de Openpay

---

## Inventario completo de la API del SDK

Para referencia durante la actualización del README:

### Recursos de merchant (nivel raíz)

| Recurso     | Método                     | Descripción                                       | País       |
| ----------- | -------------------------- | ------------------------------------------------- | ---------- |
| `charges`   | `create(data)`             | Crear cargo (tarjeta, tienda, banco, alipay, IVR) | MX, CO, PE |
| `charges`   | `list(query?)`             | Listar cargos                                     | MX, CO, PE |
| `charges`   | `get(txnId)`               | Obtener cargo                                     | MX, CO, PE |
| `charges`   | `capture(txnId, data)`     | Capturar cargo pre-autorizado                     | MX         |
| `charges`   | `refund(txnId, data)`      | Reembolsar cargo                                  | MX, CO     |
| `payouts`   | `create(data)`             | Crear retiro a tarjeta/cuenta bancaria            | MX         |
| `payouts`   | `list(query?)`             | Listar retiros                                    | MX         |
| `payouts`   | `get(txnId)`               | Obtener retiro                                    | MX         |
| `fees`      | `create(data)`             | Cobrar comisión a cliente                         | MX         |
| `fees`      | `list(query?)`             | Listar comisiones                                 | MX         |
| `cards`     | `create(data)`             | Crear tarjeta de merchant                         | MX, CO, PE |
| `cards`     | `list(query?)`             | Listar tarjetas                                   | MX, CO, PE |
| `cards`     | `get(cardId)`              | Obtener tarjeta                                   | MX, CO, PE |
| `cards`     | `update(cardId, data)`     | Actualizar tarjeta                                | MX, CO, PE |
| `cards`     | `delete(cardId)`           | Eliminar tarjeta                                  | MX, CO, PE |
| `plans`     | `create(data)`             | Crear plan de suscripción                         | MX, CO, PE |
| `plans`     | `list(query?)`             | Listar planes                                     | MX, CO, PE |
| `plans`     | `get(planId)`              | Obtener plan                                      | MX, CO, PE |
| `plans`     | `update(planId, data)`     | Actualizar plan                                   | MX, CO, PE |
| `plans`     | `delete(planId)`           | Eliminar plan                                     | MX, CO, PE |
| `webhooks`  | `create(data)`             | Crear webhook                                     | MX, CO, PE |
| `webhooks`  | `list()`                   | Listar webhooks                                   | MX, CO, PE |
| `webhooks`  | `get(webhookId)`           | Obtener webhook                                   | MX, CO, PE |
| `webhooks`  | `delete(webhookId)`        | Eliminar webhook                                  | MX, CO, PE |
| `tokens`    | `create(data)`             | Crear token de tarjeta                            | MX, CO, PE |
| `tokens`    | `get(tokenId)`             | Obtener token                                     | MX, CO, PE |
| `stores`    | `list(query)`              | Buscar tiendas por geolocalización                | MX, CO     |
| `pse`       | `create(data)`             | Crear cargo PSE (débito bancario)                 | CO         |
| `checkouts` | `create(data)`             | Crear link de pago                                | PE         |
| `checkouts` | `list(query?)`             | Listar links de pago                              | PE         |
| `checkouts` | `get(checkoutId)`          | Obtener link de pago                              | PE         |
| `checkouts` | `update(id, status, data)` | Actualizar link de pago                           | PE         |

### Sub-recursos de customer

| Recurso                   | Método                                       | País       |
| ------------------------- | -------------------------------------------- | ---------- |
| `customers`               | `create`, `list`, `get`, `update`, `delete`  | MX, CO, PE |
| `customers.charges`       | `create`, `list`, `get`, `capture`, `refund` | MX, CO, PE |
| `customers.cards`         | `create`, `list`, `get`, `update`, `delete`  | MX, CO, PE |
| `customers.bankaccounts`  | `create`, `list`, `get`, `delete`            | MX         |
| `customers.transfers`     | `create`, `list`, `get`                      | MX         |
| `customers.payouts`       | `create`, `list`, `get`                      | MX         |
| `customers.subscriptions` | `create`, `list`, `get`, `update`, `delete`  | MX, CO, PE |
| `customers.pse`           | `create`                                     | CO         |
| `customers.checkouts`     | `create`                                     | PE         |

---

_Este documento debe actualizarse conforme se completen las tareas del roadmap._
