-- Add status history and estimated delivery date to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS status_history JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS estimated_delivery_date TIMESTAMPTZ;

-- Create index for status history queries (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_status_history') THEN
        CREATE INDEX idx_orders_status_history ON orders USING GIN (status_history);
    END IF;
END $$;

-- Create index for estimated delivery date (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_estimated_delivery') THEN
        CREATE INDEX idx_orders_estimated_delivery ON orders (estimated_delivery_date);
    END IF;
END $$;