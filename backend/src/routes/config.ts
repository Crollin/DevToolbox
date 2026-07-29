import { Router, Request, Response } from 'express';
import { isDomainHubEnabled } from '../lib/features';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({
    domainHubEnabled: isDomainHubEnabled(),
  });
});

export default router;
