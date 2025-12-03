-- =============================================
-- Script: Initialize MentorBalance Records
-- Description: Creates MentorBalance records for all existing mentors
--              with zero balances. This is a one-time data migration
--              to ensure all mentors have a balance record.
-- Date: 2025-12-03
-- =============================================

-- Insert MentorBalance records for all mentors that don't have one yet
INSERT INTO MentorBalances (MentorId, AvailableBalance, PendingBalance, TotalEarnings, CreatedAt, UpdatedAt)
SELECT 
    m.Id AS MentorId,
    0.00 AS AvailableBalance,
    0.00 AS PendingBalance,
    0.00 AS TotalEarnings,
    GETUTCDATE() AS CreatedAt,
    GETUTCDATE() AS UpdatedAt
FROM Mentors m
WHERE NOT EXISTS (
    SELECT 1 
    FROM MentorBalances mb 
    WHERE mb.MentorId = m.Id
);

-- Display the number of records created
SELECT @@ROWCOUNT AS 'MentorBalance Records Created';

-- Verify all mentors now have a balance record
SELECT 
    COUNT(DISTINCT m.Id) AS TotalMentors,
    COUNT(DISTINCT mb.MentorId) AS MentorsWithBalance,
    CASE 
        WHEN COUNT(DISTINCT m.Id) = COUNT(DISTINCT mb.MentorId) 
        THEN 'All mentors have balance records' 
        ELSE 'Some mentors missing balance records' 
    END AS Status
FROM Mentors m
LEFT JOIN MentorBalances mb ON m.Id = mb.MentorId;
