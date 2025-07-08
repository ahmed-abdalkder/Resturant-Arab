
 

import helmet from "helmet";

const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https:", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "https:", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameSrc: ["'self'"],
      frameAncestors: ["'none'"],
    },
  },
  frameguard: { action: "deny" },
  noSniff: true,
});

export default securityHeaders;
