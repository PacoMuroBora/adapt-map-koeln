# n8n Workflow Documentation

This document describes the n8n workflows used for AI recommendation generation and knowledge base synchronization.

## Overview

The n8n instance is hosted at: **https://n8n.adaptmap.de**

### Workflows

1. **AI Recommendation Workflow** - Generates personalized recommendations using RAG (Retrieval-Augmented Generation)
2. **Knowledge Base Sync Workflow** - Synchronizes knowledge base items from Payload CMS to MongoDB Atlas for vector search

## AI Recommendation Workflow

### Purpose

Generate personalized German-language recommendations based on user submissions using RAG with the knowledge base.

### Webhook Endpoint

**Production**: `/webhook/ai/recommendation` (internal routing)  
**Development**: `https://n8n.adaptmap.de/webhook/ai/recommendation`

The webhook URL is configured in Payload CMS Global Settings (`SiteSettings` → `n8nWebhooks` → `aiRecommendation`).

The Next.js app uses `getN8nWebhookUrl()` utility function which:
- In development: Constructs full URL from `N8N_DOMAIN` env var (default: `https://n8n.adaptmap.de`) + path from SiteSettings
- In production: Uses path from SiteSettings + `N8N_INTERNAL_URL` env var (default: `http://localhost:5678`) for internal routing

### Input Payload

The workflow receives a POST request with the following JSON structure:

```json
{
  "submissionId": "string",
  "answers": {
    "question_key_1": "answer_value",
    "question_key_2": ["option1", "option2"],
    "question_key_3": 75
  },
  "problemIndex": 65,
  "location": {
    "lat": 50.9375,
    "lng": 6.9603,
    "postal_code": "50667",
    "city": "Köln"
  },
  "freeText": "Optional free text from user",
  "personalFields": {
    "age": 35,
    "gender": "male",
    "householdSize": 2
  }
}
```

### Workflow Steps

1. **Webhook Trigger** - Receives the submission data
2. **MongoDB Vector Search** - Query knowledge base embeddings for relevant items
   - Use submission answers, problem index, and location as search context
   - Retrieve top N most relevant knowledge base items
3. **LLM Processing** - Generate recommendations using retrieved context
   - Model: Configured LLM (OpenAI, Anthropic, or open-source alternative)
   - Language: German (de)
   - Generate:
     - Summary of the user's situation
     - List of actionable recommendations
4. **Format Response** - Structure the output

### Output Format

The workflow should return a JSON response:

```json
{
  "summary": "Zusammenfassung der Situation des Nutzers auf Deutsch...",
  "recommendations": [
    {
      "title": "Titel der Empfehlung",
      "description": "Detaillierte Beschreibung der Empfehlung",
      "priority": "high" | "medium" | "low",
      "kbItemId": "optional_referenced_kb_id"
    }
  ],
  "referencedKbIds": ["kb_id_1", "kb_id_2"],
  "modelMetadata": {
    "model": "gpt-4",
    "temperature": 0.7,
    "tokensUsed": 1500
  }
}
```

### Error Handling

- Return HTTP 500 with error message if workflow fails
- Log errors for debugging
- The Next.js API will handle retries

## Knowledge Base Sync Workflow

### Purpose

Synchronize knowledge base items from Payload CMS to MongoDB Atlas for vector search indexing.

**📚 See also:**
- [MongoDB Atlas Vector Search Setup](./MONGODB-ATLAS-VECTOR-SEARCH-SETUP.md) - Detailed setup instructions
- [KB Sync Safeguards](./KB-SYNC-SAFEGUARDS.md) - How duplicates are prevented and how sync works

### Webhook Endpoint

**Production**: `/webhook/kb/sync` (internal routing)  
**Development**: `https://n8n.adaptmap.de/webhook/kb/sync`

The webhook URL is configured in Payload CMS Global Settings (`SiteSettings` → `n8nWebhooks` → `kbSync`).

The Next.js app uses `getN8nWebhookUrl()` utility function which:
- In development: Constructs full URL from `N8N_DOMAIN` env var (default: `https://n8n.adaptmap.de`) + path from SiteSettings
- In production: Uses path from SiteSettings + `N8N_INTERNAL_URL` env var (default: `http://localhost:5678`) for internal routing

### Trigger Options

1. **Webhook Trigger** - Called from Payload CMS hooks when KB items are created/updated
2. **Scheduled Trigger** - Periodic sync (e.g., daily) to catch any missed updates

### Workflow Steps

1. **Fetch Knowledge Base Items** - Query Payload CMS API for all published KB items
   - Filter: `status: 'published'`
   - Include: `title_de`, `content_de`, `tags`, `category`
2. **Generate Embeddings** - Create vector embeddings for each item
   - Use the same embedding model as the search step
   - Combine `title_de` + `content_de` for embedding
3. **Update MongoDB Atlas** - Store/update embeddings in Vector Search collection
   - Upsert based on Payload document ID
   - Store metadata (tags, category, status)

### Input (Webhook)

```json
{
  "action": "create" | "update" | "delete",
  "kbItemId": "payload_document_id",
  "trigger": "webhook" | "scheduled"
}
```

### MongoDB Atlas Vector Search Setup

1. Create a collection: `knowledge_base_vectors`
2. Create a Vector Search index:
   - Field: `embedding`
   - Dimensions: Match your embedding model (e.g., 1536 for OpenAI text-embedding-3-small)
   - Similarity: `cosine`
3. Store documents with structure:
   ```json
   {
     "_id": "payload_document_id",
     "title_de": "...",
     "content_de": "...",
     "tags": ["tag1", "tag2"],
     "category": "category_name",
     "embedding": [0.123, 0.456, ...],
     "lastSyncedAt": "2024-01-01T00:00:00Z"
   }
   ```

## Environment Configuration

### Required Environment Variables in n8n

- `PAYLOAD_API_URL` - Payload CMS API URL (e.g., `https://adaptmap.de/api`)
- `PAYLOAD_KEY` - Payload CMS API key for authentication
- `MONGODB_URI` - MongoDB Atlas connection string
- `OPENAI_API_KEY` (or equivalent) - For LLM and embeddings
- `EMBEDDING_MODEL` - Model name (e.g., `text-embedding-3-small`)

### Internal Routing (Production)

When both services are on the same domain:
- n8n: `n8n.adaptmap.de`
- Web app: `adaptmap.de`

Use internal routing with default ports:
- n8n webhook path: `/webhook/ai/recommendation`
- n8n webhook path: `/webhook/kb/sync`

The Next.js app will construct the full URL based on environment:
- Development: Full URL with domain (`https://n8n.adaptmap.de/webhook/...`)
- Production: Internal URL with default port (`http://localhost:5678/webhook/...`)

Configure `N8N_INTERNAL_URL` environment variable in production to override the default internal URL.

## Testing

### Test AI Recommendation Workflow

1. Use n8n's "Test workflow" feature
2. Send sample payload:
   ```json
   {
     "submissionId": "test-123",
     "answers": {
       "heat_comfort": "very_hot",
       "cooling_access": "none"
     },
     "problemIndex": 75,
     "location": {
       "lat": 50.9375,
       "lng": 6.9603,
       "postal_code": "50667",
       "city": "Köln"
     }
   }
   ```
3. Verify response format and German language output

### Test Knowledge Base Sync

1. Trigger webhook with test payload
2. Verify MongoDB Atlas collection is updated
3. Check vector search index is working

## Workflow JSON

The complete workflow JSON can be imported into n8n. See `workflow.json` in this directory.

## Troubleshooting

### Common Issues

1. **Webhook not receiving requests**
   - Check webhook URL in Payload CMS settings
   - Verify n8n workflow is active
   - Check n8n execution logs

2. **Vector search returning no results**
   - Verify embeddings are generated correctly
   - Check MongoDB Atlas Vector Search index is created
   - Ensure embedding dimensions match

3. **LLM not generating German output**
   - Check system prompt includes language instruction
   - Verify model supports German language

4. **Internal routing not working**
   - Verify both services are on same domain
   - Check network configuration allows internal communication
   - Use full URLs for debugging

