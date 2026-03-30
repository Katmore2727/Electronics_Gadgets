# Database Schema

Place your full `schema.sql` in this folder. It is executed automatically on server startup when the check table (`users` by default) does not exist.

Your schema should include:
- Enums
- Tables (use `CREATE TABLE IF NOT EXISTS` for idempotency)
- Indexes
- Triggers
- pgvector extension and product_embeddings (if needed)

To disable auto-init: set `DB_AUTO_INIT=false` in `.env`
