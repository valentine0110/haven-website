import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server.js';
import App from './src/App.jsx';

try {
  console.log(renderToString(<StaticRouter location="/admin/dashboard"><App /></StaticRouter>));
} catch (e) {
  console.error("CRASH:", e);
}
