ALTER TABLE "ApiKey"
  ADD COLUMN "neverExpires" BOOLEAN NOT NULL DEFAULT false,
  ALTER COLUMN "expiresAt" DROP NOT NULL;

-- Expiry was calculated immediately before insertion, while createdAt used
-- the database clock. Allow one minute of clock/transaction skew for 365-day keys.
-- Keep the old timestamp so the previous release can run during deployment;
-- neverExpires takes precedence over it in the new release.
UPDATE "ApiKey"
SET "neverExpires" = true
WHERE "expiresAt" BETWEEN "createdAt" + INTERVAL '365 days' - INTERVAL '1 minute'
                      AND "createdAt" + INTERVAL '365 days' + INTERVAL '1 minute';
