const { sqliteTable, text, integer } = require('drizzle-orm/sqlite-core');
const { sql } = require('drizzle-orm');

const users = sqliteTable('users', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  username:  text('username').unique().notNull(),
  password:  text('password').notNull(),
  role:      text('role').notNull().default('user'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

const links = sqliteTable('links', {
  id:          text('id').primaryKey(),
  destination: text('destination').notNull(),
  campaign:    text('campaign').default(''),
  userId:      integer('user_id'),
  createdAt:   text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

const clicks = sqliteTable('clicks', {
  id:        integer('id').primaryKey({ autoIncrement: true }),
  linkId:    text('link_id'),
  ip:        text('ip'),
  country:   text('country'),
  city:      text('city'),
  browser:   text('browser'),
  os:        text('os'),
  device:    text('device'),
  referer:   text('referer'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

module.exports = { users, links, clicks };
