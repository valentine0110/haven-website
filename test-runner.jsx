import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server.mjs';
import App from './src/App.jsx';

const pages = [
  '/admin/dashboard',
  '/admin/properties/new',
  '/admin/settings',
  '/admin/staff',
  '/admin/agents',
  '/admin',
  '/properties'
];

for (const url of pages) {
  try {
    renderToString(
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    );
    console.log(`✅ ${url} renders successfully`);
  } catch (e) {
    console.log(`❌ ${url} CRASHED:`, e.message);
  }
}
