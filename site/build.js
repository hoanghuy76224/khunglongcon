// Chạy tay khi sửa site/template.html: node site/build.js
const fs = require('fs');
const path = require('path');
const { render } = require('./render.js');

const root = path.join(__dirname, '..');
const template = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf8');
const content = JSON.parse(fs.readFileSync(path.join(__dirname, 'content.json'), 'utf8'));
fs.writeFileSync(path.join(root, 'index.html'), render(template, content));
console.log('index.html đã được tạo lại');
