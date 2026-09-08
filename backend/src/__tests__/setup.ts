// Configuration des variables d'environnement avant tout import
process.env.DB_PATH = ':memory:';
process.env.JWT_SECRET = 'test-secret-for-vitest';
process.env.NODE_ENV = 'test';
process.env.DOMAIN_HUB_ENABLED = 'true';
process.env.TRANSMUTE_BASE_URL = 'http://transmute.test';
process.env.TRANSMUTE_API_KEY = 'tm_test_key';
