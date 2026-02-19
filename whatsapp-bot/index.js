/**
 * 🍽  Gastrónomos — WhatsApp Bot
 *
 * Escucha mensajes del grupo de WhatsApp y detecta enlaces de restaurantes.
 * Cuando encuentra uno, extrae la información y la añade automáticamente
 * a la base de datos de Gastrónomos.
 *
 * Uso:
 *   node index.js
 *
 * La primera vez mostrará un QR para escanear con WhatsApp.
 * La sesión se guarda en ./session para no tener que escanear de nuevo.
 */

require('dotenv').config({ path: '../.env' });

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
// Use the parent project's generated Prisma client (same schema/DB)
const { PrismaClient } = require('../node_modules/@prisma/client');
const { detectRestaurantInMessage } = require('./lib/extractRestaurant');

// ── Config ─────────────────────────────────────────────────────────────────

// Nombre exacto del grupo de WhatsApp (debe coincidir)
const GROUP_NAME = process.env.WHATSAPP_GROUP_NAME || 'Gastrónomos';

// ID del usuario que se usará como autor de los restaurantes añadidos por el bot
// Debe ser el ID de un usuario existente en la DB (ej. el admin)
const BOT_USER_ID = parseInt(process.env.BOT_USER_ID || '1');

// ── Prisma ──────────────────────────────────────────────────────────────────

const prisma = new PrismaClient();

// ── WhatsApp Client ─────────────────────────────────────────────────────────

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './session' }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
        ],
    },
    // Use a recent Chrome user agent to avoid detection
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
    },
});

// ── Events ──────────────────────────────────────────────────────────────────

client.on('qr', (qr) => {
    console.log('\n📱 Escanea este QR con WhatsApp en tu teléfono:\n');
    qrcode.generate(qr, { small: true });
    console.log('\nAbre WhatsApp → Dispositivos vinculados → Vincular dispositivo\n');
});

client.on('authenticated', () => {
    console.log('✅ Autenticado con WhatsApp');
});

client.on('auth_failure', (msg) => {
    console.error('❌ Error de autenticación:', msg);
    console.log('   Borra la carpeta ./session e inténtalo de nuevo');
});

client.on('ready', async () => {
    console.log(`\n🤖 Bot de Gastrónomos listo`);
    console.log(`   Buscando grupo: "${GROUP_NAME}"`);

    // Verify the group exists
    const chats = await client.getChats();
    const group = chats.find(c => c.isGroup && c.name === GROUP_NAME);

    if (group) {
        console.log(`   ✅ Grupo encontrado: ${group.name} (${group.id._serialized})`);
        console.log(`   👥 Participantes: ${group.participants?.length || 'N/A'}`);
    } else {
        console.warn(`   ⚠️  Grupo "${GROUP_NAME}" no encontrado.`);
        console.warn(`   Grupos disponibles:`);
        chats.filter(c => c.isGroup).forEach(g => console.warn(`     - "${g.name}"`));
        console.warn(`   Actualiza WHATSAPP_GROUP_NAME en .env`);
    }

    console.log('\n🔍 Escuchando mensajes con enlaces de restaurantes...\n');
});

client.on('disconnected', (reason) => {
    console.log('🔌 Desconectado:', reason);
});

// ── Message handler ──────────────────────────────────────────────────────────

client.on('message', async (msg) => {
    try {
        // Only process messages from the target group
        const chat = await msg.getChat();
        if (!chat.isGroup || chat.name !== GROUP_NAME) return;

        // Skip bot messages
        if (msg.fromMe) return;

        const text = msg.body || '';
        if (!text.trim()) return;

        console.log(`📨 Mensaje en "${chat.name}" de ${msg.author || msg.from}: ${text.substring(0, 80)}...`);

        // Detect restaurant URLs in the message
        const detected = await detectRestaurantInMessage(text);
        if (!detected) return;

        const { url, info } = detected;
        console.log(`\n🍽  Restaurante detectado:`);
        console.log(`   Nombre:   ${info.name}`);
        console.log(`   Dirección: ${info.address}`);
        console.log(`   Web:      ${info.website || 'N/A'}`);
        console.log(`   URL orig: ${url}`);

        if (!info.name) {
            console.log('   ⚠️  Sin nombre, ignorando...');
            return;
        }

        // Get the sender's user from DB (match by phone)
        const senderPhone = msg.from.replace(/@.*/, '').replace(/^(\d+)$/, '+$1');
        const sender = await prisma.user.findFirst({
            where: { phone: { contains: senderPhone.replace('+', '') } },
        });

        const userId = sender?.id || BOT_USER_ID;

        // Check if restaurant already exists
        if (info.address) {
            const existing = await prisma.restaurant.findFirst({
                where: { name: info.name, address: info.address },
            });
            if (existing) {
                console.log(`   ℹ️  Ya existe: ${info.name}`);
                return;
            }
        }

        // Save to database
        const restaurant = await prisma.restaurant.create({
            data: {
                name: info.name,
                address: info.address || null,
                url: info.website || null,
                description: info.description || null,
                googleMapsUrl: info.googleMapsUrl || null,
                appleMapsUrl: info.appleMapsUrl || null,
                latitude: info.lat || null,
                longitude: info.lng || null,
                cuisine: null,      // Will be filled manually in the web form
                priceRange: null,   // Will be filled manually in the web form
                userId,
            },
        });

        console.log(`   ✅ Guardado con ID ${restaurant.id} (usuario ID: ${userId})`);

        // React to message with a plate emoji to confirm
        try {
            await msg.react('🍽️');
        } catch (e) {
            // Reactions may not work in all WhatsApp versions
        }

        // Optional: send confirmation in group
        const authorName = sender?.name || 'alguien';
        await chat.sendMessage(
            `✅ *${info.name}* añadido a Gastrónomos por ${authorName}!\n` +
            `📍 ${info.address || 'Sin dirección'}\n` +
            `🌐 gastronomo-web.vercel.app/dashboard`
        );

    } catch (error) {
        console.error('Error procesando mensaje:', error);
    }
});

// ── Graceful shutdown ────────────────────────────────────────────────────────

async function shutdown() {
    console.log('\n🛑 Cerrando bot...');
    await client.destroy();
    await prisma.$disconnect();
    process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// ── Start ────────────────────────────────────────────────────────────────────

console.log('🚀 Iniciando Gastrónomos WhatsApp Bot...');
console.log('   Presiona Ctrl+C para detener\n');

client.initialize();
