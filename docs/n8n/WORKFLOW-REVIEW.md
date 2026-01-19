# Knowledge Base Sync Workflow - Review & Improvements

## ✅ RESOLVED: MongoDB Connection String Issue

**Status: FIXED** - You've replaced the HTTP Request nodes with Code nodes that use the MongoDB driver directly. This is the correct approach and avoids the Data API setup entirely.

**New nodes:**
- "Check Existing Vector1" (Code node) - Uses MongoDB driver
- "Delete Vector1" (Code node) - Uses MongoDB driver

## ⚠️ REMAINING ISSUES - Must Fix Before Testing

### 1. 🔴 CRITICAL: Node Name Mismatch
**Node: "Check If Sync Needed"** - The code references `$('Check Existing Vector')` but the actual node is named `"Check Existing Vector1"`.

**Current (WRONG):**
```javascript
const existingVector = $('Check Existing Vector').first()?.json || null;
```

**Should be:**
```javascript
const existingVector = $('Check Existing Vector1').first()?.json || null;
```

This will cause the workflow to fail!

### 2. 🔴 CRITICAL: Vector Index Name is Placeholder
**Node: "MongoDB Atlas Vector Store"** - `vectorIndexName: "vectorIndexName"` is literally the placeholder text.

**Fix:** Replace with your actual Vector Search index name from MongoDB Atlas:
1. Go to MongoDB Atlas → Your Cluster → Atlas Search
2. Find your Vector Search index name (e.g., "vector_index", "default", or custom name)
3. Update the workflow

### 3. 🟡 Vector Store Mode
**Node: "MongoDB Atlas Vector Store"** - `mode: "insert"` will fail on updates.

**Fix:** Change to `"upsert"` if available in your n8n version.

### 4. 🟡 Update Metadata Endpoint
**Node: "Update Embedding Metadata"** - Missing `/embedding-metadata` path in URL.

**Current:** `https://adaptmap.de/api/knowledge-base-items/{{ id }}`  
**Should be:** `https://adaptmap.de/api/knowledge-base-items/{{ id }}/embedding-metadata`

### 5. 🟡 Update Metadata Body Format
**Node: "Update Embedding Metadata"** - `jsonBody` sends the entire document instead of just the embedding metadata.

**Should be:**
```json
{
  "embeddingMetadata": {
    "embedding_id": "{{ $json._id }}",
    "model": "{{ $json.embeddingModel }}",
    "dimensions": {{ $json.embeddingDimensions }},
    "last_synced": "{{ $json.lastSyncedAt }}"
  }
}
```

### 6. 🟡 Enable MongoDB Module in n8n
**IMPORTANT:** The Code nodes use `require('mongodb')` which requires enabling external modules.

According to [n8n documentation](https://docs.n8n.io/hosting/configuration/configuration-examples/#enable-modules-in-code-node):

**For Docker/self-hosted n8n:**
```env
NODE_FUNCTION_ALLOW_EXTERNAL=mongodb
```

**Or for all modules:**
```env
NODE_FUNCTION_ALLOW_BUILTIN=*
NODE_FUNCTION_ALLOW_EXTERNAL=*
```

Without this, the Code nodes will fail with "Cannot find module 'mongodb'" error.

---

## ✅ Previously Resolved

### ~~Security Issue: MongoDB Connection String as API Key~~
~~**Lines 313, 340:** The MongoDB Atlas Data API nodes are using a MongoDB connection string...~~

**RESOLVED:** Replaced with Code nodes using MongoDB driver directly.

**Fix:** Use a proper MongoDB Atlas Data API key. Here's how to set it up:

#### Step-by-Step: Setting Up MongoDB Atlas Data API

**Step 1: Access MongoDB Atlas App Services**

**Option A: If you see "App Services" in the sidebar:**
1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/)
2. In the left sidebar, click **"App Services"** (or "Realm" in older versions)
3. If you see a list of apps, click **"Create New App"** or **"New App"** button
4. If you don't see "Create New App":
   - Look for a **"+"** button or **"New"** button in the top right
   - Or check if you need to enable App Services first (see Option B below)

**Option B: If you DON'T see "App Services" in the sidebar:**
1. MongoDB Atlas UI may have changed, or App Services might not be enabled
2. Try these alternatives:
   - Look for **"Realm"** in the sidebar (older name for App Services)
   - Check **"Services"** or **"More"** menu in the sidebar
   - Go to your **Organization** settings and check if App Services needs to be enabled
3. **Alternative: Use MongoDB Driver Directly** (see "Alternative Approach" section below)

**Option C: Check if Data API is Available via Different Path:**
1. Go to your **Cluster** (not Organization)
2. Click on your cluster name
3. Look for **"Data API"** or **"API"** tab
4. Some newer Atlas versions have Data API directly in cluster settings

**Step 2: Enable Data API**
1. In your App Services app, go to **"Data API"** in the left sidebar
2. Toggle **"Enable Data API"** to ON
3. You'll see a message that Data API is now enabled

**Step 3: Get Your App ID**
1. Still in the Data API section, you'll see an **"Endpoint URL"** at the top
2. The URL format is: `https://data.mongodb-api.com/app/YOUR_APP_ID/endpoint/data/v1`
3. Copy the **YOUR_APP_ID** part (it's a long alphanumeric string)
   - Example: `https://data.mongodb-api.com/app/abc123def456/endpoint/data/v1`
   - Your App ID would be: `abc123def456`
4. **Save this App ID** - you'll need it for the workflow URLs

**Step 4: Create an API Key**
1. In the Data API section, scroll down to **"API Keys"**
2. Click **"Create API Key"**
3. Give it a name (e.g., "n8n KB Sync")
4. Click **"Generate API Key"**
5. **IMPORTANT:** Copy the API key immediately - you can only see it once!
   - It will look like: `abc123def456ghi789jkl012mno345pqr678stu901vwx234yz`
   - This is NOT a connection string - it's a long random string
6. Click **"Done"**

**Step 5: Configure Permissions (Optional but Recommended)**
1. After creating the API key, you can set permissions
2. Click on the API key you just created
3. Under **"Data Source Permissions"**, ensure it has access to:
   - Your cluster (e.g., "Cluster0")
   - Your database (e.g., "adaptmap_vectors")
   - Read/Write permissions for the `knowledge_base_vectors` collection

**Step 6: Update n8n Environment Variables**
1. In n8n, go to **Settings → Environment Variables**
2. Add these variables:
   ```env
   MONGODB_DATA_API_KEY=your-api-key-here
   MONGODB_CLUSTER_NAME=Cluster0
   MONGODB_DATABASE=adaptmap_vectors
   MONGODB_APP_ID=your-app-id-here
   ```
3. Replace:
   - `your-api-key-here` with the API key from Step 4
   - `Cluster0` with your actual cluster name
   - `adaptmap_vectors` with your database name
   - `your-app-id-here` with the App ID from Step 3

**Step 7: Update Workflow Nodes**

**For "Check Existing Vector" node (line 307):**
- Replace `YOUR_APP_ID` in the URL with `{{ $env.MONGODB_APP_ID }}`
- Replace the connection string in `api-key` header with `{{ $env.MONGODB_DATA_API_KEY }}`

**For "Delete Vector" node (line 334):**
- Same changes as above

**Updated Configuration Example:**

**Check Existing Vector Node:**
```json
{
  "parameters": {
    "method": "POST",
    "url": "=https://data.mongodb-api.com/app/{{ $env.MONGODB_APP_ID }}/endpoint/data/v1/action/findOne",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "api-key",
          "value": "={{ $env.MONGODB_DATA_API_KEY }}"
        }
      ]
    },
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={\n  \"dataSource\": \"{{ $env.MONGODB_CLUSTER_NAME }}\",\n  \"database\": \"{{ $env.MONGODB_DATABASE }}\",\n  \"collection\": \"knowledge_base_vectors\",\n  \"filter\": {\"_id\": \"{{ $('Parse Input').first().json.kbItemId }}\"}\n}",
    "options": {}
  }
}
```

**Delete Vector Node:**
```json
{
  "parameters": {
    "method": "POST",
    "url": "=https://data.mongodb-api.com/app/{{ $env.MONGODB_APP_ID }}/endpoint/data/v1/action/deleteOne",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "api-key",
          "value": "={{ $env.MONGODB_DATA_API_KEY }}"
        }
      ]
    },
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={\n  \"dataSource\": \"{{ $env.MONGODB_CLUSTER_NAME }}\",\n  \"database\": \"{{ $env.MONGODB_DATABASE }}\",\n  \"collection\": \"knowledge_base_vectors\",\n  \"filter\": {\"_id\": \"{{ $('Parse Input').first().json.kbItemId }}\"}\n}",
    "options": {}
  }
}
```

**Current (WRONG):**
```json
{
  "name": "api-key",
  "value": "mongodb+srv://adaptmap_vectors:PrnHyJbzerW953Tn@cluster0.hrerykt.mongodb.net/?appName=Cluster0"
}
```

**Should be:**
```json
{
  "name": "api-key",
  "value": "={{ $env.MONGODB_DATA_API_KEY }}"
}
```

**Alternative Approach: If App Services/Data API is Not Available**

If you cannot access App Services or Data API, you can use **MongoDB Driver directly in n8n Code nodes**. This is actually simpler and doesn't require App Services setup.

**For "Check Existing Vector" - Use Code Node:**

Replace the HTTP Request node with a Code node:

```javascript
// Check if document exists in MongoDB
const { MongoClient } = require('mongodb');

const uri = process.env.VECTOR_DATABASE_URI || process.env.DATABASE_URI;
const client = new MongoClient(uri);

async function checkExisting() {
  try {
    await client.connect();
    const db = client.db('adaptmap_vectors'); // Your database name
    const collection = db.collection('knowledge_base_vectors');
    
    const kbItemId = $('Parse Input').first().json.kbItemId;
    const existing = await collection.findOne({ _id: kbItemId });
    
    return {
      json: existing || null
    };
  } catch (error) {
    throw new Error(`Failed to check existing vector: ${error.message}`);
  } finally {
    await client.close();
  }
}

return checkExisting();
```

**For "Delete Vector" - Use Code Node:**

```javascript
// Delete document from MongoDB
const { MongoClient } = require('mongodb');

const uri = process.env.VECTOR_DATABASE_URI || process.env.DATABASE_URI;
const client = new MongoClient(uri);

async function deleteVector() {
  try {
    await client.connect();
    const db = client.db('adaptmap_vectors');
    const collection = db.collection('knowledge_base_vectors');
    
    const kbItemId = $('Parse Input').first().json.kbItemId;
    const result = await collection.deleteOne({ _id: kbItemId });
    
    return {
      json: {
        deleted: result.deletedCount > 0,
        kbItemId: kbItemId,
        deletedCount: result.deletedCount
      }
    };
  } catch (error) {
    throw new Error(`Failed to delete vector: ${error.message}`);
  } finally {
    await client.close();
  }
}

return deleteVector();
```

**Requirements for Code Node Approach:**
- n8n must have MongoDB driver installed (usually comes pre-installed)
- You need `VECTOR_DATABASE_URI` or `DATABASE_URI` environment variable set
- This uses the same connection string as Payload CMS (or a separate one for the vector database)

**Advantages of Code Node Approach:**
- ✅ No App Services setup needed
- ✅ Uses your existing MongoDB connection
- ✅ More direct and simpler
- ✅ Better error handling

**Disadvantages:**
- ⚠️ Requires MongoDB driver in n8n (usually available)
- ⚠️ Slightly more code to maintain

**Troubleshooting:**

- **"Data API not available"**: Make sure you're using MongoDB Atlas (not self-hosted) and have an M10+ cluster
- **"App Services not showing"**: 
  - Check if you're in the correct organization/project
  - Try looking for "Realm" instead of "App Services"
  - Some Atlas accounts may not have App Services enabled
  - **Solution:** Use the Code Node approach above instead
- **"API key not working"**: Verify the API key is copied correctly (no extra spaces), and check permissions
- **"Invalid App ID"**: Make sure you're using the App ID from the Data API endpoint URL, not the app name
- **"Cannot find App Services"**: Use the Code Node alternative approach - it's actually simpler!

### Missing App ID in MongoDB Data API URLs
**Lines 307, 334:** URLs contain placeholder `YOUR_APP_ID` that must be replaced.

**Fix:** Replace with your actual MongoDB Atlas App ID:
- Found in MongoDB Atlas → App Services → Data API → Endpoint URL
- Format: `https://data.mongodb-api.com/app/YOUR_ACTUAL_APP_ID/endpoint/data/v1/action/...`

### Wrong Vector Index Name
**Node: "MongoDB Atlas Vector Store"** - `vectorIndexName` is incorrect.

**Problem:** 
- `_id` is the document ID field (MongoDB's primary key)
- `vectorIndexName` should be the **name of your Vector Search index** (e.g., "vector_index" or "default")

**Fix:** Set `vectorIndexName` to the actual name of your Vector Search index created in MongoDB Atlas.

**How to find it:**
1. Go to MongoDB Atlas → Your Cluster → Atlas Search
2. Find your Vector Search index
3. Use that index name (not "_id")

### Vector Store Mode Issue
**Node: "MongoDB Atlas Vector Store"** - `mode: "insert"` will fail on updates.

**Problem:** Insert mode creates duplicates or fails if document exists.

**Fix:** Change to `"upsert"` if available, or implement delete+insert pattern.

### Metadata Structure Mismatch
**Lines 272-277:** Default Data Loader only sets `kbItemId` in metadata, but Vector Store documents need proper structure.

**Current Issue:**
- Vector Store creates documents with its own structure
- The metadata should include all fields needed for filtering/searching
- The `kbItemId` in metadata is correct, but may need additional fields

**Recommended Metadata:**
```json
{
  "metadata": {
    "metadataValues": [
      {
        "name": "kbItemId",
        "value": "={{ $json.kbItemId }}"
      },
      {
        "name": "category",
        "value": "={{ $json.category }}"
      },
      {
        "name": "status",
        "value": "={{ $json.status }}"
      }
    ]
  }
}
```

### Document ID Identifier Mismatch
**Potential Issue:** Vector Store may use different ID structure than direct MongoDB operations.

**Current Setup:**
- HTTP Request operations use `_id: kbItemId` (Payload document ID) ✅ Correct
- Vector Store uses `vectorIndexName: "_id"` ❌ Wrong (should be index name)
- Vector Store may auto-generate IDs or use metadata

**Fix:** Ensure Vector Store uses `kbItemId` as document ID:
- Check if Vector Store has an option to set document ID
- Or ensure metadata `kbItemId` is used for lookups
- The Vector Store should store documents with `_id` matching the Payload `kbItemId`

### Missing Endpoint Path
**Node: "Update Embedding Metadata"** - Endpoint is missing `/embedding-metadata` path.

**Current:** `https://adaptmap.de/api/knowledge-base-items/{{ id }}`  
**Should be:** `https://adaptmap.de/api/knowledge-base-items/{{ id }}/embedding-metadata`

### Incorrect JSON Body Format
**Node: "Update Embedding Metadata"** - `jsonBody` sends the entire document, but should send only `embeddingMetadata` structure.

**Current (WRONG):**
```json
{
  "_id": "...",
  "title": "...",
  "contentText": "...",
  "embedding": [...],
  // ... entire document
}
```

**Should be:**
```json
{
  "embeddingMetadata": {
    "embedding_id": "{{ $json._id }}",
    "model": "{{ $json.embeddingModel }}",
    "dimensions": {{ $json.embeddingDimensions }},
    "last_synced": "{{ $json.lastSyncedAt }}"
  }
}
```

### Vector Store Flow Issues
**Lines 440-449:** "Prepare Text for Embedding" connects directly to Vector Store, bypassing Token Splitter and Data Loader.

**Problem:** Vector Store needs:
- Text input → Token Splitter → Data Loader → Vector Store
- Embeddings OpenAI connected via `ai_embedding` connection

**Current flow (WRONG):**
```
Prepare Text → Vector Store
```

**Correct flow:**
```
Prepare Text → Token Splitter → Default Data Loader → Vector Store
                                    ↑
                          Embeddings OpenAI (ai_embedding)
```

### Orphaned "Prepare Document" Node
**Lines 160-172, 451-460:** "Prepare Document" node is connected but may not be needed.

**Issue:** 
- Vector Store handles document structure internally
- "Prepare Document" creates a structure that Vector Store may ignore
- The node expects embedding input, but Vector Store generates embeddings itself

**Analysis:** 
- If Vector Store auto-generates embeddings, "Prepare Document" is not needed
- If you need custom document structure, ensure Vector Store accepts it
- Currently, Vector Store output goes to "Prepare Document", which then goes to "Update Embedding Metadata" - this flow may be incorrect

## Issues Found

### 1. **Missing Connection: "Check Existing Vector"**
**Problem:** The "Check If Sync Needed" node references `$('Check Existing Vector')` but this node is not connected in the workflow.

**Fix:** Add connection from "Fetch KB Item from Payload" to "Check Existing Vector" (parallel execution), then connect "Check Existing Vector" to "Check If Sync Needed".

### 2. **Incomplete MongoDB Node Configurations**
**Problem:** Three MongoDB nodes have empty parameters:
- "Delete from Vector DB" (line 80)
- "Check Existing Vector" (line 127)  
- "Upsert to Vector DB" (line 198)

**Fix:** Configure these nodes with proper operations:
- **Delete from Vector DB**: `deleteOne` operation with filter `{ _id: "={{ $('Parse Input').first().json.kbItemId }}" }`
- **Check Existing Vector**: `findOne` operation with filter `{ _id: "={{ $('Parse Input').first().json.kbItemId }}" }`
- **Upsert to Vector DB**: `upsert` operation (if using standard MongoDB node) OR configure Vector Store properly

### 3. **Incorrect Vector Store Flow**
**Problem:** "Prepare Text for Embedding" connects directly to "MongoDB Atlas Vector Store", but the Vector Store needs:
- Embedding connection (from "Embeddings OpenAI")
- Document connection (from "Default Data Loader")

**Current flow (WRONG):**
```
Prepare Text → Vector Store
```

**Correct flow should be:**
```
Prepare Text → Token Splitter → Default Data Loader → Vector Store
                                    ↑
                          Embeddings OpenAI (ai_embedding connection)
```

### 4. **Hardcoded URLs**
**Problem:** URLs are hardcoded to `https://adaptmap.de/api` instead of using environment variables.

**Fix:** Use `{{ $env.PAYLOAD_API_URL }}` or configure via SiteSettings.

### 5. **Wrong Endpoint for Metadata Update**
**Problem:** Node "Update Embedding Metadata" uses base endpoint instead of `/embedding-metadata` endpoint.

**Current:** `https://adaptmap.de/api/knowledge-base-items/{{ id }}`  
**Should be:** `https://adaptmap.de/api/knowledge-base-items/{{ id }}/embedding-metadata`

### 6. **Incorrect Delete Operation**
**Problem:** "Drop Search Index" is used for delete operation, but this:
- Drops the entire search index (affects all documents)
- Should delete the specific document instead

**Fix:** Use "Delete from Vector DB" node with proper configuration, or use Vector Store delete operation.

### 7. **Orphaned "Prepare Document" Node**
**Problem:** "Prepare Document" node is not connected to anything useful. The MongoDB Atlas Vector Store handles document preparation internally.

**Fix:** Either remove this node OR use it to prepare metadata before Vector Store, but Vector Store should handle the document structure.

### 8. **Vector Store Mode**
**Problem:** Vector Store uses `mode: "insert"` which won't update existing documents.

**Fix:** Use `mode: "upsert"` or handle updates separately.

### 9. **Missing "Check Existing Vector" Connection**
**Problem:** "Check Existing Vector" node exists but is not connected to the workflow.

**Fix:** Connect it properly:
```
Fetch KB Item → Check Existing Vector (parallel)
                    ↓
            Check If Sync Needed
```

## Recommended Workflow Structure

### Delete Path:
```
Check Action (delete) → Delete from Vector DB → Format Response → Respond
```

### Sync Path:
```
Check Action (create/update) → Fetch KB Item from Payload
                                    ↓
                            Check Existing Vector (parallel)
                                    ↓
                            Check If Sync Needed
                                    ↓
                            Should Sync?
                    ┌───────────────┴───────────────┐
                    ↓                               ↓
            Format Response (skip)      Prepare Text for Embedding
                                                ↓
                                        Token Splitter
                                                ↓
                                        Default Data Loader
                                                ↓
                                        MongoDB Atlas Vector Store
                                    (with Embeddings OpenAI connected)
                                                ↓
                                        Update Embedding Metadata
                                                ↓
                                        Format Response
                                                ↓
                                        Respond to Webhook
```

## Specific Fixes Needed

### Fix 1: Connect "Check Existing Vector"
Add to connections:
```json
"Fetch KB Item from Payload": {
  "main": [
    [
      {
        "node": "Check Existing Vector",
        "type": "main",
        "index": 0
      },
      {
        "node": "Check If Sync Needed",
        "type": "main",
        "index": 0
      }
    ]
  ]
},
"Check Existing Vector": {
  "main": [
    [
      {
        "node": "Check If Sync Needed",
        "type": "main",
        "index": 0
      }
    ]
  ]
}
```

### Fix 2: Configure MongoDB Nodes

**Delete from Vector DB:**
```json
{
  "operation": "deleteOne",
  "collection": "knowledge_base_vectors",
  "filter": {
    "_id": "={{ $('Parse Input').first().json.kbItemId }}"
  }
}
```

**Check Existing Vector:**
```json
{
  "operation": "findOne",
  "collection": "knowledge_base_vectors",
  "filter": {
    "_id": "={{ $('Parse Input').first().json.kbItemId }}"
  }
}
```

### Fix 3: Fix Vector Store Flow
Change connections:
```json
"Prepare Text for Embedding": {
  "main": [
    [
      {
        "node": "Token Splitter",
        "type": "main",
        "index": 0
      }
    ]
  ]
},
"Token Splitter": {
  "ai_textSplitter": [
    [
      {
        "node": "Default Data Loader",
        "type": "ai_textSplitter",
        "index": 0
      }
    ]
  ]
},
"Default Data Loader": {
  "ai_document": [
    [
      {
        "node": "MongoDB Atlas Vector Store",
        "type": "ai_document",
        "index": 0
      }
    ]
  ]
}
```

### Fix 4: Update URLs
Change hardcoded URLs to use environment variables:
```json
"url": "={{ $env.PAYLOAD_API_URL || 'https://adaptmap.de/api' }}/api/knowledge-base-items/{{ $('Parse Input').first().json.kbItemId }}/api-key"
```

### Fix 5: Fix Metadata Update Endpoint
```json
"url": "={{ $env.PAYLOAD_API_URL || 'https://adaptmap.de/api' }}/api/knowledge-base-items/{{ $('Parse Input').first().json.kbItemId }}/embedding-metadata"
```

### Fix 6: Fix Delete Operation
Remove "Drop Search Index" node and use "Delete from Vector DB" with proper configuration.

### Fix 7: Vector Store Mode
Change to upsert mode:
```json
"mode": "upsert"
```

## MongoDB Node Configuration (For Your n8n Version)

Since your n8n version uses LangChain nodes (MongoDB Atlas Vector Store) instead of standard MongoDB nodes, here's how to configure the three missing operations:

### Operation 1: Check Existing Vector

**Purpose:** Check if a KB item already exists in the vector database before syncing.

**Recommended Solution: Use HTTP Request to MongoDB Atlas Data API**

**Node Type:** `n8n-nodes-base.httpRequest`

**Configuration:**
```json
{
  "parameters": {
    "method": "POST",
    "url": "=https://data.mongodb-api.com/app/YOUR_APP_ID/endpoint/data/v1/action/findOne",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpHeaderAuth",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "api-key",
          "value": "={{ $env.MONGODB_DATA_API_KEY }}"
        }
      ]
    },
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={\n  \"dataSource\": \"{{ $env.MONGODB_CLUSTER_NAME }}\",\n  \"database\": \"{{ $env.MONGODB_DATABASE }}\",\n  \"collection\": \"knowledge_base_vectors\",\n  \"filter\": {\n    \"_id\": \"{{ $('Parse Input').first().json.kbItemId }}\"\n  }\n}",
    "options": {}
  }
}
```

**Environment Variables Needed:**
- `MONGODB_DATA_API_KEY` - MongoDB Atlas Data API key
- `MONGODB_CLUSTER_NAME` - Your cluster name (e.g., "Cluster0")
- `MONGODB_DATABASE` - Your database name

**Alternative:** If your Vector Store node supports search operations, you can use `similaritySearch` with a filter, but HTTP Request is more reliable for exact ID lookups.

### Operation 2: Delete from Vector DB

**Purpose:** Remove a KB item from the vector database when it's deleted or unpublished.

**Recommended Solution: Use HTTP Request to MongoDB Atlas Data API**

**Node Type:** `n8n-nodes-base.httpRequest`

**Configuration:**
```json
{
  "parameters": {
    "method": "POST",
    "url": "=https://data.mongodb-api.com/app/YOUR_APP_ID/endpoint/data/v1/action/deleteOne",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpHeaderAuth",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "api-key",
          "value": "={{ $env.MONGODB_DATA_API_KEY }}"
        }
      ]
    },
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={\n  \"dataSource\": \"{{ $env.MONGODB_CLUSTER_NAME }}\",\n  \"database\": \"{{ $env.MONGODB_DATABASE }}\",\n  \"collection\": \"knowledge_base_vectors\",\n  \"filter\": {\n    \"_id\": \"{{ $('Parse Input').first().json.kbItemId }}\"\n  }\n}",
    "options": {}
  }
}
```

**Note:** Replace "Drop Search Index" node with this HTTP Request node. Dropping an index affects all documents, not just one.

### Operation 3: Upsert to Vector DB

**Purpose:** Insert a new document or update an existing one in the vector database.

**Current Setup:** You're using MongoDB Atlas Vector Store with `mode: "insert"`

**Problem:** `"insert"` mode won't update existing documents - it will fail or create duplicates.

**Solution Options:**

**Option A: Change to Upsert Mode (If Available)**
```json
{
  "parameters": {
    "mode": "upsert",  // Change from "insert" to "upsert"
    "mongoCollection": {
      "__rl": true,
      "value": "knowledge_base_vectors",
      "mode": "name"
    },
    "vectorIndexName": "_id",
    "options": {}
  }
}
```

**Option B: Delete + Insert (Two-Step Process)**
1. First: Delete existing document (if exists) using HTTP Request
2. Second: Insert new document using Vector Store

**Option C: Use HTTP Request for Upsert**
```json
{
  "parameters": {
    "method": "POST",
    "url": "=https://data.mongodb-api.com/app/YOUR_APP_ID/endpoint/data/v1/action/replaceOne",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpHeaderAuth",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "api-key",
          "value": "={{ $env.MONGODB_DATA_API_KEY }}"
        }
      ]
    },
    "sendBody": true,
    "specifyBody": "json",
    "jsonBody": "={\n  \"dataSource\": \"{{ $env.MONGODB_CLUSTER_NAME }}\",\n  \"database\": \"{{ $env.MONGODB_DATABASE }}\",\n  \"collection\": \"knowledge_base_vectors\",\n  \"filter\": {\n    \"_id\": \"{{ $json._id }}\"\n  },\n  \"replacement\": {{ $json }},\n  \"upsert\": true\n}",
    "options": {}
  }
}
```

**Note:** Option C requires preparing the full document with embedding before the HTTP Request. Your current Vector Store approach handles embeddings automatically, so Option A or B is recommended.

### MongoDB Atlas Data API Setup

To use the HTTP Request approach for Check and Delete operations:

1. **Enable MongoDB Atlas Data API:**
   - Go to MongoDB Atlas → App Services → Data API
   - Enable Data API for your cluster
   - Create an API key

2. **Get Your App ID:**
   - Found in the Data API endpoint URL
   - Format: `https://data.mongodb-api.com/app/YOUR_APP_ID/endpoint/...`

3. **Set Environment Variables in n8n:**
   ```env
   MONGODB_DATA_API_KEY=your-api-key
   MONGODB_CLUSTER_NAME=Cluster0  # Your cluster name
   MONGODB_DATABASE=your-database-name
   ```

## Questions to Consider

1. **Do you want to use MongoDB Atlas Vector Store node or manual MongoDB operations?**
   - Vector Store node: Handles embeddings automatically, but less control
   - Manual MongoDB: More control, but need to handle embeddings yourself
   - **Recommendation:** Use Vector Store for inserts (handles embeddings), HTTP Request for check/delete (exact operations)

2. **Should "Prepare Document" node be removed?**
   - Vector Store handles document structure internally
   - Only needed if you want to add custom metadata
   - **Current status:** Not connected, can be removed or used for metadata

3. **How should updates work?**
   - Vector Store upsert mode? (Try changing mode to "upsert")
   - Delete + insert? (Two-step: delete if exists, then insert new)
   - Manual MongoDB update? (HTTP Request with replaceOne)
   - **Recommendation:** Try upsert mode first, fall back to delete+insert if not available

## Summary

### Critical Fixes Needed (Security & Functionality)
1. 🔴 **SECURITY:** Replace MongoDB connection string with proper Data API key in HTTP Request nodes
2. 🔴 **Fix MongoDB Data API URLs:** Replace `YOUR_APP_ID` with actual App ID
3. 🔴 **Fix Vector Index Name:** Change `vectorIndexName: "_id"` to actual index name
4. 🔴 **Fix Vector Store Mode:** Change `mode: "insert"` to `"upsert"` or implement delete+insert
5. 🔴 **Fix Update Metadata Endpoint:** Add `/embedding-metadata` path
6. 🔴 **Fix Update Metadata Body:** Send only `embeddingMetadata` structure, not entire document
7. 🔴 **Fix Vector Store Flow:** Connect Token Splitter → Data Loader → Vector Store (not direct)

### Important Improvements
8. ✅ Proper connections for "Check Existing Vector" (✅ Connected correctly)
9. ✅ Complete MongoDB node configurations (✅ Using HTTP Request - good!)
10. ⚠️ **Vector Store flow:** Needs Token Splitter → Data Loader chain
11. ⚠️ **Environment variables:** URLs should use env vars instead of hardcoded
12. ⚠️ **Metadata structure:** Add more metadata fields (category, status) for better filtering
13. ⚠️ **Document ID consistency:** Ensure Vector Store uses `kbItemId` as `_id`

### What's Working Well
- ✅ "Check Existing Vector" and "Delete Vector" use HTTP Request (correct approach)
- ✅ Connections are properly set up
- ✅ "Check If Sync Needed" logic is sound
- ✅ Using LangChain nodes is appropriate for your n8n version

### Priority Actions
1. **IMMEDIATE:** Fix security issue (API key) and MongoDB URLs
2. **HIGH:** Fix Vector Store configuration (index name, mode, flow)
3. **MEDIUM:** Fix Update Metadata endpoint and body format
4. **LOW:** Add environment variables for URLs, enhance metadata

The LangChain nodes (Vector Store, Embeddings, Data Loader, Token Splitter) are a good choice for your n8n version - they handle a lot of the complexity automatically. However, the configuration needs corrections for metadata, indexes, and identifiers to work properly.

