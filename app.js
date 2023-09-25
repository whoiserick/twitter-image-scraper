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
const cookie = '776e42c14a5cab3a8093e40a74a4cbf7417ff832'; // Adicione o cookie da sua sessão aqui
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

    const response = await request(imageUrl, {
      headers: {
        'Cookie': cookie,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        // Adicione outros headers se necessário
      }
    });

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
  let maxId = null;
  let totalPages = 0;

  do {
    const profileUrl = `https://twitter.com/${currUsername}?max_id=${maxId ? maxId : ''}`;

    try {
      const response = await request.get({
        url: profileUrl,
        headers: {
          'Cookie': cookie,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          // more Headers if necessary
        }
      });

      const $ = cheerio.load(response.body);

      let tweetsFound = 0;

      for (const currTimeline of $('.twitter-timeline-link')) {
        const imageUrl = $(currTimeline).attr('data-resolved-url-large');
        if (imageUrl) {
          await downloadImage(currUsername, imageUrl);
          tweetsFound++;
        }
      }

      totalPages++;
      console.log(`Página ${totalPages}: ${tweetsFound} imagens encontradas.`);

      // Atualiza maxId para a próxima página
      const nextMaxId = $('[data-min-position]').attr('data-min-position');
      if (nextMaxId && nextMaxId !== maxId) {
        maxId = nextMaxId;
      } else {
        break;
      }
    } catch (error) {
      console.error('Erro ao obter a página do perfil:', error);
      break;
    }
  } while (maxId && totalPages < 10); // Limite de 10 páginas para evitar loops infinitos
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
