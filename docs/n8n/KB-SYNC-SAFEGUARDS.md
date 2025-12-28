# Knowledge Base Sync - Safeguards & Implementation

## Overview

The Knowledge Base (KB) sync system automatically synchronizes KB items from Payload CMS to MongoDB Atlas Vector Search. This document explains the safeguards against duplicates and unnecessary processing.

## How KB Items Are Synced

### Automatic Sync (No Manual CTA Needed)

**KB items are automatically synced when:**
1. A KB item is **created** and status is `published`
2. A KB item is **updated** and:
   - Status changes to `published`
   - Content actually changed (title, content, tags, or category)
3. A KB item is **deleted** (removes from vector DB)
4. A KB item status changes from `published` to `draft`/`archived` (removes from vector DB)

**Implementation:** Hooks in `src/collections/KnowledgeBaseItems/hooks/syncToVectorDB.ts` automatically trigger the n8n webhook.

### Manual Sync (Optional)

You can also trigger sync manually via:
- **Scheduled n8n workflow** - Runs periodically (e.g., daily) to catch any missed items
- **n8n webhook** - Direct API call to `/webhook/kb/sync`

## Safeguards Against Duplicates & Unnecessary Processing

### 1. **Content Change Detection**

The hook checks if content actually changed before triggering sync:

```typescript
const contentChanged =
  !previousDoc ||
  doc.title_de !== previousDoc.title_de ||
  JSON.stringify(doc.content_de) !== JSON.stringify(previousDoc.content_de) ||
  JSON.stringify(doc.tags) !== JSON.stringify(previousDoc.tags) ||
  doc.category !== previousDoc.category
```

**Result:** Only syncs when content actually changes, not on every save.

### 2. **Status-Based Filtering**

Only `published` items are synced:
- Draft items → No sync
- Archived items → No sync (or removed if previously published)
- Published items → Synced

**Result:** Prevents syncing items that aren't ready for use.

### 3. **MongoDB Upsert Operation**

The n8n workflow uses MongoDB `upsert` operation:

```javascript
{
  operation: "upsert",
  filter: { _id: kbItemId },
  updateFields: { ... }
}
```

**Result:** 
- If document exists → Updates it (no duplicate)
- If document doesn't exist → Creates it
- Uses `_id` (Payload document ID) as unique identifier

### 4. **Embedding Metadata Tracking**

Each KB item stores sync metadata in Payload CMS:

```typescript
embeddingMetadata: {
  embedding_id: string,      // MongoDB document ID
  model: string,              // Embedding model used
  dimensions: number,         // Vector dimensions
  last_synced: Date          // Last sync timestamp
}
```

**Benefits:**
- Track when item was last synced
- Identify which model was used
- Verify sync status in Payload admin
- Can be used to detect stale embeddings

### 5. **Context Flag for Bulk Operations**

You can skip sync during bulk operations:

```typescript
await payload.update({
  collection: 'knowledge-base-items',
  id: '...',
  data: { ... },
  context: { skipKBSync: true }  // Skips sync hook
})
```

**Result:** Prevents unnecessary syncs during bulk imports or migrations.

### 6. **Error Handling**

The sync hook doesn't throw errors:
- If n8n webhook fails → Logs error but doesn't fail Payload operation
- Payload save operation succeeds even if sync fails
- Sync can be retried later via scheduled workflow

**Result:** Payload CMS operations are never blocked by sync failures.

## MongoDB Atlas Setup Requirements

### What You Need to Set Up

1. **Vector Search Index** (see `MONGODB-ATLAS-VECTOR-SEARCH-SETUP.md`)
   - Create collection: `knowledge_base_vectors`
   - Create Vector Search index on `embedding` field
   - Set dimensions: 1536 (for text-embedding-3-small) or 3072 (for text-embedding-3-large)

2. **Database User** (optional but recommended)
   - Create dedicated user for n8n
   - Grant read/write access to `knowledge_base_vectors` collection only
   - No access to Payload CMS collections

3. **Connection String**
   - Add `MONGODB_URI` to n8n environment variables
   - Use same cluster as Payload CMS (or separate cluster)

### What You DON'T Need

- ❌ Separate MongoDB account (use existing Atlas account)
- ❌ New database (can use existing or create new)
- ❌ Changes to Payload CMS database (separate collection)

## n8n Workflow Implementation

### Workflow Structure

1. **Webhook** - Receives sync trigger from Payload CMS
2. **Parse Input** - Validates and formats input
3. **Check Action** - Routes to delete or sync path
4. **Delete Path** - Removes from vector DB
5. **Sync Path**:
   - Fetch KB item from Payload CMS
   - Extract text from rich text content
   - Generate embedding (OpenAI)
   - Upsert to MongoDB Atlas
   - Update embedding metadata in Payload CMS

### Safeguards in n8n Workflow

1. **Input Validation** - Validates action and kbItemId
2. **Conditional Processing** - Only fetches KB item if needed (skip for delete)
3. **Upsert Operation** - Prevents duplicates
4. **Metadata Update** - Tracks sync status back to Payload

## Testing Safeguards

### Test Scenarios

1. **Create new KB item** → Should sync once
2. **Update KB item without content change** → Should NOT sync
3. **Update KB item with content change** → Should sync
4. **Change status draft → published** → Should sync
5. **Change status published → draft** → Should delete from vector DB
6. **Delete KB item** → Should delete from vector DB
7. **Bulk update with skipKBSync** → Should NOT sync

### Verification

Check `embeddingMetadata.last_synced` in Payload CMS admin to verify sync status.

## Troubleshooting

### Item Not Syncing

1. Check KB item status is `published`
2. Verify content actually changed
3. Check n8n workflow is active
4. Check n8n execution logs for errors
5. Verify webhook URL in SiteSettings

### Duplicate Embeddings

1. Check MongoDB for duplicate `_id` values (shouldn't happen with upsert)
2. Verify upsert operation is working correctly
3. Check if scheduled workflow is creating duplicates

### Stale Embeddings

1. Check `embeddingMetadata.last_synced` timestamp
2. Compare with KB item `updatedAt` timestamp
3. If stale, trigger manual sync or wait for scheduled sync

## Summary

✅ **Automatic sync** - No manual CTA needed, hooks handle it  
✅ **Content change detection** - Only syncs when content changes  
✅ **Status filtering** - Only syncs published items  
✅ **Upsert operation** - Prevents duplicates  
✅ **Metadata tracking** - Tracks sync status  
✅ **Error resilience** - Doesn't block Payload operations  
✅ **Bulk operation support** - Can skip sync when needed  

The system is designed to be robust, efficient, and prevent duplicate or unnecessary processing.

