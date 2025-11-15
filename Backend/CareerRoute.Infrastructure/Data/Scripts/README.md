# Database SQL Scripts

This folder contains SQL scripts that must be executed manually in SQL Server Management Studio (SSMS) or Azure Data Studio.

## Why Manual Scripts?

Some database features cannot be created via Entity Framework Core migrations and require direct SQL execution:
- Full-Text Search catalogs and indexes
- Complex stored procedures
- Advanced database features

## How to Execute

1. Open SQL Server Management Studio (SSMS) or Azure Data Studio
2. Connect to your database server
3. Open the script file (`.sql`)
4. **Update the database name** in the `USE [DatabaseName]` statement (line 8)
5. Execute the script (F5 or Execute button)
6. Review the output messages for success/errors

## Scripts in This Folder

### 04_EnableFullTextSearch.sql

**Purpose:** Enables Full-Text Search on Mentors and Skills tables for high-performance keyword searching.

**What it does:**
- Creates Full-Text Catalog `CareerRouteCatalog`
- Adds Full-Text Index on `Mentors.Bio` and `Mentors.Certifications`
- Adds Full-Text Index on `Skills.Name`
- Runs validation tests to confirm setup

**When to run:** After applying EF Core migrations, before running the application.

**Prerequisites:**
- SQL Server must have "Full-Text and Semantic Extractions for Search" feature installed
- Mentors and Skills tables must exist (run EF migrations first)

**Estimated time:** 1-2 minutes

---

## Execution Order

1. Apply EF Core migrations: `dotnet ef database update`
2. Execute SQL scripts in numerical order (04, 05, etc.)

## Testing Full-Text Search

After running `04_EnableFullTextSearch.sql`, you can test it with:

```sql
-- Simple search
SELECT * FROM Mentors WHERE CONTAINS(Bio, 'react');

-- OR search
SELECT * FROM Mentors WHERE CONTAINS(Bio, 'react OR angular');

-- Phrase search
SELECT * FROM Mentors WHERE CONTAINS(Bio, '"full stack developer"');

-- Search multiple columns
SELECT * FROM Mentors WHERE CONTAINS((Bio, Certifications), 'AWS');

-- Search with ranking
SELECT m.*, ft.RANK 
FROM Mentors m
INNER JOIN CONTAINSTABLE(Mentors, Bio, 'software developer') ft 
    ON m.Id = ft.[KEY]
ORDER BY ft.RANK DESC;
```

## Troubleshooting

**"Full-Text Search is not installed"**
- Install SQL Server feature: "Full-Text and Semantic Extractions for Search"
- Restart SQL Server service after installation

**"Could not find primary key"**
- Ensure EF Core migrations have been applied
- Check that tables exist in the database

**"Index population in progress"**
- Wait 1-2 minutes for index to populate
- Check status with: `SELECT * FROM sys.dm_fts_index_population WHERE database_id = DB_ID();`

**No results from test queries**
- Index may still be populating (wait and retry)
- Ensure you have sample data in Mentors/Skills tables
- Check for stopwords ("the", "and", "is" are filtered automatically)
