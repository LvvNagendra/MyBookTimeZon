-- Manual / pay-at-salon settlement (no Razorpay required)
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_method VARCHAR(32);
