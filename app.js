/********** Libraries **********/
const request = require('request');
const cron = require('cron').CronJob;
const cheerio = require('cheerio');
const async = require('async');
const moment = require('moment');
const fs = require('fs').promises; // Utilizando o módulo fs promisificado
/*******************************/

/********** Constants & Variables **********/
const imageUrlTimeout = 3600;
const usernames = ['ukazuhira'];
/*******************************************/

// Função para criar diretório se não existir
async function createDirectoryIfNotExists(path) {
  try {
    await fs.mkdir(path, { recursive: true });
  } catch (error) {
    console.error('Erro ao criar diretório:', error);
  }
}

async function downloadImage(currUsername, imageUrl) {
  try {
    await createDirectoryIfNotExists(`./images/${currUsername}`);

    const now = moment();
    const fileName = `./images/${currUsername}/${now.unix()}${imageUrl.split('/').pop().split(':')[0]}`;

    const response = await request(imageUrl);
    if (response.statusCode === 200) {
      console.log('Downloaded new image to', fileName);

      // Cria o arquivo no sistema de arquivos
      await fs.writeFile(fileName, response.body);
    } else {
      console.error('Erro ao baixar a imagem:', response.statusCode);
    }
  } catch (error) {
    console.error('Erro:', error);
  }
}

async function scrapeTwitterProfile(currUsername) {
  const profileUrl = `https://twitter.com/${currUsername}`;

  try {
    const response = await request.get({
      url: profileUrl,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const body = response.body;

    const $ = cheerio.load(body);

    for (const currTimeline of $('.twitter-timeline-link')) {
      const imageUrl = $(currTimeline).attr('data-resolved-url-large');
      if (imageUrl) {
        await downloadImage(currUsername, imageUrl);
      }
    }
  } catch (error) {
    console.error('Erro ao obter a página do perfil:', error);
  }
}

// Função principal
async function downloadImages() {
  console.log('\n######################################################################');
  console.log('Download images started at', new Date());
  console.log('######################################################################');

  for (const currUsername of usernames) {
    await scrapeTwitterProfile(currUsername);
  }

  console.log('######################################################################');
  console.log('Download images ended at', new Date());
  console.log('######################################################################');
}

// Configuração do cron job
const job = new cron({
  cronTime: '0 */3 * * * *',
  onTick: downloadImages,
  start: true,
});
