# Knowledge Base Sync Workflow - Detailed Explanation

## Workflow Overview

This n8n workflow synchronizes Knowledge Base items from Payload CMS to MongoDB Atlas Vector Search, with intelligent tracking to avoid duplicate processing.

## Workflow Flow

```
Webhook → Parse Input → Check Action
                              ↓
                    ┌─────────┴─────────┐
                    ↓                   ↓
            Delete Path          Sync Path
                    ↓                   ↓
            Delete from DB    Fetch KB Item
                                    ↓
                            Check Existing Vector
                                    ↓
                            Check If Sync Needed
                                    ↓
                            Should Sync?
                    ┌─────────┴─────────┐
                    ↓                   ↓
            Skip (respond)      Prepare Text
                                    ↓
                            Generate Embedding
                                    ↓
                            Prepare Document
                                    ↓
                            Upsert to Vector DB
                                    ↓
                            Update Metadata
                                    ↓
                            Format Response
                                    ↓
                            Respond to Webhook
```

## Node-by-Node Explanation

### 1. Webhook
- **Path:** `/kb/sync`
- **Method:** POST
- **Receives:** `{ action, kbItemId, trigger }`

### 2. Parse Input
- Validates webhook payload
- Ensures `action` is valid (`create`, `update`, or `delete`)
- Ensures `kbItemId` is present

### 3. Check Action
- Routes workflow based on action
- **If `delete`:** Goes to delete path
- **If `create` or `update`:** Goes to sync path

### 4. Delete Path

#### Delete from Vector DB
- Removes document from `knowledge_base_vectors` collection
- Uses `_id` (Payload document ID) as filter
- Always executes (no checks needed)

### 5. Sync Path

#### Fetch KB Item from Payload
- Fetches full KB item from Payload CMS API
- Includes all fields: `title_de`, `content_de`, `tags`, `category`, `status`, `embeddingMetadata`

#### Check Existing Vector (Parallel)
- Queries MongoDB to see if vector already exists
- Uses `findOne` with `_id` filter
- Returns `null` if not found, or existing document if found

#### Check If Sync Needed
**This is the key safeguard node!**

Checks multiple conditions:

1. **Status Check:**
   - Only syncs if `status === 'published'`
   - Returns `shouldSync: false` if not published

2. **Existence Check:**
   - If item doesn't exist in MongoDB → `shouldSync: true`

3. **Content Change Detection:**
   - Creates content hash from: `title_de`, `content_de`, `tags`, `category`
   - Compares with existing vector's content hash
   - If different → `shouldSync: true`

4. **Model Change Detection:**
   - Checks if embedding model changed
   - If model changed → `shouldSync: true` (needs re-embedding)

5. **Skip If Up-to-Date:**
   - If content hash matches AND model matches → `shouldSync: false`

**Output:**
```json
{
  "shouldSync": true/false,
  "reason": "explanation",
  "kbItem": {...},
  "needsEmbedding": true/false
}
```

#### Should Sync?
- Conditional node based on `shouldSync` flag
- **If `false`:** Skips to Format Response (no processing)
- **If `true`:** Continues to embedding generation

#### Prepare Text for Embedding
- Extracts plain text from rich text content
- Combines `title_de` + `content_de` for embedding
- Extracts tags array
- Creates content hash for tracking
- **Only runs if sync is needed**

#### Generate Embedding
- Calls OpenAI embedding API
- Model: `$env.EMBEDDING_MODEL` or `text-embedding-3-small`
- Input: Combined text (title + content)
- Output: Embedding vector array

#### Prepare Document
- Combines all data into MongoDB document structure
- Includes:
  - `_id`: Payload document ID
  - `title_de`, `content_de`, `tags`, `category`, `status`
  - `contentHash`: For future change detection
  - `embedding`: Vector array
  - `embeddingModel`: Model used
  - `embeddingDimensions`: Vector dimensions
  - `lastSyncedAt`: Timestamp
  - `createdAt`, `updatedAt`: Timestamps

#### Upsert to Vector DB
- Uses MongoDB `upsert` operation
- **Prevents duplicates:** If `_id` exists, updates; if not, creates
- Updates all fields including embedding

#### Update Embedding Metadata
- Updates Payload CMS with sync metadata
- Sets `embeddingMetadata` fields:
  - `embedding_id`: MongoDB document ID
  - `model`: Embedding model used
  - `dimensions`: Vector dimensions
  - `last_synced`: Sync timestamp

#### Format Response
- Creates success response
- Includes action taken, reason, and metadata
- Different responses for:
  - Delete: Confirmation of deletion
  - Skip: Explanation why skipped
  - Sync: Success with embedding details

## Safeguards Against Duplicates

### 1. **Content Hash Comparison**
- Creates hash from title, content, tags, category
- Compares with existing vector's hash
- Only syncs if hash changed

### 2. **MongoDB Upsert**
- Uses `upsert` operation (update if exists, create if not)
- `_id` is unique (Payload document ID)
- Prevents duplicate documents

### 3. **Status Filtering**
- Only processes `published` items
- Skips `draft` and `archived` items

### 4. **Model Change Detection**
- Tracks which embedding model was used
- Re-embeds if model changes (e.g., switching from small to large)

### 5. **Metadata Tracking**
- Stores `lastSyncedAt` timestamp
- Stores `contentHash` for comparison
- Can be used to verify sync status

## Example Scenarios

### Scenario 1: New KB Item
1. Item created in Payload with status `published`
2. Webhook triggered with `action: 'create'`
3. Check Existing Vector → `null` (not found)
4. Check If Sync Needed → `shouldSync: true` (not found)
5. Generate embedding
6. Upsert to MongoDB
7. Update metadata in Payload

### Scenario 2: Update Without Content Change
1. Item updated in Payload (e.g., only metadata changed)
2. Webhook triggered with `action: 'update'`
3. Check Existing Vector → Found existing document
4. Check If Sync Needed → Content hash matches → `shouldSync: false`
5. Skip embedding generation
6. Return skip response

### Scenario 3: Update With Content Change
1. Item updated in Payload (content changed)
2. Webhook triggered with `action: 'update'`
3. Check Existing Vector → Found existing document
4. Check If Sync Needed → Content hash different → `shouldSync: true`
5. Generate new embedding
6. Upsert to MongoDB (updates existing)
7. Update metadata in Payload

### Scenario 4: Delete
1. Item deleted in Payload
2. Webhook triggered with `action: 'delete'`
3. Delete from Vector DB
4. Return success response

### Scenario 5: Status Change to Draft
1. Item status changed from `published` to `draft`
2. Check If Sync Needed → `shouldSync: false` (not published)
3. Skip sync
4. (Note: Should also delete from vector DB - this could be added)

## MongoDB Document Structure

```json
{
  "_id": "payload_document_id",
  "title_de": "Nachtlüftung optimieren",
  "content_de": "Plain text content...",
  "contentHash": "title|content|tags|category",
  "tags": ["ventilation", "cooling"],
  "category": "comfort",
  "status": "published",
  "embedding": [0.123, 0.456, ...],
  "embeddingModel": "text-embedding-3-small",
  "embeddingDimensions": 1536,
  "lastSyncedAt": "2024-01-01T00:00:00.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

## Testing the Workflow

### Test Cases

1. **Create new published item** → Should sync
2. **Update item without content change** → Should skip
3. **Update item with content change** → Should sync
4. **Delete item** → Should delete from vector DB
5. **Create draft item** → Should skip (not published)
6. **Change status published → draft** → Should skip
7. **Change embedding model** → Should re-sync

### Manual Testing

You can test the webhook directly:

```bash
curl -X POST https://n8n.adaptmap.de/webhook/kb/sync \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "kbItemId": "your-kb-item-id",
    "trigger": "manual"
  }'
```

## Troubleshooting

### Item Not Syncing
- Check if status is `published`
- Check if content actually changed
- Check n8n execution logs
- Verify webhook URL in Payload settings

### Duplicate Embeddings
- Shouldn't happen due to upsert operation
- Check MongoDB for duplicate `_id` values
- Verify upsert is working correctly

### Embeddings Not Updating
- Check content hash comparison logic
- Verify `contentHash` is stored correctly
- Check if model changed detection is working

## Performance Considerations

- **Embedding generation** is the slowest step (~1-2 seconds per item)
- **Content hash comparison** prevents unnecessary embedding generation
- **Upsert operation** is efficient (single operation)
- **Parallel execution** of "Fetch KB Item" and "Check Existing Vector" saves time

## Future Enhancements

1. **Batch processing** - Process multiple items at once
2. **Scheduled full sync** - Periodic sync of all published items
3. **Retry logic** - Retry failed syncs
4. **Status change handling** - Auto-delete when status changes to draft/archived

