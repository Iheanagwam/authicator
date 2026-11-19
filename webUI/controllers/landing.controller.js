export const showLanding  = (req, res) => res.render('public/index',   { title: 'AuthKit — Add auth to any website in 60 seconds' });
export const showPricing  = (req, res) => res.render('public/pricing', { title: 'Pricing — AuthKit' });
export const showDocs     = (req, res) => res.render('public/docs',    { title: 'Documentation — AuthKit' });
export const show404      = (req, res) => res.status(404).render('errors/404', { title: 'Page not found — AuthKit' });
export const show500      = (req, res) => res.status(500).render('errors/500', { title: 'Server error — AuthKit' });