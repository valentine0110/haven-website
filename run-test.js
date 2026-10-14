import { createServer } from 'vite';

(async () => {
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom'
  });
  
  try {
    const { renderToString } = await vite.ssrLoadModule('/node_modules/react-dom/server.js');
    const { StaticRouter } = await vite.ssrLoadModule('/node_modules/react-router-dom/server.js');
    const { default: App } = await vite.ssrLoadModule('/src/App.jsx');
    const React = await vite.ssrLoadModule('/node_modules/react/index.js');
    
    const pages = [
      '/admin/dashboard',
      '/admin/properties/new',
      '/admin/settings',
      '/admin/staff',
      '/admin/agents'
    ];
    
    for (const url of pages) {
      try {
        renderToString(React.createElement(StaticRouter, { location: url }, React.createElement(App)));
        console.log(`✅ ${url} renders successfully`);
      } catch (e) {
        console.log(`❌ ${url} CRASHED:`, e.message);
        console.log(e.stack);
      }
    }
  } catch (e) {
    console.error("Vite setup error:", e);
  } finally {
    await vite.close();
  }
})();
