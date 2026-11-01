-- The orders page and every order page look up lines by order_id.
-- Without this index, each lookup reads the whole order_lines table.
CREATE INDEX idx_order_lines_order_id ON order_lines (order_id);
