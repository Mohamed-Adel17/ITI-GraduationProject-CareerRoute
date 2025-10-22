# Git Branching Strategy for Career Route Project


## Branch Structure

```
main (production-ready)
  ├── develop (integration branch)
  │   ├── feature/backend/<feature-name>
  │   ├── feature/frontend/<feature-name>
  │   ├── feature/auth-system
  │   ├── feature/session-booking
  │   ├── feature/payment-integration
  |   |
  │   └── bugfix/<bug-description>
  |
  └── release/<version>
```

---

## Main Branches (Permanent)

### `main`
- **Purpose**: Production-ready code only
- **Protection**: Require PR approval, passing tests
- **Deploy**: Auto-deploy to production (later)
- **Who commits**: No one directly - only via PRs from `develop`
- **Stability**: Always deployable

### `develop`
- **Purpose**: Integration branch for all features
- **Protection**: Require PR approval
- **Deploy**: Auto-deploy to staging/dev environment
- **Who commits**: No one directly - only via PRs from feature branches
- **Stability**: Should be stable, but may have minor issues

---

## Supporting Branches (Temporary)

### Feature Branches

**Naming Convention:**
```
feature/backend/<feature-name>
feature/frontend/<feature-name>
feature/<shared-feature-name>
```

**Examples:**
```
feature/backend/user-authentication
feature/backend/session-repository
feature/backend/mentor-crud
feature/backend/payment-stripe
feature/frontend/mentor-dashboard
feature/frontend/booking-calendar
feature/frontend/auth-pages
feature/payment-stripe-integration
```

**Lifecycle:**
1. Branch from `develop`
2. Work on feature
3. Push regularly
4. Create PR to `develop`
5. Code review
6. Merge and delete

**Workflow:**
```bash
# Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/backend/user-authentication

# Work on feature, commit regularly
git add .
git commit -m "feat: Add user registration endpoint"
git commit -m "test: Add registration validation tests"

# Push to remote
git push -u origin feature/backend/user-authentication

# Create Pull Request on GitHub to develop
# After approval and merge, delete branch
git branch -d feature/backend/user-authentication
```

---

### Bugfix Branches

**Naming:** `bugfix/<description>`

**Examples:**
```
bugfix/login-validation-error
bugfix/session-booking-timezone
bugfix/mentor-profile-image-upload
```

**Workflow:** Same as feature branches, merge to `develop`

```bash
git checkout develop
git checkout -b bugfix/login-validation-error
# Fix the bug
git commit -m "fix(auth): Resolve email validation regex"
git push origin bugfix/login-validation-error
# Create PR to develop
```

---

### Release Branches

**Naming:** `release/<version>`

**Examples:**
```
release/v1.0.0
release/v1.1.0
release/v2.0.0
```

**Purpose:** Prepare for production release

**Workflow:** See [Release Process](#release-process) section

---

## Commit Message Convention

We use **Conventional Commits** for clear, consistent commit history.

### Format:
```
<type>(<scope>): <description>

[optional body]

```

### Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Formatting, missing semicolons (no code change)
- `refactor`: Code restructure without changing behavior
- `test`: Add or update tests
- `chore`: Build process, dependencies, tooling
- `perf`: Performance improvement

### Examples:

```
feat(auth): Add JWT token generation
fix(booking): Resolve double-booking issue
docs(api): Update authentication endpoints documentation
refactor(core): Extract payment logic to service
test(sessions): Add unit tests for session validation
chore(deps): Update Entity Framework to 8.0.21
perf(api): Optimize mentor search query
style(frontend): Format code with Prettier
```

---

## Team Workflow

### Backend Feature Example

**User Story:** "As a user, I want to register an account"

**Task Breakdown:**
1. Create User entity (Core)
2. Create UserRepository (Infrastructure)
3. Create UserService (Core)
4. Create AuthController endpoints (API)
5. Add FluentValidation rules
6. Write unit tests

**Workflow:**

```bash
# 1. Create branch
git checkout develop
git pull origin develop
git checkout -b feature/backend/user-registration

# 2. Implement step by step with commits
git add Core/Entities/User.cs
git commit -m "feat(core): Add User entity with validation"

git add Infrastructure/Repositories/UserRepository.cs
git commit -m "feat(infrastructure): Implement UserRepository"

git add Core/Services/UserService.cs
git commit -m "feat(core): Add user registration service"

git add API/Controllers/AuthController.cs
git commit -m "feat(api): Add registration endpoint"

git add Core/Validators/CreateUserValidator.cs
git commit -m "feat(core): Add user registration validation"

git add Tests/Core.Tests/UserServiceTests.cs
git commit -m "test(auth): Add registration service unit tests"

# 3. Push to remote
git push -u origin feature/backend/user-registration

# 4. Create Pull Request on GitHub
# 5. Request code review
# 6. After approval, merge via GitHub
# 7. Delete branch on GitHub and locally
git checkout develop
git pull origin develop
git branch -d feature/backend/user-registration
```

---

### Frontend Feature Example

**User Story:** "As a user, I want to view available mentors"

**Task Breakdown:**
1. Create MentorListComponent
2. Create MentorService (API calls)
3. Add routing
4. Style components
5. Add error handling
6. Write component tests

**Workflow:**

```bash
# 1. Create branch
git checkout develop
git pull origin develop
git checkout -b feature/frontend/mentor-list

# 2. Implement with commits
git commit -m "feat(mentors): Add mentor list component"
git commit -m "feat(mentors): Implement mentor API service"
git commit -m "feat(mentors): Add mentor list routing"
git commit -m "style(mentors): Add card layout for mentors"
git commit -m "feat(mentors): Add error handling for API failures"
git commit -m "test(mentors): Add mentor list component tests"

# 3. Push and create PR
git push -u origin feature/frontend/mentor-list

# 4. Create PR, review, merge, delete branch
```

---


## Quick Reference

### Daily Workflow

```bash
# Start work
git checkout develop
git pull origin develop
git checkout -b feature/backend/my-feature

# During work (commit often)
git add .
git commit -m "feat(module): What I did"

# End of day (or when ready for review)
git push origin feature/backend/my-feature

# Ready for review
# 1. Go to GitHub
# 2. Create Pull Request
# 3. Request review from team member
# 4. Address feedback
# 5. After approval, merge
# 6. Delete branch

# Switch to new task
git checkout develop
git pull origin develop
git checkout -b feature/backend/next-feature
```

---

### Common Git Commands

```bash
# See current branch
git branch

# See all branches (including remote)
git branch -a

# Check status
git status

# See commit history
git log --oneline -10

# Update develop
git checkout develop
git pull origin develop

# Sync your branch with develop
git checkout feature/my-feature
git merge develop

# Undo last commit (not pushed yet)
git reset --soft HEAD~1

# Discard uncommitted changes
git checkout -- <file>
git restore <file>

# Stash changes temporarily
git stash
git stash list
git stash pop

# Create branch and switch to it
git checkout -b feature/new-feature

# Delete local branch
git branch -d feature/old-feature

# Delete remote branch
git push origin --delete feature/old-feature

# See differences
git diff
git diff develop

# Amend last commit (not pushed)
git commit --amend -m "New message"

# Push with tracking
git push -u origin feature/my-branch

# Force push (use carefully!)
git push --force origin feature/my-branch
```

---

### Troubleshooting

**Problem: "Your branch is behind origin/develop"**
```bash
git pull origin develop
```

**Problem: "Merge conflict"**
```bash
# Open conflicted files, resolve manually
git add <resolved-files>
git commit
```

**Problem: "I committed to wrong branch"**
```bash
# Save the commit hash
git log --oneline -1

# Go to correct branch
git checkout correct-branch
git cherry-pick <commit-hash>

# Go back to wrong branch and undo
git checkout wrong-branch
git reset --hard HEAD~1
```

**Problem: "I need to update my PR"**
```bash
# Make changes
git add .
git commit -m "fix: Address review feedback"
git push
# PR updates automatically
```

---
