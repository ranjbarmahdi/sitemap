const { create } = require('xmlbuilder2');
const fs = require('fs');
const path = require('path');

const directoryPath = './sitemaps';
const outputFilePath = './sitemap.xml';

// Get all .gz files in the directory
const gzFiles = fs.readdirSync(directoryPath).filter(file => file.endsWith('.gz'));

// Get current date in XML date format
const currentDate = new Date().toISOString().split('T')[0];

// Create the XML structure
const xmlObj = {
  sitemapindex: {
    '@xmlns': 'http://www.sitemaps.org/schemas/sitemap/0.9',
    sitemap: gzFiles.map(file => ({
      loc: `https://storage.vardast.com/vardast/sitemap/${file}`,
      lastmod: currentDate
    }))
  }
};

// Build XML
const xml = create(xmlObj).end({ prettyPrint: true });

// Write XML to file
fs.writeFileSync(outputFilePath, xml);

console.log('Sitemap XML created successfully.');
