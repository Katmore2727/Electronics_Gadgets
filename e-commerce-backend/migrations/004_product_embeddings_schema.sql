-- Product embeddings table (OpenAI text-embedding-3-small: 1536 dimensions)
CREATE TABLE IF NOT EXISTS product_embeddings (
    id              BIGSERIAL PRIMARY KEY,
    product_id      BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    embedding       double precision[] NOT NULL,
    model_version   VARCHAR(50) NOT NULL DEFAULT 'text-embedding-3-small',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_product_embedding UNIQUE (product_id, model_version)
);

CREATE INDEX IF NOT EXISTS idx_product_embeddings_product ON product_embeddings(product_id);
