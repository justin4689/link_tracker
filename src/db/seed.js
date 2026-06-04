const db = require('./index');

// ---- Helpers ----
const pick  = arr => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function randomDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - randInt(0, daysAgo));
  d.setHours(randInt(6, 23), randInt(0, 59), randInt(0, 59));
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

// ---- Données de référence ----
const GEO = [
  { country: 'CI', city: 'Abidjan',       ip: '41.202' },
  { country: 'CI', city: 'Bouaké',        ip: '41.203' },
  { country: 'SN', city: 'Dakar',         ip: '41.74'  },
  { country: 'CM', city: 'Douala',        ip: '154.0'  },
  { country: 'CM', city: 'Yaoundé',       ip: '154.1'  },
  { country: 'NG', city: 'Lagos',         ip: '197.155'},
  { country: 'NG', city: 'Abuja',         ip: '197.156'},
  { country: 'GH', city: 'Accra',         ip: '154.120'},
  { country: 'ML', city: 'Bamako',        ip: '41.77'  },
  { country: 'BJ', city: 'Cotonou',       ip: '197.234'},
  { country: 'TG', city: 'Lomé',          ip: '196.168'},
  { country: 'FR', city: 'Paris',         ip: '195.78' },
  { country: 'FR', city: 'Lyon',          ip: '193.48' },
  { country: 'BE', city: 'Bruxelles',     ip: '195.238'},
  { country: 'CA', city: 'Montréal',      ip: '24.201' },
];

const BROWSERS = ['Chrome', 'Firefox', 'Safari', 'Opera', 'Edge', 'Chrome'];
const OS_MOBILE  = ['Android 13', 'Android 12', 'Android 11', 'iOS 17', 'iOS 16'];
const OS_DESKTOP = ['Windows 11', 'Windows 10', 'macOS 14', 'macOS 13', 'Ubuntu 22'];
const REFERERS   = ['Direct', 'https://wa.me', 'https://facebook.com', 'https://instagram.com', 'Direct', 'Direct'];

// ---- Liens de démo ----
const LINKS = [
  { id: 'A1B2C3', destination: 'https://monsite.com/offre-speciale',  campaign: 'WhatsApp-juin',    daysAgo: 30, clicks: 142 },
  { id: 'D4E5F6', destination: 'https://monsite.com/formation',        campaign: 'Facebook-Ads',     daysAgo: 22, clicks: 87  },
  { id: 'G7H8I9', destination: 'https://monsite.com/produit-phare',    campaign: 'Email-juin',       daysAgo: 18, clicks: 54  },
  { id: 'J1K2L3', destination: 'https://monsite.com/bio',              campaign: 'Instagram-bio',    daysAgo: 12, clicks: 38  },
  { id: 'M4N5O6', destination: 'https://monsite.com/promo-ramadan',    campaign: 'TikTok-promo',     daysAgo:  5, clicks: 19  },
];

// ---- Seed ----
function seed() {
  const existingLinks = db.prepare('SELECT COUNT(*) as n FROM links').get();
  if (existingLinks.n > 0) {
    console.log('Base déjà peuplée — seed ignoré. Supprime tracker.db pour re-seeder.');
    return;
  }

  const insertLink  = db.prepare('INSERT INTO links VALUES (?, ?, ?, ?)');
  const insertClick = db.prepare(`
    INSERT INTO clicks (link_id, ip, country, city, browser, os, device, referer, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const seedAll = db.transaction(() => {
    for (const link of LINKS) {
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - link.daysAgo);
      insertLink.run(link.id, link.destination, link.campaign, createdAt.toISOString().replace('T',' ').slice(0,19));

      for (let i = 0; i < link.clicks; i++) {
        const geo     = pick(GEO);
        const isMobile = Math.random() > 0.38;
        const device  = isMobile ? pick(['mobile', 'mobile', 'tablet']) : 'desktop';
        const os      = isMobile ? pick(OS_MOBILE) : pick(OS_DESKTOP);
        const ip      = `${geo.ip}.${randInt(1,254)}.${randInt(1,254)}`;

        insertClick.run(
          link.id,
          ip,
          geo.country,
          geo.city,
          pick(BROWSERS),
          os,
          device,
          pick(REFERERS),
          randomDate(link.daysAgo)
        );
      }
    }
  });

  seedAll();

  const total = db.prepare('SELECT COUNT(*) as n FROM clicks').get();
  console.log(`Seed terminé : ${LINKS.length} liens, ${total.n} clics insérés.`);
}

seed();
