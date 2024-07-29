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

const black = []

function convertJsonToXml(data){
    const root = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('urlset', {
        xmlns: 'http://www.sitemaps.org/schemas/sitemap/0.9',
        'xmlns:image': 'http://www.google.com/schemas/sitemap-image/1.1'
    });

    data.forEach(entry => {
        if(black.includes(entry.product_id)){
            return;
        }
        const url = root.ele('url');
        url.ele('loc').txt(entry.loc);
        // url.ele('changefreq').txt(entry.changefreq);
        url.ele('priority').txt(entry.priority);
        // if (entry.image_url) {
        //     const image = url.ele('image:image');
        //     const imaageLoc = image.ele('image:loc')
        //     imaageLoc.txt(entry.image_url);
        //     const caption = image.ele('image:caption');
        //     caption.txt('وردست')
        // }
    });

    const xml = root.end({ prettyPrint: true });
    return xml
}


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
            xml = xml.replaceAll('&amp;', '&')

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
                    return;``
                }


                fs.writeFile(gzPath, buffer, (err) => {
                    if (err) {
                        console.error('Error writing compressed file:', err);
                        return;
                    }
                    console.log(`Compressed XML written to ${uuid}.gz`);
                });
            });

            
        }
    }
}

main(237)