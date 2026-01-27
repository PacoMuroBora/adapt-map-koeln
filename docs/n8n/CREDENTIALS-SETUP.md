# n8n Credentials Setup Guide

After resetting n8n, you need to recreate the credentials for your workflows. This guide shows how to set up each credential.

## Required Credentials

### 1. Payload API Key (HTTP Header Auth)

**Used by:**
- "Fetch KB Item from Payload" node
- "Update Embedding Metadata" node

**Steps:**

1. In n8n, go to **Credentials** → **Add Credential**
2. Search for **"HTTP Header Auth"** or **"Header Auth"**
3. Click **Create**
4. Fill in:
   - **Name:** `Payload API key`
   - **Header Name:** `Authorization`
   - **Header Value:** `Bearer YOUR_PAYLOAD_KEY`
     - Replace `YOUR_PAYLOAD_KEY` with your actual `PAYLOAD_KEY` from your environment variables
     - Example: `Bearer abc123def456...`
5. Click **Save**

**Where to find PAYLOAD_KEY:**
- Check your `.env` file or environment variables
- Or check Payload CMS settings
- It's the same key used in your docker-compose environment variables

---

### 2. MongoDB Atlas (MongoDB Credential)

**Used by:**
- "MongoDB Atlas Vector Store" node

**Steps:**

1. In n8n, go to **Credentials** → **Add Credential**
2. Search for **"MongoDB"**
3. Click **Create**
4. Choose **"Connection String"** option
5. Fill in:
   - **Name:** `MongoDB vectors`
   - **Connection String:** Your MongoDB Atlas connection string
     - Format: `mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority`
     - Use the same connection string as your `VECTOR_DATABASE_URI` environment variable
     - Example: `mongodb+srv://adaptmap_vectors:password@cluster0.hrerykt.mongodb.net/adaptmap_vectors?appName=Cluster0`
6. Click **Test Connection** to verify
7. Click **Save**

**Where to find MongoDB connection string:**
- Check your `VECTOR_DATABASE_URI` environment variable
- Or get it from MongoDB Atlas → Connect → Drivers → Connection String
- Make sure the user has proper permissions (see `MONGODB-PERMISSIONS-FIX.md`)

---

### 3. OpenAI API Key (Optional - if not already set)

**Used by:**
- "Embeddings OpenAI" node

**Steps:**

1. In n8n, go to **Credentials** → **Add Credential**
2. Search for **"OpenAI"**
3. Click **Create**
4. Fill in:
   - **Name:** `Soter Studio Key` (or your preferred name)
   - **API Key:** Your OpenAI API key
5. Click **Save**

**Where to find OpenAI API key:**
- https://platform.openai.com/api-keys
- Create a new key if needed

---

## After Creating Credentials

1. **Import your workflows:**
   - Go to **Workflows** → **Import from File**
   - Import `Knowledge Base Sync.json` and `AdaptMap AI Recommendation.json`

2. **Verify credential assignments:**
   - Open each workflow
   - Check nodes that use credentials:
     - "Fetch KB Item from Payload" → Should use "Payload API key"
     - "MongoDB Atlas Vector Store" → Should use "MongoDB vectors"
     - "Embeddings OpenAI" → Should use "Soter Studio Key"
   - If credentials show as missing, click the node and select the correct credential

3. **Test the workflows:**
   - Activate the workflows
   - Test with a sample webhook call
   - Check logs for any credential errors

---

## Troubleshooting

### Credential Not Found Error

If a node shows "Credential not found":
1. Click on the node
2. In the credentials dropdown, select the credential you just created
3. Save the workflow

### MongoDB Connection Failed

- Verify the connection string is correct
- Check MongoDB Atlas network access (IP whitelist)
- Verify user permissions (see `MONGODB-PERMISSIONS-FIX.md`)
- Test connection in n8n credential setup

### Payload API Authentication Failed

- Verify `PAYLOAD_KEY` is correct
- Check the header format: `Bearer YOUR_KEY` (with space)
- Verify the key matches your Payload CMS environment variable
- Test by calling the API endpoint manually:
  ```bash
  curl -H "Authorization: Bearer YOUR_KEY" https://adaptmap.de/api/knowledge-base-items/SOME_ID/api-key
  ```

---

## Credential IDs (Reference)

The workflows reference these credential IDs, but you don't need to match them. n8n will automatically assign new IDs when you:
1. Create the credentials with the correct names
2. Import the workflows
3. Re-assign credentials in each node

**Original IDs (for reference only):**
- Payload API key: `TwK5iljrSjFmglvT`
- MongoDB vectors: `71ZabfZ1nhAOCJRf`
- Soter Studio Key: `AmDv0XgXbiVbFCU1`
