// Configuration des variables d'environnement avant tout import
process.env.DB_PATH = ':memory:';
process.env.JWT_SECRET = 'test-secret-for-vitest';
process.env.NODE_ENV = 'test';
