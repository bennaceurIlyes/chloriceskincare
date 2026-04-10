const fs = require('fs');
const files = ['index.html', 'story.html', 'products.html', 'product.html', 'checkout.html', 'admin.html'];
files.forEach(f => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/colors:\s*\{[^}]+\}/g, "colors: { bone:'#FAFAF7', forest:'#405342', gold:'#D8C3A5', 'gold-light':'#E8E1D5' }");
    content = content.replace(/image\/logo\.png/g, "image/logo.svg");
    fs.writeFileSync(f, content, 'utf8');
  }
});
console.log("HTML files updated.");
