# MongoDB Atlas Vector Search Setup

Since you already have a MongoDB Atlas account for Payload CMS, you need to set up Vector Search capabilities.

## Prerequisites

- MongoDB Atlas account (you already have this)
- MongoDB Atlas cluster (M10 or higher recommended for Vector Search)
- Access to Atlas UI

## Setup Steps

### 1. Enable Vector Search (if not already enabled)

Vector Search is available on:
- **M10+ clusters** (shared or dedicated)
- **Serverless instances** (M0 free tier does NOT support Vector Search)

If you're on M0, you'll need to upgrade to at least M10.

### 2. Create a New Database and Collection

1. Go to MongoDB Atlas → Browse Collections
2. Create a new database: `adaptmap_vectors` (or use your existing database)
3. Create a new collection: `knowledge_base_vectors`

**Note:** This is separate from your Payload CMS collections. Payload uses its own database/collections.

### 3. Create Vector Search Index

1. Go to your cluster → **Atlas Search** tab
2. Click **Create Search Index**
3. Select **Vector Search** (not Regular Search)
4. Configure the index:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 1536,
      "similarity": "cosine"
    }
  ]
}
```

**Important Settings:**
- **Field path:** `embedding` (the field name in your documents)
- **Dimensions:** `1536` (for OpenAI `text-embedding-3-small`) or `3072` (for `text-embedding-3-large`)
- **Similarity:** `cosine` (recommended for text embeddings)

### 4. Verify Index Creation

- Index creation can take a few minutes
- Status will show as "Active" when ready
- You can test queries once active

## Document Structure

Documents in `knowledge_base_vectors` should have this structure:

```json
{
  "_id": "payload_document_id_here",
  "title": "Company Name or Tip Text",
  "contentText": "Combined description, problems_solved, applicable_when",
  "categories": ["hitzeschutz", "gebaeude"],
  "keywords": ["ventilation", "cooling", "night"],
  "embedding": [0.123, 0.456, ...], // Array of 1536 numbers
  "lastSyncedAt": "2024-01-01T00:00:00.000Z",
  "status": "published"
}
```

## Connection String

You'll need a connection string for n8n. You can:

1. Use the same connection string as Payload CMS (if same cluster)
2. Or create a separate database user for n8n with read/write access to `knowledge_base_vectors` collection

**Security Best Practice:** Create a dedicated database user for n8n with limited permissions:
- Read/Write access to `knowledge_base_vectors` collection only
- No access to Payload CMS collections

## Testing

Once set up, you can test Vector Search queries in MongoDB Atlas:

```javascript
// Example aggregation pipeline for vector search
[
  {
    $vectorSearch: {
      index: "vector_index",
      path: "embedding",
      queryVector: [0.123, 0.456, ...], // Your query embedding
      numCandidates: 100,
      limit: 5
    }
  },
  {
    $project: {
      title: 1,
      contentText: 1,
      categories: 1,
      keywords: 1,
      score: { $meta: "vectorSearchScore" }
    }
  }
]
```

## Cost Considerations

- Vector Search indexes use additional storage
- Each embedding is ~6KB (1536 dimensions × 4 bytes)
- 1000 KB items = ~6MB storage
- Vector Search queries are included in your cluster's compute resources

## Troubleshooting

**"Vector Search not available"**
- Upgrade to M10+ cluster
- Ensure you're using Atlas (not self-hosted MongoDB)

**"Index creation failed"**
- Check that `embedding` field exists in your documents
- Verify dimensions match (1536 for text-embedding-3-small)
- Ensure documents have the correct structure

**"Query returns no results"**
- Verify index is "Active" (not "Building")
- Check that embeddings are properly generated
- Ensure query vector has correct dimensions

