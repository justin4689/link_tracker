const geoip    = require('geoip-lite');
const UAParser = require('ua-parser-js');
const db       = require('../db');

function isPrivateIP(ip) {
  return (
    ip === '127.0.0.1'        ||
    ip === '::1'              ||
    ip === '::ffff:127.0.0.1' ||
    ip.startsWith('192.168.') ||
    ip.startsWith('10.')      ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip)
  );
}

function resolveGeo(ip) {
  if (isPrivateIP(ip)) return { country: 'Local', city: 'Localhost' };
  const geo = geoip.lookup(ip) || {};
  return {
    country: geo.country || 'Inconnu',
    city:    geo.city    || 'Inconnue',
  };
}

exports.trackClick = (req, res) => {
  const link = db.prepare('SELECT * FROM links WHERE id = ?').get(req.params.id);
  if (!link) return res.status(404).send('Lien introuvable');

  const ip  = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip;
  const geo = resolveGeo(ip);
  const ua  = new UAParser(req.headers['user-agent']);

  db.prepare(`
    INSERT INTO clicks (link_id, ip, country, city, browser, os, device, referer)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    req.params.id,
    ip,
    geo.country,
    geo.city,
    ua.getBrowser().name || 'Inconnu',
    ua.getOS().name      || 'Inconnu',
    ua.getDevice().type  || 'desktop',
    req.headers['referer'] || 'Direct'
  );

  res.redirect(link.destination);
};
