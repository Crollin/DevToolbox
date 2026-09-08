import { Router, Request, Response } from 'express';
import { isDomainHubEnabled, isTransmuteEnabled } from '../lib/features';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({
    domainHubEnabled: isDomainHubEnabled(),
    transmuteEnabled: isTransmuteEnabled(),
  });
});

export default router;
