// leitor de qr code
const axios = require("axios");
const qrcode = require('qrcode-terminal');
const { Client, Buttons, List, MessageMedia } = require('whatsapp-web.js'); // Mudança Buttons
const client = new Client();
// serviço de leitura do qr code
client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});
// apos isso ele diz que foi tudo certo
client.on('ready', () => {
    console.log('Tudo certo! WhatsApp conectado.');
});
// E inicializa tudo 
client.initialize();

const token = `Bearer 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`

// Função para GPT-4 (conversação)
async function chatComGpt4(msg) {
    try {
        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: "gpt-4",
                messages: [
                    { role: "system", content: "Você é um assistente para o grupo do Bonde dos Together." },
                    { role: "user", content: msg }
                ]
            },
            {
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error("Erro na comunicação com GPT-4:", error);
        return "Houve um erro ao gerar a resposta.";
    }
}

// Função para DALL-E (geração de imagem)
async function gerarImagem(prompt) {
    try {
        const response = await axios.post(
            'https://api.openai.com/v1/images/generations',
            {
                prompt: prompt,
                n: 1,
                size: "1024x1024"
            },
            {
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data.data[0].url;  // Retorna a URL da imagem gerada
    } catch (error) {
        console.error("Erro ao gerar imagem:", error);
        return null;
    }
}

const delay = ms => new Promise(res => setTimeout(res, ms)); // Função que usamos para criar o delay entre uma ação e outra

// Funil

client.on('message', async msg => {

    //menu
    if (msg.body.match(/(!menu|!Menu)/i) && msg.from.endsWith('@c.us')) {
        const chat = await msg.getChat();


        await delay(2000); //delay de 1 segundos 
        await chat.sendStateTyping(); // Simulando Digitação
        await delay(2000); //delay de 1 segundos
        const contact = await msg.getContact(); //Pegando o contato
        const name = contact.pushname; //Pegar nome do contato
        await client.sendMessage(msg.from, 'Olá! ' + name.split(" ")[0] + " sou o BOT dos Bonde dos Together, selecione abaixo o que deseja:\n\n"
            + "01| Criar Figurinha - !Sticker\n"
            + "02| Conversar com ChatGPT - !Gpt\n"
            + "03| Gerar Imagem com ChatGPT - !Img"
        );
        await delay(2000); //delay de 1 segundos 
        await chat.sendStateTyping(); // Simulando Digitação
        await delay(2000); //delay de 1 segundos

    }

    //sticker
    if (msg.body.match(/(!sticker|!Sticker)/i) && msg.from.endsWith('@c.us')) {
        try {
            const chat = await msg.getChat();
            console.log(chat);

            await delay(1000);
            await chat.sendStateTyping();
            await delay(1000);

            // Verificar se a mensagem contém mídia
            if (msg.hasMedia) {
                console.log('Mídia detectada, tentando baixar...');
            } else {
                console.error('Nenhuma mídia encontrada na mensagem.');
                await client.sendMessage(msg.from, 'Erro: Por favor, envie uma imagem, GIF ou vídeo junto com o comando.');
                return;
            }


            // Tenta baixar a mídia (com timeout de 30 segundos)
            const mediaEntrada = await msg.downloadMedia({ timeout: 30000 });
            console.log(mediaEntrada);

            if (!mediaEntrada) {
                console.error('Falha no download da mídia.');
                await client.sendMessage(
                    msg.from,
                    'Erro: Não foi possível baixar a mídia. Tente novamente!'
                );
                return;
            }

            console.log('Mídia recebida:', mediaEntrada);

            // Verificar se é mídia animada ou GIF
            const tiposAnimados = ['video/mp4', 'image/gif', 'image/webp', 'webp'];

            if (msg.isGif || tiposAnimados.includes(mediaEntrada.mimetype)) {
                console.log('Convertendo para figurinha animada...');
                await client.sendMessage(msg.from, mediaEntrada, {
                    sendMediaAsSticker: true,
                    stickerAuthor: "BOT BDT",
                    stickerName: "Figurinha",
                    stickerAnimated: true,
                });
            } else {
                console.log('Convertendo para figurinha estática...');
                await client.sendMessage(msg.from, mediaEntrada, {
                    sendMediaAsSticker: true,
                    stickerAuthor: "BOT BDT",
                    stickerName: "Figurinha",
                });
            }

            await delay(1000); // Atraso adicional
        } catch (error) {
            console.error('Erro durante o processamento:', error);
            await client.sendMessage(
                msg.from,
                'Erro: Ocorreu um problema ao processar sua solicitação. Tente novamente mais tarde.'
            );
        }
    }




    // Conversar com ChatGPT
    if (msg.body.match(/(!gpt|!Gpt)/i) && msg.from.endsWith('@c.us')) {
        const chat = await msg.getChat();

        await delay(1000); // delay de 1 segundo
        await chat.sendStateTyping(); // Simulando Digitação
        await delay(1000); // delay de 1 segundo

        // Extrair o texto que vem após o comando !gpt
        const userMessage = msg.body.replace(/(!gpt|!Gpt)\s*/, ''); // Remove o comando da mensagem
        const respostaGpt = await chatComGpt4(userMessage); // Chama a função para conversar com GPT
        await client.sendMessage(msg.from, respostaGpt); // Envia a resposta do GPT

        await delay(1000); // delay de 1 segundo
    }

    //Gerar Imagem com o GPT
    if (msg.body.match(/(!img|!Img)/i) && msg.from.endsWith('@c.us')) {

        const chat = await msg.getChat();

        await delay(1000); //delay de 1 segundos
        await chat.sendStateTyping(); // Simulando Digitação
        await delay(1000); //Delay de 1 segundos
        const imagemGpt = await gerarImagem(msg.body);
        const media = await MessageMedia.fromUrl(imagemGpt);

        const contact = await msg.getContact(); //Pegando o contato
        const name = contact.pushname; //Pegando o nome do contato
        await client.sendMessage(msg.from, media); //texto do menu
        await delay(1000); //delay de 1 segundos 


    }

    if (msg.body !== null && msg.body === 'teste' && msg.from.endsWith('@c.us')) {
        const chat = await msg.getChat();


        await delay(1000); //delay de 1 segundos 
        await chat.sendStateTyping(); // Simulando Digitação
        await delay(1000); //delay de 1 segundos 
        await client.sendMessage(msg.from, '');

    }


})
