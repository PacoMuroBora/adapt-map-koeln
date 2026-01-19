# AI Recommendation Workflow Fixes

## Issues Fixed

### 1. MongoDB Permissions Error

**Problem:** "user is not allowed to list search indexes"

**Root Cause:** The MongoDB database user doesn't have `listSearchIndexes` permission, which is required for vector search queries (load mode).

**Solution:** See `MONGODB-PERMISSIONS-FIX.md` for detailed instructions on updating MongoDB user permissions.

**Quick Fix:**
1. MongoDB Atlas → Database Access → Edit User
2. Add Custom Role with `listSearchIndexes` action
3. OR ensure user has `readWrite` role on `adaptmap_vectors` database

### 2. Improved Vector Search Prompt

**Before:**
```
Pick the entry that mostly relates to the this entry submission
```

**After:**
```
Find relevant knowledge base articles about heat adaptation, cooling strategies, and climate resilience that relate to this user's heat stress situation:

**User's Heat Stress Issues:**
[structured answers]

**Location:** [city, postal code, coordinates]

**Additional Context:** [free text]

**User Profile:** [age, household size, gender]

**Problem Index:** [score]/100

Retrieve the most relevant knowledge base items that can help provide specific, actionable recommendations for this situation. Focus on:
- Immediate cooling strategies
- Building adaptation measures
- Behavioral recommendations
- Long-term solutions
- Location-specific considerations
```

**Benefits:**
- More specific and contextual
- Better semantic understanding for embedding generation
- Focuses on actionable recommendations
- Includes all relevant context

### 3. Proper RAG Pattern Implementation

**Before:** Vector search results weren't properly formatted or passed to the AI agent.

**After:** Added "Format KB Results" node that:
- Extracts KB items from vector search results
- Formats them with metadata (title, content, category, tags, score)
- Merges with user data
- Passes structured data to AI agent

**Workflow Flow:**
```
Format Body → MongoDB Vector Store → Format KB Results → Merge → AI Agent
```

### 4. Enhanced AI Agent Prompt

**Improvements:**
- Added section for Knowledge Base Articles with structured format
- Instructions to use KB articles as basis for recommendations
- Clear guidance on when to reference `kbItemId`
- Better integration of retrieved context

**Key Changes:**
- AI agent now receives formatted KB items in the prompt
- Instructions to base recommendations on KB articles when available
- Clear mapping between recommendations and KB item IDs
- Proper handling when no KB items are found

## Workflow Structure

```
Webhook
  ↓
Format Body
  ↓
MongoDB Atlas Vector Store (load mode)
  ↓
Format KB Results (new node)
  ↓
Merge
  ↓
AI Agent
  ↓
Set body
  ↓
Respond to Webhook
```

## Configuration

### MongoDB Atlas Vector Store Node

- **Mode:** `load` (for retrieval/search)
- **Collection:** `knowledge_base_vectors`
- **Vector Index:** `vector_index`
- **Options:** `topK: 5` (retrieve top 5 most relevant items)

### Format KB Results Node

Extracts and formats:
- `_id`: KB item ID
- `title`: From `companyOrTip.company` or `companyOrTip.tip`
- `company`: Company name (if available)
- `tip`: Tip content (if available)
- `description`: Detailed description
- `problemsSolved`: Problems solved by the solution
- `applicableWhen`: When the solution is applicable
- `categories`: Array of category values
- `keywords`: Array of keyword values
- `score`: Relevance score from vector search

### AI Agent Prompt

Now includes:
1. User submission data (answers, location, problem index)
2. **Relevant KB Articles** (formatted with all metadata)
3. Instructions to use KB articles for recommendations
4. Schema for output with `kbItemId` references

## Testing

After applying fixes:

1. **Test MongoDB Permissions:**
   - Vector Store node should retrieve documents without errors
   - No "list search indexes" error

2. **Test Vector Search:**
   - Should return 0-5 relevant KB items
   - Items should have proper structure (title, content, category, tags)

3. **Test AI Agent:**
   - Should generate recommendations based on KB items
   - Recommendations should include `kbItemId` when relevant
   - `referencedKbIds` array should contain all used KB item IDs

4. **Test End-to-End:**
   - Submit test questionnaire
   - Verify recommendations reference KB items
   - Check that KB item IDs are valid

## Best Practices Applied

1. **RAG Pattern:**
   - ✅ Query: User submission data
   - ✅ Retrieve: Vector search for relevant KB items
   - ✅ Augment: Format and merge KB items with user data
   - ✅ Generate: AI agent creates recommendations using KB context

2. **Prompt Engineering:**
   - ✅ Clear, structured prompts for vector search
   - ✅ Context-rich prompts for AI agent
   - ✅ Explicit instructions for using retrieved knowledge
   - ✅ Proper schema enforcement

3. **Error Handling:**
   - ✅ Graceful handling when no KB items found
   - ✅ Filtering of invalid KB items
   - ✅ Fallback to general knowledge when needed

4. **Data Flow:**
   - ✅ Proper data transformation between nodes
   - ✅ Structured data format throughout
   - ✅ Clear separation of concerns

## Next Steps

1. Update MongoDB user permissions (see `MONGODB-PERMISSIONS-FIX.md`)
2. Import updated workflow to n8n
3. Test with sample submissions
4. Monitor for any errors
5. Verify KB item references in recommendations

