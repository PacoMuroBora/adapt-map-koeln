# Alternative Solutions for Vector Search Permissions

## The Issue

`listSearchIndexes` is not available as a custom action in MongoDB Atlas UI. This is because Atlas Search permissions are handled differently.

## Solution 1: Use Built-in Role (Recommended)

The `readWrite` or `read` built-in roles should include the necessary permissions for vector search queries.

1. **MongoDB Atlas** → **Database Access** → Find your user
2. Click **Edit**
3. Under **Built-in Role**, ensure you have:
   - **`readWrite`** role on `adaptmap_vectors` database
   - This should include permissions for vector search queries

4. **Remove any custom roles** that might be conflicting
5. **Save** and wait 1-2 minutes

## Solution 2: Verify Vector Search Index

The error might occur if the index doesn't exist or isn't active:

1. **MongoDB Atlas** → Your Cluster → **Atlas Search**
2. Verify `vector_index` exists and status is **"Active"** (not "Building" or "Failed")
3. If missing or failed, recreate it

## Solution 3: Check n8n Node Configuration

The n8n MongoDB Atlas Vector Store node might need specific configuration:

1. **Vector Index Name**: Must match exactly (case-sensitive)
   - Check in Atlas Search tab what the index is actually named
   - Common names: `vector_index`, `default`, or custom name

2. **Collection Name**: Must match exactly
   - Should be `knowledge_base_vectors`

3. **Database Name**: Should be `adaptmap_vectors`

## Solution 4: Use Different Connection Method

If the n8n node is causing issues, you might need to:

1. Check if you're using the correct MongoDB connection string
2. Ensure the connection string includes the database name: `mongodb+srv://.../adaptmap_vectors`
3. Try using a different MongoDB user with `readWrite` built-in role only

## Solution 5: Check Cluster Tier

Vector Search requires:
- **M10+ cluster** (shared or dedicated)
- **Serverless instances** (but not M0 free tier)

If you're on M0, you need to upgrade.

## Debugging Steps

1. **Test Vector Search in Atlas UI:**
   - Go to **Atlas Search** → Your index → **Test Search**
   - Try a simple query to verify the index works

2. **Check n8n Node Error Details:**
   - Look at the full error message
   - It might indicate a different issue (index name, collection name, etc.)

3. **Verify Credentials:**
   - Make sure the MongoDB user in n8n credentials matches the user you're editing
   - Check if connection string is correct

## Most Likely Solution

Based on your permissions list, you have a custom role with many actions. Try:

1. **Add Built-in Role** `readWrite` to your user (in addition to custom role)
2. Or **replace custom role** with built-in `readWrite` role temporarily to test
3. Built-in roles often include implicit permissions for Atlas Search that aren't visible in the UI

The `readWrite` built-in role should include all necessary permissions for vector search operations, even if `listSearchIndexes` isn't explicitly listed.

