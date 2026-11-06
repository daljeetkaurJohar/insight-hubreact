/* ─────────────────────────────────────────────────────────────
   Insight Hub - create the database and its login (SQL Server)
   How to run: open SQL Server Management Studio (SSMS), connect to
   your server, click "New Query", paste this file, press F5.
   Change the password below, then put the SAME password in backend\.env
   ───────────────────────────────────────────────────────────── */

IF DB_ID(N'InsightHub') IS NULL
    CREATE DATABASE InsightHub;
GO

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = N'insighthub_app')
    CREATE LOGIN insighthub_app WITH PASSWORD = N'ChangeMe_Str0ng!', CHECK_POLICY = ON;
GO

USE InsightHub;
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'insighthub_app')
    CREATE USER insighthub_app FOR LOGIN insighthub_app;
GO

-- The app can create its tables (npm run setup-db) and read/write data.
ALTER ROLE db_owner ADD MEMBER insighthub_app;
GO

PRINT 'InsightHub database and insighthub_app login are ready.';
