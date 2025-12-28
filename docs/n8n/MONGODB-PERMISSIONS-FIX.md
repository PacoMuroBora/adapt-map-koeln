# MongoDB Atlas Permissions Fix for Vector Search

## Problem

Error: **"user is not allowed to list search indexes"**

This occurs when using MongoDB Atlas Vector Store in `load` mode (for retrieval/search) because the database user doesn't have the required permissions to list and query search indexes.

## Solution

### Option 1: Update MongoDB User Permissions (Recommended)

1. Go to MongoDB Atlas → **Database Access**
2. Find your database user (the one used in n8n credentials)
3. Click **Edit** on the user
4. Under **Built-in Role**, ensure the user has:
   - **`readWrite`** role on the `adaptmap_vectors` database
   - OR **`read`** role if you only need to query (not write)

5. For Vector Search specifically, you **MUST** add a **Custom Role** with `listSearchIndexes`:
   - Go to **Database Access** → **Custom Roles** → **Add Custom Role** (or edit existing)
   - Name: `vectorSearchReader` (or add to existing role)
   - Add the following action:
     ```
     Action: listSearchIndexes
     Resources: adaptmap_vectors (all collections)
     ```
   - **Important:** `listSearchIndexes` is different from `listIndexes` - you need the Search-specific one
   - If creating new role, also add:
     ```
     Actions:
     - listSearchIndexes (REQUIRED for vector search)
     - find (you already have this)
     ```
   - Resources: `adaptmap_vectors` (all collections)
   - Assign this custom role to your database user (in addition to existing roles)

### Option 2: Use a Different Database User

Create a dedicated user for n8n with proper permissions:

1. **Database Access** → **Add New Database User**
2. **Authentication Method**: Password
3. **Database User Privileges**: 
   - **Built-in Role**: `readWrite` on `adaptmap_vectors` database
   - **Custom Role** (if needed): `vectorSearchReader` (from Option 1)
4. **Network Access**: Add n8n server IP or `0.0.0.0/0` (less secure, but works)
5. Update n8n MongoDB credentials with new user

### Option 3: Verify Vector Search Index Exists

The error can also occur if the vector search index doesn't exist:

1. Go to MongoDB Atlas → Your Cluster → **Atlas Search**
2. Verify that `vector_index` exists and is **Active**
3. If missing, create it:
   - **Create Search Index** → **Vector Search**
   - Index Name: `vector_index`
   - Configuration:
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

## Verification

After updating permissions, test the workflow:

1. The **MongoDB Atlas Vector Store** node should successfully retrieve documents
2. No "list search indexes" error
3. Vector search returns relevant KB items

## Notes

- **Insert mode** (used in sync workflow) requires `readWrite` permissions
- **Load mode** (used in recommendation workflow) requires `read` + `listSearchIndexes` permissions
- Both workflows use the same credentials, but different operations need different permissions
- If you can't modify permissions, contact your MongoDB Atlas admin

