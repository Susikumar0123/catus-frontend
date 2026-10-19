'use strict';
module.exports = function invalidSeoUrl(req, res) {
  res.setHeader('X-Robots-Tag', 'noindex');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(410).send('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Page unavailable | Cerood</title></head><body><main><h1>This page is unavailable</h1><p>Explore Cerood services from our home page.</p><a href="/">Go to Cerood</a></main></body></html>');
};
