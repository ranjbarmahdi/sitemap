const { delay, readCsv } = require('./utils');
const { create } = require('xmlbuilder2');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require("uuid");
const zlib = require('zlib');
const xml2js = require('xml2js');

const input = './sitemapCsv';
const output = './sitemaps';
const csvFileNames = fs.readdirSync(input).filter(file => file.endsWith('csv'));

function convertJsonToXml(data){
    const root = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('urlset', {
        xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9',
        'xmlns:image': 'http://www.google.com/schemas/sitemap-image/1.1'
    });

    data.forEach(entry => {
        const url = root.ele('url');
        url.ele('loc').txt(entry.loc);
        url.ele('changefreq').txt(entry.changefreq);
        url.ele('priority').txt(entry.priority);
        if (entry.image_url) {
            const image = url.ele('image:image');
            const imaageLoc = image.ele('image:loc')
            imaageLoc.txt(entry.image_url);
        }
    });

    const xml = root.end({ prettyPrint: true });
    return xml
}


const modifyImageLoc = (url) => {
    return url.replaceAll('&amp;', '&');
  };

async function main(chunkSize){

    if(!fs.existsSync(input)) fs.mkdirSync(input);
    if(!fs.existsSync(output)) fs.mkdirSync(output);

    for(const csvFileName of csvFileNames){
        // red sitemap csv
        const csvFilePath = path.join(__dirname, input, csvFileName);
        const csvFile = await readCsv(csvFilePath);

        for(let i = 0; i < csvFile.length; i += chunkSize){
            const chunk = csvFile.slice(i, i + chunkSize);
            
            // process sitemap chunk
            let xml =  convertJsonToXml(chunk);

            // modify image:loc of xml 
            // xml2js.parseString(xml, { tagNameProcessors: [xml2js.processors.stripPrefix] }, (err, result) => {
            //     if (err) {
            //       throw err;
            //     }
              
            //     result.urlset.url.forEach(url => {
            //       if (url.image && url.image.image) {
            //         url.image.image.forEach(image => {
            //           if (image.loc) {
            //             image.loc[0] = modifyImageLoc(image.loc[0]);
            //           }
            //         });
            //       }
            //     });
              
            //     const builder = new xml2js.Builder({ rootName: 'urlset', headless: true });
            //     xml = builder.buildObject(result);
            //     console.log(xml);
            // });


            const uuid = uuidv4().replace(/-/g, "");
           
            // Compress the XML content
            const compressXml = (xml, callback) => {
                zlib.gzip(xml, (err, buffer) => {
                    if (err) {
                        callback(err);
                        return;
                    }
                    callback(null, buffer);
                });
            };

            // Write compressed XML to a file named uuid.gz
            const gzPath = path.join(__dirname, output, `${uuid}.gz`)
            compressXml(xml, (err, buffer) => {
                if (err) {
                    console.error('Error compressing XML:', err);
                    return;
                }


                fs.writeFile(gzPath, buffer, (err) => {
                    if (err) {
                        console.error('Error writing compressed file:', err);
                        return;
                    }
                    console.log(`Compressed XML written to ${uuid}.gz`);
                });
            });

            break
        }
    }
}

main(600)