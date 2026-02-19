# 🍽 Gastrónomos — WhatsApp Bot

Bot que escucha el grupo de WhatsApp y añade automáticamente a la base de datos los restaurantes que se comparten.

## ¿Cómo funciona?

1. Alguien manda un enlace en el grupo (Google Maps, TheFork, TripAdvisor, etc.)
2. El bot detecta el enlace y extrae: nombre, dirección, coordenadas, web
3. Lo guarda en la base de datos de Gastrónomos
4. Reacciona al mensaje con 🍽️ y confirma en el grupo

## Requisitos

- **Node.js** 18 o superior
- **Chromium/Chrome** instalado (para puppeteer)
- Acceso a la base de datos (`.env` del proyecto principal)

## Instalación

```bash
cd whatsapp-bot
npm install
```

> **Nota**: El bot usa el `.env` del proyecto principal (`../.env`)
> para conectarse a la misma base de datos.

## Configuración

Las variables de entorno se leen del `.env` del proyecto principal.
Puedes añadir estas variables opcionales:

```env
# Nombre exacto del grupo de WhatsApp (por defecto: "Gastrónomos")
WHATSAPP_GROUP_NAME=Gastrónomos

# ID del usuario en la DB que se usará como autor si el remitente no está registrado
BOT_USER_ID=1
```

## Uso

```bash
cd whatsapp-bot
node index.js
```

La **primera vez**:
1. Se mostrará un código QR en el terminal
2. Abre WhatsApp en tu teléfono → **Dispositivos vinculados** → **Vincular dispositivo**
3. Escanea el QR
4. La sesión se guarda en `./session/` — no tendrás que escanear de nuevo

## URLs soportadas

| Fuente | Ejemplo |
|--------|---------|
| Google Maps (largo) | `https://www.google.com/maps/place/...` |
| Google Maps (corto) | `https://goo.gl/maps/...` |
| Google Maps (app) | `https://maps.app.goo.gl/...` |
| Apple Maps | `https://maps.apple.com/?q=...` |
| TheFork / ElTenedor | `https://www.thefork.es/restaurante/...` |
| TripAdvisor | `https://www.tripadvisor.es/Restaurant_Review...` |
| Cualquier web | Intenta extraer el nombre via og:title |

## Notas importantes

- El bot **no puede ejecutarse en Vercel** (necesita un proceso persistente)
- Ejecútalo localmente o en un servidor VPS / Railway
- WhatsApp solo permite **un dispositivo vinculado** por número de teléfono
- Si cierras la app del teléfono, el bot puede desconectarse

## Detener el bot

Pulsa `Ctrl+C` para cerrarlo limpiamente.

Para **desconectar la sesión** completamente:
```bash
rm -rf ./session
```
