-- ─────────────────────────────────────────────────────────────
--  Insight Hub - create the database and its login (MySQL / MariaDB)
--  How to run: open MySQL Workbench, connect as root, open a new
--  SQL tab, paste this file, click the lightning-bolt (Execute).
--  Change the password below, then put the SAME password in backend\.env
-- ─────────────────────────────────────────────────────────────

CREATE DATABASE IF NOT EXISTS InsightHub
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'insighthub_app'@'localhost' IDENTIFIED BY 'ChangeMe_Str0ng!';

GRANT ALL PRIVILEGES ON InsightHub.* TO 'insighthub_app'@'localhost';
FLUSH PRIVILEGES;
