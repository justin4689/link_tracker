const geoip    = require('geoip-lite');
const UAParser = require('ua-parser-js');
const { db }   = require('../db');
const { links, clicks } = require('../db/schema');
const { eq }   = require('drizzle-orm');

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
  return { country: geo.country || 'Inconnu', city: geo.city || 'Inconnue' };
}

exports.trackClick = async (req, res) => {
  try {
    const [link] = await db.select().from(links).where(eq(links.id, req.params.id));
    if (!link) return res.status(404).send('Lien introuvable');

    const ip  = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip;
    const geo = resolveGeo(ip);
    const ua  = new UAParser(req.headers['user-agent']);

    await db.insert(clicks).values({
      linkId:  req.params.id,
      ip,
      country: geo.country,
      city:    geo.city,
      browser: ua.getBrowser().name || 'Inconnu',
      os:      ua.getOS().name      || 'Inconnu',
      device:  ua.getDevice().type  || 'desktop',
      referer: req.headers['referer'] || 'Direct',
    });

    res.redirect(link.destination);
  } catch (e) {
    console.error(e);
    res.status(500).send('Erreur serveur');
  }
};
