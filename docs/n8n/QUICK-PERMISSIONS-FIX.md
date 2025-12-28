# Quick Fix: Add listSearchIndexes Permission

## The Problem

You have `listIndexes` but need `listSearchIndexes` for Atlas Vector Search.

## Quick Steps

1. **MongoDB Atlas** → **Database Access** → **Custom Roles**

2. **Option A: Edit Existing Custom Role**
   - Find your existing custom role
   - Click **Edit**
   - Click **Add Action**
   - Search for: `listSearchIndexes`
   - Select it
   - Resources: `adaptmap_vectors` → **All Collections**
   - Click **Update Role**

3. **Option B: Create New Custom Role**
   - Click **Add Custom Role**
   - Name: `vectorSearchAccess`
   - Click **Add Action**
   - Search for: `listSearchIndexes`
   - Select it
   - Resources: `adaptmap_vectors` → **All Collections**
   - Click **Add Custom Role**

4. **Assign Role to User**
   - Go to **Database Access** → Find your user
   - Click **Edit**
   - Under **Database User Privileges**, click **Add Custom Role**
   - Select the role you just created/edited
   - Click **Update User**

5. **Test**
   - Wait 1-2 minutes for permissions to propagate
   - Run your n8n workflow again
   - The "list search indexes" error should be gone

## What's the Difference?

- `listIndexes` = Lists regular MongoDB database indexes (you have this)
- `listSearchIndexes` = Lists Atlas Search indexes (you need this for vector search)

These are different permission types in MongoDB Atlas.

