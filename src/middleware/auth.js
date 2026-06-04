exports.requireAuth = (req, res, next) => {
  if (req.session?.userId) return next();
  if (req.xhr || req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Non autorisé' });
  }
  res.redirect('/login');
};
