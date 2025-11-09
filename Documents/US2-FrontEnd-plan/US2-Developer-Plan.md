# US2 - 3 Developer Implementation Plan

## 1. Developer Task Assignments

### 👤 Developer 1 - Mohamed Shoieb - (2 tasks, ~2 days)
1. **T097** - RatingDisplayComponent (0.5-1 day)
2. **T092** - MentorCardComponent (1-1.5 days)

### 👤 Developer 2 - Hisham Elmorsy - (3 tasks, ~5 days)
3. **T096** - PaginationComponent (1.5-2 days)
4. **T090** - CategoryService (1-1.5 days)
5. **T095** - CategoryBrowseComponent (1.5 days)

### 👤 Developer 3 - Mohamed Shehata - (6 tasks, ~16.5 days)
6. **T089** - Enhance MentorService (2.5-3 days) ⚠️ **BLOCKER**
7. **T093** - MentorDetailComponent (2-2.5 days)
8. **T091** - MentorListComponent (2-2.5 days)
9. **T098** - FiltersPanelComponent (2.5-3 days)
10. **T099** - MentorSearchState Service (3-4 days) ⚠️ **HARDEST**
11. **T094** - MentorSearchComponent (2-2.5 days) ⚠️ **FINAL INTEGRATION**

---

## 2. Execution Timeline Explanation

### 2.1 Week 1: Foundation Phase - What's Parallel and What Blocks

**Developer 1:**
- Starts with **T097** (RatingDisplay) → **BLOCKS** → **T092** (MentorCard)
- **Why sequential?** MentorCard uses RatingDisplay component inside it
- Total: ~2 days

**Developer 2:**
- **T096** (Pagination) and **T090** (CategoryService) are **PARALLEL** (can do in any order)
- **T090** → **BLOCKS** → **T095** (CategoryBrowse)
- **Why?** CategoryBrowse calls CategoryService to fetch data
- Total: ~5 days

**Developer 3:**
- **FREE** during Week 1
- Can help with testing, documentation, or other user stories

**What's Parallel:**
- Dev 1's work and Dev 2's work happen simultaneously
- Within Dev 2: T096 and T090 are independent (no blocking between them)

**What Blocks What:**
- T097 blocks T092 (same developer)
- T090 blocks T095 (same developer)
- No cross-developer blocking in Week 1

---

### 2.2 Week 2-3: Core Service Phase - Major Blocker

**Developer 3:**
- **T089** (MentorService) - **MAJOR BLOCKER** (~3 days)
- **Blocks:** T091, T093, T099 (nothing can proceed without this)
- After T089 completes → T093 and T091 can be done in either order

**Why T089 is a Bottleneck:**
- Most complex service with search, filters, pagination
- All other components need this service to fetch mentor data
- Cannot be parallelized

**Developer 1 & 2:**
- Tasks complete, can help with testing or other user stories

---

### 2.3 Week 3-4: Search Integration Phase - Sequential Dependencies

**Developer 3:**
- **T098** (FiltersPanel) → sequential → **T099** (SearchState) → sequential → **T094** (MentorSearch)
- Both T098 and T099 **BLOCK** T094 (final integration needs both)

**Why Sequential:**
- Same developer doing all tasks
- T094 cannot start until both T098 and T099 are complete

**Could be Parallel (if 2 developers):**
- T098 and T099 are independent and could run simultaneously with different developers

---

## 3. Visual Blocking Summary

```
Foundation Phase (Week 1):
├─ Dev 1: T097 ──blocks──> T092
├─ Dev 2: T096 ┐ (parallel)
│         T090 ┘ ──blocks──> T095
└─ Dev 3: (free)

Core Service Phase (Week 2-3):
└─ Dev 3: T089 ──BLOCKS──> T091, T093, T099
          │
          └──> T093 ┐ (can do either first)
               T091 ┘

Search Phase (Week 3-4):
└─ Dev 3: T098 ──sequential──> T099 ──sequential──> T094
          └─────────both BLOCK──────────────────────┘
```

---

## 4. Critical Path Analysis

**Major Blockers:**
1. **T089** (MentorService) - Blocks 3 tasks (T091, T093, T099)
2. **T094** (MentorSearch) - Blocks User Story 2 completion

**Minor Blockers (same developer):**
- T097 → T092
- T090 → T095

**Parallel Opportunities:**
- Week 1: Dev 1 and Dev 2 work simultaneously
- Week 2-3: T093 and T091 after T089 (but same developer)
- Week 3-4: T098 and T099 could be parallel with 2 developers

---

## 5. Execution Timeline

### 5.1 Week 1: Foundation (All Parallel)
```
Dev 1: T097 ━━━━━┐
                  ├──> T092 ━━━━━━━━━━━━━
       (wait)    ┘

Dev 2: T096 ━━━━━━━━━━━━━━━━━┐
                              ├──> T090 ━━━━━━━━━┐
       (parallel)            ┘                   ├──> T095 ━━━━━━━━
                                                ┘

Dev 3: (free) ────────────────────────────────────────────────────
```

### 5.2 Week 2-3: Core Service Phase (Sequential Blocker)
```
Dev 3: T089 (MentorService) ━━━━━━━━━━━━━━━━━━━━━━━━━ (BLOCKER)
       │
       └──> T093 (Detail) ━━━━━━━━━━━━━
       └──> T091 (List) ━━━━━━━━━━━━━━

Dev 1 & 2: Help with testing, documentation, or move to other user stories
```

### 5.3 Week 3-4: Search Integration Phase
```
Dev 3: T098 (Filters) ━━━━━━━━━━━━━━━━━━━━━━━━━
       │
       └──> T099 (State) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       │
       └──> T094 (Search) ━━━━━━━━━━━━━━━━━━━ (FINAL)
```

**Total Duration**: ~4 weeks

---

## 6. Task Dependencies

### 6.1 Critical Path
```
T089 → T091, T093, T099
T099 → T094
T098 → T094
```

### 6.2 Dependency Tree
```
T097 ─────┐
          ├─> T092 ─────┐
          │             │
T096 ─────┼─────────────┼─> T091 ────┐
          │             │             │
T090 ─────┴─> T095      │             │
                        │             │
T089 ───────────────────┴─> T093      ├─> T094
  │                         │         │
  ├─> T099 ─────────────────┴─────────┘
  │    │
  └────┴─> T098 ───────────────────────┘
```

---

## 7. Task Details

### 7.1 T097 - RatingDisplayComponent
**What**: Reusable star rating display (e.g., ★★★★☆ 4.5)
**Output**: Small component showing filled/half/empty stars based on numeric rating
**Use**: Display mentor ratings on cards, detail pages, reviews
**Dependencies**: None
**Used By**: T092 (MentorCard), T093 (MentorDetail)
**Key Features**:
- Accept `@Input() rating: number` (e.g., 4.5)
- Display 5 stars with appropriate fill (full/half/empty)
- Show numeric rating next to stars (optional)
- Use Tailwind for styling (gold stars)

**Example**:
```
★★★★☆ 4.5 (120 reviews)
```

---

### 7.2 T092 - MentorCardComponent
**What**: Card displaying mentor summary in grid/list views
**Output**: Compact card with avatar, name, title, rating, price, brief bio
**Use**: Browse page showing multiple mentors, category results
**Dependencies**: T097 (RatingDisplay)
**Used By**: T091 (MentorList)
**Key Features**:
- Accept `@Input() mentor: Mentor` (from `shared/models/mentor.model.ts`)
- Display mentor avatar (circular image)
- Show name, professional title, specialization
- Use RatingDisplayComponent for rating
- Show price per session (formatted)
- Brief bio (truncated to 2-3 lines)
- Emit `@Output() mentorClick` when card clicked
- Hover effect (Tailwind: `hover:shadow-lg`)

**Example Layout**:
```
┌─────────────────────────────────┐
│  [Avatar]  John Smith           │
│            Senior Dev at Google │
│            ★★★★☆ 4.8            │
│                                 │
│  Specializes in Angular and...  │
│                                 │
│  $75/session     [View Profile] │
└─────────────────────────────────┘
```

---

### 7.3 T096 - PaginationComponent
**What**: Reusable pagination controls for paged data
**Output**: Page numbers, prev/next buttons, page size selector
**Use**: Bottom of mentor list, search results
**Dependencies**: None
**Used By**: T091 (MentorList)
**Key Features**:
- Accept `@Input() totalItems: number`, `currentPage: number`, `pageSize: number`
- Calculate total pages, visible page numbers (e.g., show 1 2 3 ... 10)
- Emit `@Output() pageChange` with new page number
- Emit `@Output() pageSizeChange` with new page size
- Disable prev/next at boundaries
- Highlight current page

**Example**:
```
[Previous] [1] [2] [3] ... [10] [Next]  |  Show: [10▼] per page
          ^current
```

---

### 7.4 T090 - CategoryService
**What**: Service to fetch and manage mentor categories
**Output**: Angular service with HTTP methods for categories
**Use**: Populate category browse page, filter dropdowns
**Dependencies**: HttpClient, existing service patterns (AuthService)
**Used By**: T095 (CategoryBrowse), T098 (Filters)
**Key Features**:
- `getAllCategories(): Observable<Category[]>` - fetch all categories
- `getCategoryById(id): Observable<Category>` - single category
- Cache categories in memory (avoid repeated API calls)
- Error handling with NotificationService
- Follow pattern from `core/services/auth.service.ts`

**API Endpoint**: `GET /api/categories`

---

### 7.5 T095 - CategoryBrowseComponent
**What**: Grid of category cards for mentor discovery
**Output**: Clickable category tiles (e.g., "Web Development", "Data Science")
**Use**: Landing page, browse by category navigation
**Dependencies**: T090 (CategoryService)
**Used By**: Standalone page or section in public routes
**Key Features**:
- Call `CategoryService.getAllCategories()` on init
- Display categories in responsive grid (Tailwind: `grid grid-cols-2 md:grid-cols-4`)
- Each card shows category name, icon/image, mentor count
- Click navigates to mentor search filtered by category
- Loading state, empty state handling

**Example Layout**:
```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ [Icon]   │ │ [Icon]   │ │ [Icon]   │ │ [Icon]   │
│ Web Dev  │ │ Data Sci │ │ Business │ │ Design   │
│ 45 mentors│ │ 32 mentors│ │ 28 mentors│ │ 19 mentors│
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

---

### 7.6 T089 - Enhance MentorService ⚠️ BLOCKER
**What**: Core service for mentor data with search/filter capabilities
**Output**: Service with methods for searching, filtering, fetching mentors
**Use**: All mentor-related operations (search, detail, browse)
**Dependencies**: HttpClient, mentor models from `shared/models/mentor.model.ts`
**Used By**: T091, T093, T094, T099
**Key Features**:
- `searchMentors(query, filters, pagination): Observable<PaginatedResult<Mentor>>` - main search with filters
- `getMentorById(id): Observable<Mentor>` - single mentor detail
- `getMentorsByCategory(categoryId, pagination): Observable<PaginatedResult<Mentor>>`
- Build complex query params (price range, rating, availability, sort)
- Parse pagination metadata from response headers/body
- Error handling for 404, empty results
- **Most complex service** - takes 2.5-3 days

**API Endpoints**:
- `GET /api/mentors?search=...&category=...&minPrice=...&sort=...`
- `GET /api/mentors/{id}`

---

### 7.7 T093 - MentorDetailComponent
**What**: Full mentor profile page
**Output**: Comprehensive view with bio, expertise, reviews, availability, booking button
**Use**: When user clicks "View Profile" on mentor card
**Dependencies**: T089 (MentorService), possibly ReviewService
**Used By**: Routed from mentor card clicks
**Key Features**:
- Get mentor ID from route params (`ActivatedRoute`)
- Call `MentorService.getMentorById(id)` on init
- Display full bio, professional background, education
- Show expertise tags/badges
- Display reviews preview (use T097 for ratings)
- Show availability calendar/times
- "Book Session" button (links to booking flow)
- Back button to search results
- Loading state, 404 if mentor not found

**Route**: `/mentors/:id`

---

### 7.8 T091 - MentorListComponent
**What**: Container displaying grid of mentor cards with pagination
**Output**: Grid of MentorCards + pagination controls
**Use**: Search results page, category browse results
**Dependencies**: T092 (MentorCard), T096 (Pagination), T089 (MentorService)
**Used By**: T094 (MentorSearch)
**Key Features**:
- Accept `@Input() mentors: Mentor[]`, `totalCount: number`, `currentPage: number`
- Display mentors in responsive grid (2-4 columns)
- Handle mentor card clicks (navigate to detail)
- Show pagination controls
- Loading state (skeleton cards)
- Empty state ("No mentors found")
- Emit `@Output() pageChange` for pagination

---

### 7.9 T098 - FiltersPanelComponent
**What**: Sidebar/panel with search filters (price, rating, availability, sort)
**Output**: Form controls for filtering mentor search results
**Use**: Search page sidebar, toggleable on mobile
**Dependencies**: Reactive Forms, Tailwind for UI
**Used By**: T094 (MentorSearch)
**Key Features**:
- Price range slider (min/max)
- Rating filter (dropdown or stars)
- Availability checkbox (only available now)
- Sort dropdown (rating, price, newest)
- Category filter (from T090)
- Use Reactive Forms with debouncing (500ms)
- Emit `@Output() filtersChange` with filter object
- Reset button to clear all filters
- Mobile: collapsible panel

**Example**:
```
┌─ Filters ────────────┐
│ Price Range          │
│ [====○────] $0-$200  │
│                      │
│ Minimum Rating       │
│ [4+ stars ▼]         │
│                      │
│ [✓] Available Now    │
│                      │
│ Sort By              │
│ [Highest Rated ▼]    │
│                      │
│ [Reset Filters]      │
└──────────────────────┘
```

---

### 7.10 T099 - MentorSearchState Service ⚠️ HARDEST
**What**: Centralized state management for search (query, filters, results, pagination)
**Output**: Service with RxJS observables managing entire search state
**Use**: Coordinate between search bar, filters, results list
**Dependencies**: T089 (MentorService), RxJS (BehaviorSubject, combineLatest)
**Used By**: T094 (MentorSearch)
**Key Features**:
- Manage search query (BehaviorSubject)
- Manage filters (BehaviorSubject)
- Manage pagination (BehaviorSubject)
- Combine all inputs with `combineLatest`, debounce, call MentorService
- Expose `searchResults$: Observable<Mentor[]>`
- Expose `totalCount$`, `currentPage$`, `isLoading$`
- Avoid duplicate API calls (caching, distinctUntilChanged)
- Optionally sync state with URL query params
- **Most advanced task** - requires strong RxJS knowledge

**Pattern**:
```typescript
private querySubject = new BehaviorSubject<string>('');
private filtersSubject = new BehaviorSubject<Filters>({...});

searchResults$ = combineLatest([
  this.querySubject.pipe(debounceTime(300)),
  this.filtersSubject,
  this.pageSubject
]).pipe(
  switchMap(([query, filters, page]) =>
    this.mentorService.searchMentors(query, filters, page)
  )
);
```

---

### 7.11 T094 - MentorSearchComponent ⚠️ FINAL INTEGRATION
**What**: Main search page orchestrating search bar, filters, results
**Output**: Complete search experience page
**Use**: Primary mentor discovery interface (route: `/mentors/search`)
**Dependencies**: T099 (SearchState), T098 (Filters), T091 (List), T089 (MentorService)
**Used By**: Main navigation, category browse
**Key Features**:
- Search input with debounce (uses SearchState)
- Toggle filters panel (mobile: slide-in)
- Display filter count badge
- Show result count ("Showing 24 of 156 mentors")
- Integrate FiltersPanelComponent
- Integrate MentorListComponent
- Subscribe to SearchState observables
- Handle loading states across all sections
- Responsive layout (filters sidebar on desktop, drawer on mobile)

**Layout**:
```
┌────────────────────────────────────────────────┐
│ [Search mentors...               ] [🔍]        │
│ [Filters ▼] Showing 24 of 156 mentors          │
├──────────┬─────────────────────────────────────┤
│ Filters  │ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐    │
│ (T098)   │ │Card │ │Card │ │Card │ │Card │    │
│          │ │(T092)│ │(T092)│ │(T092)│ │(T092)│   │
│          │ └─────┘ └─────┘ └─────┘ └─────┘    │
│          │                                     │
│          │ [Pagination (T096)]                 │
└──────────┴─────────────────────────────────────┘
```

---

## 8. Developer Notes

### 8.1 Developer 1
- Start with T097 (simple, no dependencies)
- Once T097 done, immediately work on T092 (uses T097)
- Both tasks are presentational components - focus on clean UI
- Reference `@CareerRoute-MVP-Design\` for styling examples
- Use Tailwind exclusively for styling

### 8.2 Developer 2
- T096 and T090 can be done in any order (independent)
- T096 is logic-focused (good for learning state management)
- T090 follows AuthService pattern - copy and adapt
- After T090 is done, immediately work on T095 (needs CategoryService)
- All three are reusable across the app

### 8.3 Developer 3
- **Week 1**: Free during foundation phase - can help with testing or other user stories
- **Week 2**: T089 is the hardest service - take your time, test thoroughly
- **Week 2-3**: T093 and T091 can be done in either order (both need T089)
- **Week 3**: T098 (filters) - complex forms but isolated component
- **Week 4**: T099 - most advanced task, requires RxJS mastery
- **Week 4**: T094 - final integration, brings everything together

### 8.4 All Developers
- Update README.md files after creating/modifying files
- Use existing interceptors (authInterceptor, errorInterceptor)
- Use NotificationService for user feedback
- Test components in isolation before integration
- Commit after each task completion

---

## 9. Success Criteria

### 9.1 Phase 1 Complete (Week 1)
- ✅ All foundation components render correctly
- ✅ Can display a mentor card with rating
- ✅ Pagination controls work
- ✅ Can fetch and display categories

### 9.2 Phase 2 Complete (Week 2-3)
- ✅ MentorService can search/filter mentors
- ✅ Mentor detail page loads
- ✅ Mentor list displays search results

### 9.3 Phase 3 Complete (Week 4)
- ✅ Search with filters works end-to-end
- ✅ User can browse categories → filter → view detail
- ✅ All acceptance criteria met

---

**Last Updated**: 2025-11-09
