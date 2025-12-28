# Payload CMS API Key Authentication Setup

## Overview

Payload CMS uses JWT tokens for authentication by default, but for server-to-server communication (like n8n workflows), we've added API key authentication support.

## Setup

### 1. Set Environment Variable

Add `PAYLOAD_KEY` to your environment variables:

```env
PAYLOAD_KEY=your-secure-random-api-key-here
```

**Generate a secure key:**
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32
```

### 2. Available Endpoints

The following endpoints support API key authentication:

#### Get KB Item
- **URL:** `/api/knowledge-base-items/:id/api-key`
- **Method:** `GET`
- **Headers:** `Authorization: Bearer <PAYLOAD_KEY>`
- **Response:** Full KB item object

#### Update KB Item Embedding Metadata
- **URL:** `/api/knowledge-base-items/:id/embedding-metadata`
- **Method:** `PATCH`
- **Headers:** `Authorization: Bearer <PAYLOAD_KEY>`
- **Body:** 
  ```json
  {
    "embeddingMetadata": {
      "embedding_id": "string",
      "model": "string",
      "dimensions": 1536,
      "last_synced": "2024-01-01T00:00:00.000Z"
    }
  }
  ```

### 3. Standard Payload API

The standard Payload REST API endpoints (`/api/knowledge-base-items/:id`) still require JWT authentication. For n8n, you have two options:

**Option A: Use Custom API Key Endpoints (Recommended)**
- Use `/api/knowledge-base-items/:id/api-key` for fetching
- Use `/api/knowledge-base-items/:id/embedding-metadata` for updating metadata
- Simpler - just set `PAYLOAD_KEY` env var

**Option B: Use JWT Tokens**
- Create a service account user in Payload CMS
- Generate a JWT token for that user
- Use standard endpoints with `Authorization: JWT <token>`
- More complex - requires user management

## n8n Configuration

### Environment Variables

Add to n8n's environment:

```env
PAYLOAD_API_URL=https://adaptmap.de/api
PAYLOAD_KEY=your-secure-api-key-here
```

### HTTP Request Node Configuration

**For fetching KB items:**
- **URL:** `{{ $env.PAYLOAD_API_URL }}/api/knowledge-base-items/{{ $json.kbItemId }}/api-key`
- **Method:** `GET`
- **Headers:**
  - `Authorization: Bearer {{ $env.PAYLOAD_KEY }}`

**For updating metadata:**
- **URL:** `{{ $env.PAYLOAD_API_URL }}/api/knowledge-base-items/{{ $json.kbItemId }}/embedding-metadata`
- **Method:** `PATCH`
- **Headers:**
  - `Authorization: Bearer {{ $env.PAYLOAD_KEY }}`
  - `Content-Type: application/json`
- **Body:**
  ```json
  {
    "embeddingMetadata": {
      "embedding_id": "{{ $json._id }}",
      "model": "{{ $env.EMBEDDING_MODEL }}",
      "dimensions": {{ $json.embeddingDimensions }},
      "last_synced": "{{ $json.lastSyncedAt }}"
    }
  }
  ```

## Security Considerations

1. **Keep API key secret** - Never commit to version control
2. **Use strong keys** - Generate with crypto.randomBytes(32)
3. **Rotate regularly** - Change keys periodically
4. **Limit access** - Only grant to trusted services (n8n)
5. **Monitor usage** - Log API key access for auditing

## Testing

### Test API Key Authentication

```bash
curl -X GET \
  https://adaptmap.de/api/knowledge-base-items/YOUR_KB_ITEM_ID/api-key \
  -H "Authorization: Bearer YOUR_PAYLOAD_KEY"
```

### Test Metadata Update

```bash
curl -X PATCH \
  https://adaptmap.de/api/knowledge-base-items/YOUR_KB_ITEM_ID/embedding-metadata \
  -H "Authorization: Bearer YOUR_PAYLOAD_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "embeddingMetadata": {
      "embedding_id": "test-id",
      "model": "text-embedding-3-small",
      "dimensions": 1536,
      "last_synced": "2024-01-01T00:00:00.000Z"
    }
  }'
```

## Troubleshooting

### 401 Unauthorized
- Check `PAYLOAD_KEY` is set correctly
- Verify Authorization header format: `Bearer <key>`
- Ensure key matches in both Payload and n8n

### 500 Internal Server Error
- Check `PAYLOAD_KEY` is set in Payload environment
- Verify endpoint paths are correct

### 404 Not Found
- Verify KB item ID exists
- Check endpoint path is correct (`/api-key` suffix for fetching)

## Alternative: JWT Token Authentication

If you prefer to use JWT tokens instead of API keys:

1. **Create service account user** in Payload CMS admin
2. **Generate JWT token:**
   ```typescript
   import { getPayload } from 'payload'
   import config from '@payload-config'
   
   const payload = await getPayload({ config })
   const token = await payload.auth.generateJWT({
     id: 'service-account-user-id',
     collection: 'users',
   })
   ```
3. **Use standard endpoints** with `Authorization: JWT <token>`

However, API key authentication is simpler for server-to-server communication.

