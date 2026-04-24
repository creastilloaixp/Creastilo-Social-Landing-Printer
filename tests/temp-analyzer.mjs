import fs from 'fs';

async function analyze() {
  const res = await fetch('https://grupoatia.com/');
  const html = await res.text();
  
  // Find css links
  const cssLinks = html.match(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g) || [];
  console.log("CSS Links:", cssLinks);

  for (const linkTag of cssLinks) {
      const match = linkTag.match(/href="([^"]+)"/);
      if (match) {
          let cssUrl = match[1];
          if (cssUrl.startsWith('/')) cssUrl = 'https://grupoatia.com' + cssUrl;
          try {
            const cssRes = await fetch(cssUrl);
            const css = await cssRes.text();
            const hexColors = css.match(/#[0-9a-fA-F]{3,6}/g) || [];
            console.log(`CSS ${cssUrl} Hex colors:`, [...new Set(hexColors)]);
          } catch(e) { console.log("Failed fetching CSS"); }
      }
  }
}

analyze();