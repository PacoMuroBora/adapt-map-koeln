# n8n Environment Variables Setup

## How n8n Accesses Environment Variables

n8n can access environment variables in two ways:

1. **Via `$env.VARIABLE_NAME` in expressions** - Direct access in node expressions
2. **Via n8n's environment configuration** - Set in n8n's `.env` file or environment

## For MongoDB Connection (VECTOR_DATABASE_URI)

You have **two options**:

### Option 1: Use Environment Variable (Recommended)

**Pros:**
- Centralized configuration
- Easy to change without editing workflows
- Works well with Docker/container deployments

**How to set it up:**

1. **Add to n8n's environment:**
   - If running n8n via Docker: Add to `docker-compose.yml` or `.env` file
   - If running n8n directly: Add to system environment or n8n's `.env` file

2. **Use in workflow:**
   - In MongoDB nodes, you can use a **Code node** to extract the connection string
   - Or use **HTTP Request** node with MongoDB REST API (if available)
   - Or configure MongoDB node to use connection string from environment

**Example in Code node:**
```javascript
const connectionString = process.env.VECTOR_DATABASE_URI;
// Parse connection string and use in MongoDB operations
```

**However:** The MongoDB node in n8n typically expects **credentials**, not connection strings directly.

### Option 2: Create MongoDB Credential (Easier)

**Pros:**
- Works directly with n8n's MongoDB node
- No code needed
- Secure credential storage

**How to set it up:**

1. In n8n, go to **Credentials** → **Add Credential**
2. Select **MongoDB**
3. Choose **Connection String** option
4. Enter your `VECTOR_DATABASE_URI` value
5. Name it (e.g., "MongoDB Vector DB")
6. Use this credential in MongoDB nodes

**This is the recommended approach** because:
- n8n's MongoDB node is designed to work with credentials
- Easier to configure and maintain
- Secure storage of connection strings

## Required Environment Variables for n8n

Based on the workflows, you need these environment variables:

### For AI Recommendation Workflow
- `N8N_DOMAIN` (optional, defaults to `https://n8n.adaptmap.de`)
- `N8N_INTERNAL_URL` (optional, defaults to `http://localhost:5678` for production)

### For KB Sync Workflow
- `PAYLOAD_API_URL` - Payload CMS API URL (e.g., `https://adaptmap.de/api`)
- `PAYLOAD_KEY` - Payload CMS API key for authentication
- `EMBEDDING_MODEL` - Embedding model name (e.g., `text-embedding-3-small`)
- `OPENAI_API_KEY` - OpenAI API key (stored as credential, not env var)

### For MongoDB Connection
- `VECTOR_DATABASE_URI` - MongoDB connection string for vector database

## Recommended Setup

### 1. Environment Variables (in n8n's environment)

```env
# n8n/.env or docker-compose.yml
PAYLOAD_API_URL=https://adaptmap.de/api
PAYLOAD_KEY=your-payload-api-key
EMBEDDING_MODEL=text-embedding-3-small
VECTOR_DATABASE_URI=mongodb+srv://user:pass@cluster.mongodb.net/adaptmap_vectors?retryWrites=true&w=majority
```

### 2. Credentials (in n8n UI)

- **MongoDB** - Use `VECTOR_DATABASE_URI` value
- **OpenAI API** - Your OpenAI API key
- **HTTP Header Auth** (for Payload API) - Use `PAYLOAD_KEY`

## Accessing Environment Variables in Workflows

### In Expressions
```javascript
// Access env var
{{ $env.VECTOR_DATABASE_URI }}

// Use in HTTP Request URL
{{ $env.PAYLOAD_API_URL }}/api/knowledge-base-items/{{ $json.kbItemId }}

// Use in headers
Bearer {{ $env.PAYLOAD_KEY }}
```

### In Code Nodes
```javascript
// Access via process.env
const dbUri = process.env.VECTOR_DATABASE_URI;
const apiUrl = process.env.PAYLOAD_API_URL;
```

## Updating the KB Sync Workflow

The workflow currently uses MongoDB credentials. To use your `VECTOR_DATABASE_URI` environment variable instead:

1. **Option A (Recommended):** Create a MongoDB credential with your `VECTOR_DATABASE_URI` value
2. **Option B:** Modify the workflow to use a Code node that extracts the connection string from `process.env.VECTOR_DATABASE_URI` and constructs MongoDB operations

**I recommend Option A** - it's simpler and works better with n8n's MongoDB node.

## Summary

✅ **For `VECTOR_DATABASE_URI`:** Create a MongoDB credential in n8n with this value  
✅ **For other env vars:** Use `$env.VARIABLE_NAME` in expressions or `process.env.VARIABLE_NAME` in code nodes  
✅ **For API keys:** Store as credentials (more secure)  

The MongoDB node in n8n works best with credentials, so create a credential for your `VECTOR_DATABASE_URI`.

