-- =============================================
-- Script: Enable Full-Text Search on Mentors and Skills
-- Purpose: Allow keyword search on Bio, Certifications, and Skill Names
-- Author: US2 Implementation
-- Date: 2025-11-14
-- =============================================

USE [CareerRouteDB];  -- IMPORTANT: Replace with your actual database name
GO

PRINT '=== Starting Full-Text Search Setup ==='
PRINT ''

-- =============================================
-- Step 1: Check if Full-Text Search is installed
-- =============================================
PRINT '1. Checking if Full-Text Search is installed...'
IF SERVERPROPERTY('IsFullTextInstalled') = 0
BEGIN
    PRINT 'ERROR: Full-Text Search is not installed on this SQL Server instance.'
    PRINT 'Please install the "Full-Text and Semantic Extractions for Search" feature.'
    PRINT 'Installation Guide: https://learn.microsoft.com/en-us/sql/relational-databases/search/get-started-with-full-text-search'
    RETURN;
END
PRINT '   ✓ Full-Text Search is installed'
PRINT ''
GO

-- =============================================
-- Step 2: Create Full-Text Catalog
-- =============================================
PRINT '2. Creating Full-Text Catalog...'
IF NOT EXISTS (SELECT * FROM sys.fulltext_catalogs WHERE name = 'CareerRouteCatalog')
BEGIN
    CREATE FULLTEXT CATALOG CareerRouteCatalog AS DEFAULT;
    PRINT '   ✓ Full-Text Catalog "CareerRouteCatalog" created'
END
ELSE
BEGIN
    PRINT '   ⚠ Full-Text Catalog "CareerRouteCatalog" already exists (skipping)'
END
PRINT ''
GO

-- =============================================
-- Step 3: Full-Text Index on Mentors Table
-- =============================================
PRINT '3. Creating Full-Text Index on Mentors table...'

-- Drop existing index if it exists (for re-creation)
IF EXISTS (SELECT * FROM sys.fulltext_indexes WHERE object_id = OBJECT_ID('Mentors'))
BEGIN
    DROP FULLTEXT INDEX ON Mentors;
    PRINT '   ⚠ Existing Full-Text Index on Mentors dropped for recreation'
END

-- Get the primary key constraint name dynamically
DECLARE @MentorPK NVARCHAR(128)
SELECT @MentorPK = name 
FROM sys.key_constraints 
WHERE parent_object_id = OBJECT_ID('Mentors') AND type = 'PK'

IF @MentorPK IS NULL
BEGIN
    PRINT 'ERROR: Could not find primary key constraint on Mentors table'
    RETURN;
END

-- Create Full-Text Index on Mentors
DECLARE @MentorSQL NVARCHAR(MAX) = '
CREATE FULLTEXT INDEX ON Mentors
(
    Bio LANGUAGE 1033,              -- English (United States)
    Certifications LANGUAGE 1033
)
KEY INDEX ' + @MentorPK + '
ON CareerRouteCatalog
WITH (
    CHANGE_TRACKING = AUTO,         -- Automatically update index on data changes
    STOPLIST = SYSTEM               -- Use system stopword list (filters "the", "and", etc.)
);'

EXEC sp_executesql @MentorSQL
PRINT '   ✓ Full-Text Index on Mentors created (Bio, Certifications)'
PRINT ''
GO

-- =============================================
-- Step 4: Full-Text Index on Skills Table
-- =============================================
PRINT '4. Creating Full-Text Index on Skills table...'

-- Drop existing index if it exists (for re-creation)
IF EXISTS (SELECT * FROM sys.fulltext_indexes WHERE object_id = OBJECT_ID('Skills'))
BEGIN
    DROP FULLTEXT INDEX ON Skills;
    PRINT '   ⚠ Existing Full-Text Index on Skills dropped for recreation'
END

-- Get the primary key constraint name dynamically
DECLARE @SkillPK NVARCHAR(128)
SELECT @SkillPK = name 
FROM sys.key_constraints 
WHERE parent_object_id = OBJECT_ID('Skills') AND type = 'PK'

IF @SkillPK IS NULL
BEGIN
    PRINT 'ERROR: Could not find primary key constraint on Skills table'
    RETURN;
END

-- Create Full-Text Index on Skills
DECLARE @SkillSQL NVARCHAR(MAX) = '
CREATE FULLTEXT INDEX ON Skills
(
    Name LANGUAGE 1033              -- English (United States)
)
KEY INDEX ' + @SkillPK + '
ON CareerRouteCatalog
WITH (
    CHANGE_TRACKING = AUTO,
    STOPLIST = SYSTEM
);'

EXEC sp_executesql @SkillSQL
PRINT '   ✓ Full-Text Index on Skills created (Name)'
PRINT ''
GO

-- =============================================
-- Step 5: Verify Full-Text Indexes
-- =============================================
PRINT '5. Verifying Full-Text Indexes...'
SELECT 
    OBJECT_NAME(object_id) AS TableName,
    CASE is_enabled 
        WHEN 1 THEN '✓ Enabled' 
        ELSE '✗ Disabled' 
    END AS Status,
    change_tracking_state_desc AS ChangeTracking,
    crawl_type_desc AS CrawlType,
    crawl_end_date AS LastCrawl
FROM sys.fulltext_indexes
WHERE object_id IN (OBJECT_ID('Mentors'), OBJECT_ID('Skills'))
ORDER BY OBJECT_NAME(object_id);
GO

PRINT ''
PRINT '6. Checking Index Population Status...'
SELECT 
    DB_NAME(database_id) AS DatabaseName,
    OBJECT_NAME(table_id) AS TableName,
    CASE status
        WHEN 0 THEN '✓ Idle (Ready)'
        WHEN 1 THEN '⚠ Full Population In Progress'
        WHEN 2 THEN '⚠ Paused'
        WHEN 3 THEN '⚠ Throttled'
        WHEN 4 THEN '⚠ Recovering'
        WHEN 5 THEN '✗ Shutdown'
        WHEN 6 THEN '⚠ Incremental Population In Progress'
        WHEN 7 THEN '⚠ Building Index'
        WHEN 8 THEN '✗ Disk Full. Paused'
        WHEN 9 THEN '✓ Change Tracking'
    END AS PopulationStatus,
    start_time AS StartTime
FROM sys.dm_fts_index_population
WHERE database_id = DB_ID();
GO

-- If no results above, indexes are ready
PRINT ''
PRINT '   Note: If no results shown above, indexes are already populated and ready to use.'
PRINT ''

-- =============================================
-- Step 7: Test Full-Text Search
-- =============================================
PRINT '=== Testing Full-Text Search ==='
PRINT ''

PRINT 'Test 1: Search for "developer" in Mentors Bio...'
SELECT 
    u.FirstName + ' ' + u.LastName AS MentorName,
    LEFT(m.Bio, 100) + '...' AS BioPreview
FROM Mentors m
INNER JOIN Users u ON m.Id = u.Id
WHERE CONTAINS(m.Bio, 'developer')
ORDER BY m.AverageRating DESC;
GO

PRINT ''
PRINT 'Test 2: Search for "React OR Angular OR Vue" in Mentors...'
SELECT 
    u.FirstName + ' ' + u.LastName AS MentorName,
    LEFT(m.Bio, 80) + '...' AS BioPreview
FROM Mentors m
INNER JOIN Users u ON m.Id = u.Id
WHERE CONTAINS((m.Bio, m.Certifications), 'React OR Angular OR Vue');
GO

PRINT ''
PRINT 'Test 3: Search for skill names containing "JavaScript"...'
SELECT 
    s.Id,
    s.Name AS SkillName,
    c.Name AS CategoryName
FROM Skills s
INNER JOIN Categories c ON s.CategoryId = c.Id
WHERE CONTAINS(s.Name, 'JavaScript');
GO

PRINT ''
PRINT 'Test 4: Phrase search - "Full-Stack Developer"...'
SELECT 
    u.FirstName + ' ' + u.LastName AS MentorName,
    LEFT(m.Bio, 80) + '...' AS BioPreview
FROM Mentors m
INNER JOIN Users u ON m.Id = u.Id
WHERE CONTAINS(m.Bio, '"Full-Stack Developer"');
GO

PRINT ''
PRINT 'Test 5: Search with ranking (CONTAINSTABLE)...'
SELECT TOP 5
    u.FirstName + ' ' + u.LastName AS MentorName,
    ft.RANK AS RelevanceScore,
    LEFT(m.Bio, 80) + '...' AS BioPreview
FROM Mentors m
INNER JOIN Users u ON m.Id = u.Id
INNER JOIN CONTAINSTABLE(Mentors, (Bio, Certifications), 'software OR engineering OR developer') ft
    ON m.Id = ft.[KEY]
ORDER BY ft.RANK DESC;
GO

PRINT ''
PRINT '=== Full-Text Search Setup Complete! ==='
PRINT ''
PRINT 'Summary:'
PRINT '  ✓ Full-Text Catalog created: CareerRouteCatalog'
PRINT '  ✓ Index on Mentors (Bio, Certifications)'
PRINT '  ✓ Index on Skills (Name)'
PRINT '  ✓ Automatic change tracking enabled'
PRINT ''
PRINT 'Usage Examples:'
PRINT '  -- Simple search:'
PRINT '  SELECT * FROM Mentors WHERE CONTAINS(Bio, ''react'')'
PRINT ''
PRINT '  -- OR search:'
PRINT '  SELECT * FROM Mentors WHERE CONTAINS(Bio, ''react OR angular'')'
PRINT ''
PRINT '  -- Phrase search:'
PRINT '  SELECT * FROM Mentors WHERE CONTAINS(Bio, ''"full stack developer"'')'
PRINT ''
PRINT '  -- Multiple columns:'
PRINT '  SELECT * FROM Mentors WHERE CONTAINS((Bio, Certifications), ''AWS'')'
PRINT ''
PRINT '  -- With ranking:'
PRINT '  SELECT m.*, ft.RANK FROM Mentors m'
PRINT '  INNER JOIN CONTAINSTABLE(Mentors, Bio, ''keyword'') ft ON m.Id = ft.[KEY]'
PRINT '  ORDER BY ft.RANK DESC'
PRINT ''
PRINT 'Important Notes:'
PRINT '  - Stopwords ("the", "and", "is", etc.) are automatically filtered'
PRINT '  - Indexes auto-update when data changes'
PRINT '  - Use FREETEXT for more lenient matching'
PRINT '  - Use CONTAINS for precise control'
PRINT ''
PRINT 'If tests show no results, you may need to add sample mentor data first.'
GO
