
const tailwindcss = require('@tailwindcss/postcss');
const postcss = require('postcss');
const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, 'assets', 'css', 'input.css');
const outputFile = path.join(__dirname, 'assets', 'css', 'tailwind.css');
const config = require('./tailwind.config.js');

fs.readFile(inputFile, (err, css) => {
  if (err) throw err;

  postcss(tailwindcss(config))
    .process(css, { from: inputFile, to: outputFile })
    .then(result => {
      fs.writeFile(outputFile, result.css, () => true);
      console.log('Successfully generated tailwind.css');
    })
    .catch(error => {
      console.error(error);
    });
});
