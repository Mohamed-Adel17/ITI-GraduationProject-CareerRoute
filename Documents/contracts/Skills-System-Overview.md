# Skills System - Overview for Frontend & Backend Teams

**Date:** 2025-01-10  
**Purpose:** High-level overview of the unified Skills system for career interests and expertise tags  
**Audience:** Frontend and Backend developers

---

## 🎯 Key Decisions Summary

### **1. Unified Skills System**
- ✅ **One `Skills` table** for both user career interests AND mentor expertise
- ✅ **Single `UserSkills` junction table** for all users (mentees and mentors)
- ✅ **Context-driven naming**: API field names change based on context
  - Query User profile → returns `careerInterests`
  - Query Mentor profile → returns `expertiseTags`

### **2. Flat Structure**
- ✅ **Two-level hierarchy only**: Categories → Skills
- ✅ **No parent-child relationships** within skills
- ✅ Skills are just Name + Category (no descriptions, no levels, no types)

### **3. Platform Focus**
- ✅ **Career guidance** + **Technical consultation** 
- ✅ Both broad ("Career Shifting") and specific ("React") skills coexist
- ✅ Users can seek help in multiple areas simultaneously

### **4. Semantic API**
- ✅ **No breaking changes** - field names stay the same
- ✅ `careerInterests` changes from `string[]` to `SkillDto[]`
- ✅ `expertiseTags` changes from `string[]` to `SkillDto[]`

---

## 📊 Data Model Visualization

```
┌─────────────────────────────────────────────────────────────────┐
│                         CATEGORIES                               │
│  (Already exists in system)                                      │
└─────────────────────────────────────────────────────────────────┘
         │
         │  One category has many skills
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                           SKILLS                                 │
│  Master list of all consultation areas                           │
│  • Career Development skills                                     │
│  • Leadership & Management skills                                │
│  • IT Career & Technical Consultation skills                     │
│  • Entrepreneurship skills                                       │
│  • Finance, Marketing, etc.                                      │
└─────────────────────────────────────────────────────────────────┘
         │
         │  Many-to-Many relationship
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                        USERSKILLS                                │
│  Links users to skills they selected                             │
│  • For regular users → represents "career interests"             │
│  • For mentors → represents "expertise tags"                     │
│  Same table, different semantic meaning based on context         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Category & Skills Structure Example

```
📁 Career Development (CategoryId: 1)
   ├─ Career Shifting
   ├─ Career Planning
   ├─ Interview Preparation
   ├─ Resume & LinkedIn Optimization
   ├─ Salary Negotiation
   └─ Personal Branding

📁 Leadership & Management (CategoryId: 2)
   ├─ Leadership Development
   ├─ Executive Coaching
   ├─ Team Management
   ├─ Conflict Resolution
   ├─ Strategic Planning
   └─ Agile Methodologies

📁 IT Careers & Technical Consultation (CategoryId: 3)
   ├─ Software Engineering Career Path (career guidance)
   ├─ Tech Career Transition (career guidance)
   ├─ Tech Leadership (career guidance)
   ├─ React (technical consultation)
   ├─ Node.js (technical consultation)
   ├─ System Design (technical consultation)
   ├─ Cloud Architecture (technical consultation)
   ├─ AWS (technical consultation)
   └─ Python (technical consultation)

📁 Entrepreneurship (CategoryId: 4)
   ├─ Starting a Business
   ├─ Business Strategy
   ├─ Fundraising & Investment
   └─ Product Development

📁 Finance & Accounting (CategoryId: 5)
   ├─ Financial Planning
   ├─ Investment Strategies
   └─ Financial Analysis

📁 Marketing & Sales (CategoryId: 6)
   ├─ Marketing Career Path
   ├─ Digital Marketing
   └─ SEO & SEM
```

**Note:** All skills at same level - no nesting within categories!

---

## 👤 User Flow Examples

### **Example 1: Regular User (Mentee) Seeking Help**

**User: Sarah (Software Developer)**

**1. During Profile Setup:**
```
Sarah selects skills she wants help with:
✓ Career Shifting (career guidance)
✓ React (technical consultation)
✓ System Design (technical consultation)
```

**2. Stored in Database:**
```sql
UserSkills:
(SarahId, SkillId: 5)  -- Career Shifting
(SarahId, SkillId: 45) -- React
(SarahId, SkillId: 62) -- System Design
```

**3. Frontend Gets API Response:**
```json
GET /api/users/sarah

{
  "id": "sarah123",
  "firstName": "Sarah",
  "careerInterests": [
    {
      "id": 5,
      "name": "Career Shifting",
      "categoryId": 1,
      "categoryName": "Career Development"
    },
    {
      "id": 45,
      "name": "React",
      "categoryId": 3,
      "categoryName": "IT Careers & Technical Consultation"
    },
    {
      "id": 62,
      "name": "System Design",
      "categoryId": 3,
      "categoryName": "IT Careers & Technical Consultation"
    }
  ]
}
```

---

### **Example 2: Mentor Offering Help**

**Mentor: John (Senior Tech Lead)**

**1. During Profile Setup:**
```
John selects areas he can provide consultation in:
✓ Tech Leadership (career guidance)
✓ React (technical consultation)
✓ System Design (technical consultation)
✓ Microservices Architecture (technical consultation)
```

**2. Stored in Database:**
```sql
Mentors:
Id: 101, UserId: JohnId, FirstName: "John", ...

UserSkills:
(JohnId, SkillId: 15) -- Tech Leadership
(JohnId, SkillId: 45) -- React
(JohnId, SkillId: 62) -- System Design
(JohnId, SkillId: 65) -- Microservices Architecture
```

**3. Frontend Gets API Response:**
```json
GET /api/mentors/101

{
  "id": 101,
  "userId": "john456",
  "firstName": "John",
  "expertiseTags": [
    {
      "id": 15,
      "name": "Tech Leadership",
      "categoryId": 3,
      "categoryName": "IT Careers & Technical Consultation"
    },
    {
      "id": 45,
      "name": "React",
      "categoryId": 3,
      "categoryName": "IT Careers & Technical Consultation"
    },
    {
      "id": 62,
      "name": "System Design",
      "categoryId": 3,
      "categoryName": "IT Careers & Technical Consultation"
    },
    {
      "id": 65,
      "name": "Microservices Architecture",
      "categoryId": 3,
      "categoryName": "IT Careers & Technical Consultation"
    }
  ]
}
```

---

## 🔍 Matching Flow Example

### **How Sarah Finds Mentors**

**Sarah's Career Interests:**
- Career Shifting (SkillId: 5)
- React (SkillId: 45)
- System Design (SkillId: 62)

**Backend Matching Query:**
```sql
-- Find mentors who have ANY of Sarah's skills
SELECT 
    m.Id,
    m.FirstName,
    COUNT(DISTINCT us.SkillId) AS MatchCount,
    STRING_AGG(s.Name, ', ') AS MatchingSkills
FROM Mentors m
JOIN UserSkills us ON m.UserId = us.UserId
JOIN Skills s ON us.SkillId = s.Id
WHERE us.SkillId IN (5, 45, 62)  -- Sarah's skill IDs
  AND m.ApprovalStatus = 'Approved'
  AND m.IsAvailable = 1
GROUP BY m.Id, m.FirstName
ORDER BY MatchCount DESC, m.AverageRating DESC;
```

**Results:**

| Mentor | Matching Skills | Match Count | Rating |
|--------|----------------|-------------|--------|
| **John** | React, System Design | 2 | 4.9 ⭐ |
| **Alice** | Career Shifting, React | 2 | 4.8 ⭐ |
| **Bob** | System Design | 1 | 4.7 ⭐ |

**Frontend Displays:**
```
Top Matches for Your Interests:

🥇 John
   ✓ React
   ✓ System Design
   Rating: 4.9 ⭐ | $120/hr
   [View Profile] [Book Session]

🥈 Alice
   ✓ Career Shifting
   ✓ React
   Rating: 4.8 ⭐ | $80/hr
   [View Profile] [Book Session]
```

---

## 🎨 Frontend Implementation Guide

### **1. Skill Selection Component**

```typescript
// Get all skills grouped by category
GET /api/skills

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Career Development",
      "skills": [
        { "id": 5, "name": "Career Shifting" },
        { "id": 6, "name": "Career Planning" },
        ...
      ]
    },
    {
      "id": 3,
      "name": "IT Careers & Technical Consultation",
      "skills": [
        { "id": 15, "name": "Tech Leadership" },
        { "id": 45, "name": "React" },
        { "id": 62, "name": "System Design" },
        ...
      ]
    }
  ]
}
```

**UI Component:**
```jsx
<SkillSelector>
  {categories.map(category => (
    <CategorySection key={category.id} title={category.name}>
      {category.skills.map(skill => (
        <Checkbox
          key={skill.id}
          label={skill.name}
          checked={selectedSkills.includes(skill.id)}
          onChange={() => toggleSkill(skill.id)}
        />
      ))}
    </CategorySection>
  ))}
</SkillSelector>
```

---

### **2. Update User Skills**

```typescript
// User selects skills
PATCH /api/users/me/career-interests

Request:
{
  "skillIds": [5, 45, 62]
}

Response:
{
  "success": true,
  "message": "Career interests updated successfully",
  "data": {
    "careerInterests": [
      { "id": 5, "name": "Career Shifting", ... },
      { "id": 45, "name": "React", ... },
      { "id": 62, "name": "System Design", ... }
    ]
  }
}
```

---

### **3. Update Mentor Skills**

```typescript
// Mentor selects expertise areas
PATCH /api/mentors/{mentorId}/expertise-tags

Request:
{
  "skillIds": [15, 45, 62, 65]
}

Response:
{
  "success": true,
  "message": "Expertise tags updated successfully",
  "data": {
    "expertiseTags": [
      { "id": 15, "name": "Tech Leadership", ... },
      { "id": 45, "name": "React", ... },
      { "id": 62, "name": "System Design", ... },
      { "id": 65, "name": "Microservices Architecture", ... }
    ]
  }
}
```

---

### **4. Display Skills on Profile**

```jsx
// User Profile
<UserProfile>
  <Section title="Career Interests">
    {user.careerInterests.map(skill => (
      <Tag key={skill.id} color="blue">
        {skill.name}
      </Tag>
    ))}
  </Section>
</UserProfile>

// Mentor Profile
<MentorProfile>
  <Section title="Expertise">
    {mentor.expertiseTags.map(skill => (
      <Tag key={skill.id} color="green">
        {skill.name}
      </Tag>
    ))}
  </Section>
</MentorProfile>
```

---

## 🔧 Backend Implementation Guide

### **1. Database Tables**

```sql
-- Skills master table
CREATE TABLE Skills (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(100) NOT NULL,
    CategoryId INT NOT NULL,
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    
    CONSTRAINT FK_Skills_Category FOREIGN KEY (CategoryId) 
        REFERENCES Categories(Id),
    CONSTRAINT UQ_Skills_Name_Category UNIQUE (Name, CategoryId)
);

-- Junction table for all users
CREATE TABLE UserSkills (
    UserId NVARCHAR(450) NOT NULL,
    SkillId INT NOT NULL,
    CreatedAt DATETIME2 DEFAULT GETUTCDATE(),
    
    PRIMARY KEY (UserId, SkillId),
    CONSTRAINT FK_UserSkills_User FOREIGN KEY (UserId) 
        REFERENCES AspNetUsers(Id) ON DELETE CASCADE,
    CONSTRAINT FK_UserSkills_Skill FOREIGN KEY (SkillId) 
        REFERENCES Skills(Id)
);

CREATE INDEX IX_UserSkills_SkillId ON UserSkills(SkillId);
CREATE INDEX IX_UserSkills_UserId ON UserSkills(UserId);
```

---

### **2. Entity Models**

```csharp
public class Skill
{
    public int Id { get; set; }
    public string Name { get; set; }
    public int CategoryId { get; set; }
    public bool IsActive { get; set; }
    
    // Navigation properties
    public Category Category { get; set; }
    public ICollection<UserSkill> UserSkills { get; set; }
}

public class UserSkill
{
    public string UserId { get; set; }
    public int SkillId { get; set; }
    public DateTime CreatedAt { get; set; }
    
    // Navigation properties
    public ApplicationUser User { get; set; }
    public Skill Skill { get; set; }
}

// Add to ApplicationUser
public class ApplicationUser : IdentityUser
{
    // Existing properties...
    
    public ICollection<UserSkill> UserSkills { get; set; }
}

// Add to Mentor
public class Mentor
{
    public int Id { get; set; }
    public string UserId { get; set; }
    
    // Navigation property
    public ApplicationUser User { get; set; }
    
    // Mentor's skills accessed via: User.UserSkills
}
```

---

### **3. DTOs**

```csharp
public class SkillDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; }
}

public class UserDto
{
    public string Id { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    
    [JsonPropertyName("careerInterests")]
    public List<SkillDto> CareerInterests { get; set; }
}

public class MentorDto
{
    public int Id { get; set; }
    public string UserId { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    
    [JsonPropertyName("expertiseTags")]
    public List<SkillDto> ExpertiseTags { get; set; }
}
```

---

### **4. AutoMapper Configuration**

```csharp
// Map User -> UserDto
CreateMap<ApplicationUser, UserDto>()
    .ForMember(dest => dest.CareerInterests, opt => opt.MapFrom(src =>
        src.UserSkills
            .Where(us => us.Skill.IsActive)
            .Select(us => us.Skill)
            .ToList()));

// Map Mentor -> MentorDto
CreateMap<Mentor, MentorDto>()
    .ForMember(dest => dest.FirstName, opt => opt.MapFrom(src => src.User.FirstName))
    .ForMember(dest => dest.LastName, opt => opt.MapFrom(src => src.User.LastName))
    .ForMember(dest => dest.ExpertiseTags, opt => opt.MapFrom(src =>
        src.User.UserSkills
            .Where(us => us.Skill.IsActive)
            .Select(us => us.Skill)
            .ToList()));

// Map Skill -> SkillDto
CreateMap<Skill, SkillDto>()
    .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category.Name));
```

---

### **5. Service Layer**

```csharp
public async Task UpdateUserSkillsAsync(string userId, List<int> skillIds)
{
    // Remove all existing skills for user
    var existingSkills = await _context.UserSkills
        .Where(us => us.UserId == userId)
        .ToListAsync();
    
    _context.UserSkills.RemoveRange(existingSkills);
    
    // Add new skills
    var newSkills = skillIds.Select(skillId => new UserSkill
    {
        UserId = userId,
        SkillId = skillId,
        CreatedAt = DateTime.UtcNow
    });
    
    await _context.UserSkills.AddRangeAsync(newSkills);
    await _context.SaveChangesAsync();
}

public async Task<List<MentorDto>> FindMatchingMentorsAsync(string userId)
{
    var userSkillIds = await _context.UserSkills
        .Where(us => us.UserId == userId)
        .Select(us => us.SkillId)
        .ToListAsync();
    
    var mentors = await _context.Mentors
        .Include(m => m.User)
            .ThenInclude(u => u.UserSkills)
                .ThenInclude(us => us.Skill)
                    .ThenInclude(s => s.Category)
        .Where(m => m.ApprovalStatus == ApprovalStatus.Approved 
                 && m.IsAvailable
                 && m.User.UserSkills.Any(us => userSkillIds.Contains(us.SkillId)))
        .Select(m => new 
        {
            Mentor = m,
            MatchCount = m.User.UserSkills.Count(us => userSkillIds.Contains(us.SkillId))
        })
        .OrderByDescending(x => x.MatchCount)
        .ThenByDescending(x => x.Mentor.AverageRating)
        .Select(x => x.Mentor)
        .ToListAsync();
    
    return _mapper.Map<List<MentorDto>>(mentors);
}
```

---

## 🔄 Migration from Old System

### **Current System:**
```json
{
  "careerInterests": ["Career Shifting", "React", "System Design"]
}
```

### **New System:**
```json
{
  "careerInterests": [
    { "id": 5, "name": "Career Shifting", "categoryId": 1, "categoryName": "Career Development" },
    { "id": 45, "name": "React", "categoryId": 3, "categoryName": "IT Careers & Technical" },
    { "id": 62, "name": "System Design", "categoryId": 3, "categoryName": "IT Careers & Technical" }
  ]
}
```

### **Migration Script:**
```sql
-- Parse JSON array and match to Skills table
INSERT INTO UserSkills (UserId, SkillId)
SELECT 
    u.Id,
    s.Id
FROM AspNetUsers u
CROSS APPLY OPENJSON(u.CareerInterests) AS ci
JOIN Skills s ON TRIM(ci.value) = s.Name
WHERE u.CareerInterests IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM UserSkills WHERE UserId = u.Id AND SkillId = s.Id);
```

---

## ✅ Key Takeaways

### **For Frontend Team:**
1. ✅ Use `/api/skills` to get all available skills grouped by category
2. ✅ Display skills grouped by category in UI
3. ✅ Send `skillIds` array when updating user/mentor skills
4. ✅ Display `careerInterests` for users, `expertiseTags` for mentors (same structure)
5. ✅ Skills are now objects with `id`, `name`, `categoryId`, `categoryName`

### **For Backend Team:**
1. ✅ One `Skills` table + one `UserSkills` junction table
2. ✅ No separate MentorSkills table - use UserSkills with Mentor.UserId
3. ✅ Context determines field name in DTO (CareerInterests vs ExpertiseTags)
4. ✅ Matching is simple: find skill ID overlap between user and mentors
5. ✅ AutoMapper handles the mapping based on query context

### **Both Teams:**
1. ✅ Skills are flat - no hierarchy within categories
2. ✅ Mix of career guidance and technical consultation skills
3. ✅ Field names stay the same (`careerInterests`, `expertiseTags`) - just structured now

---

**Related Documents:**
- Skills-Career-Interests-Proposal.md (detailed technical specification)
- User-Profile-Endpoints.md (API contracts for user endpoints)
- Mentor-Endpoints.md (API contracts for mentor endpoints)
