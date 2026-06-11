-- Activity log action labels for sign-in and admin configuration (apply on requestflow).

ALTER TYPE activity_action ADD VALUE IF NOT EXISTS 'USER_SIGNED_IN';
ALTER TYPE activity_action ADD VALUE IF NOT EXISTS 'ADMIN_USER_CHANGED';
ALTER TYPE activity_action ADD VALUE IF NOT EXISTS 'ADMIN_SETTINGS_CHANGED';
