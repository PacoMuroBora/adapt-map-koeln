'use client'

import { useState } from 'react'
import { Button } from '@payloadcms/ui'

/**
 * Excel Upload Component for Knowledge Base Items
 * 
 * Allows admins to bulk import Knowledge Base items from Excel files.
 * Supports all KnowledgeBaseItems collection fields with automatic normalization.
 */
const ExcelUpload = () => {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    imported?: number
    errors?: string[]
  } | null>(null)
  const [syncResult, setSyncResult] = useState<{
    success: boolean
    message: string
    synced?: number
    skipped?: number
    errors?: string[]
  } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      const ext = selectedFile.name.split('.').pop()?.toLowerCase()
      if (ext === 'xlsx' || ext === 'xls') {
        setFile(selectedFile)
        setResult(null)
      } else {
        setResult({
          success: false,
          message: 'Please select a valid Excel file (.xlsx or .xls)',
        })
      }
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setResult({
        success: false,
        message: 'Please select a file first',
      })
      return
    }

    setUploading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      // Use relative path - cookies will be sent automatically
      const response = await fetch('/api/knowledge-base/import-excel', {
        method: 'POST',
        body: formData,
        credentials: 'include', // Include cookies for authentication
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: data.message || 'Import completed successfully',
          imported: data.imported,
          errors: data.errors,
        })
        setFile(null)
        // Reset file input
        const fileInput = document.getElementById('excel-file-input') as HTMLInputElement
        if (fileInput) fileInput.value = ''
      } else {
        setResult({
          success: false,
          message: data.error || 'Import failed',
          errors: data.errors,
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Upload failed',
      })
    } finally {
      setUploading(false)
    }
  }

  const handleSyncUnsynced = async () => {
    setSyncing(true)
    setSyncResult(null)

    try {
      const response = await fetch('/api/knowledge-base/sync-unsynced', {
        method: 'POST',
        credentials: 'include',
      })

      const data = await response.json()

      if (response.ok) {
        setSyncResult({
          success: true,
          message: data.message || 'Sync completed successfully',
          synced: data.synced,
          skipped: data.skipped,
          errors: data.errors,
        })
      } else {
        setSyncResult({
          success: false,
          message: data.error || 'Sync failed',
          errors: data.errors,
        })
      }
    } catch (error) {
      setSyncResult({
        success: false,
        message: error instanceof Error ? error.message : 'Sync failed',
      })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div
      style={{
        padding: 'var(--base)',
        border: '1px solid var(--theme-border-color)',
        borderRadius: 'var(--border-radius-m)',
        backgroundColor: 'var(--theme-elevation-50)',
      }}
    >
      <h3 style={{ marginBottom: 'var(--base)', fontSize: '1.1rem', fontWeight: 600 }}>
        Import Knowledge Base Items from Excel
      </h3>
      <p
        style={{
          marginBottom: 'var(--base)',
          color: 'var(--theme-text-secondary)',
          fontSize: '0.9rem',
        }}
      >
        Upload an Excel file (.xlsx or .xls) to bulk import knowledge base items. The file should
        contain columns matching the KnowledgeBaseItems collection fields.
      </p>

      <div
        style={{
          marginBottom: 'var(--base)',
          padding: 'var(--base)',
          backgroundColor: 'var(--theme-elevation-100)',
          borderRadius: 'var(--border-radius-s)',
          border: '1px solid var(--theme-border-color)',
        }}
      >
        <div style={{ marginBottom: 'calc(var(--base) / 2)', fontSize: '0.9rem', fontWeight: 500 }}>
          RAG Pattern Ingestion
        </div>
        <p
          style={{
            marginBottom: 'var(--base)',
            color: 'var(--theme-text-secondary)',
            fontSize: '0.85rem',
          }}
        >
          Sync all knowledge base items that haven't been synced to the vector database yet. Only
          published items will be synced.
        </p>
        <Button onClick={handleSyncUnsynced} disabled={syncing} size="small">
          {syncing ? 'Syncing...' : 'Sync Unsynced Items'}
        </Button>
      </div>

      <div style={{ display: 'flex', gap: 'var(--base)', alignItems: 'flex-end', marginBottom: 'var(--base)' }}>
        <div style={{ flex: 1 }}>
          <label
            htmlFor="excel-file-input"
            style={{
              display: 'block',
              marginBottom: 'calc(var(--base) / 2)',
              fontSize: '0.9rem',
              fontWeight: 500,
            }}
          >
            Select Excel File
          </label>
          <input
            id="excel-file-input"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            disabled={uploading}
            style={{
              width: '100%',
              padding: 'calc(var(--base) / 2)',
              border: '1px solid var(--theme-border-color)',
              borderRadius: 'var(--border-radius-s)',
            }}
          />
        </div>
        <Button onClick={handleUpload} disabled={!file || uploading} size="small">
          {uploading ? 'Uploading...' : 'Upload & Import'}
        </Button>
      </div>

      {file && (
        <div
          style={{
            padding: 'calc(var(--base) / 2)',
            backgroundColor: 'var(--theme-elevation-100)',
            borderRadius: 'var(--border-radius-s)',
            marginBottom: 'var(--base)',
            fontSize: '0.9rem',
          }}
        >
          Selected: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(2)} KB)
        </div>
      )}

      {result && (
        <div
          style={{
            padding: 'var(--base)',
            borderRadius: 'var(--border-radius-s)',
            backgroundColor: result.success
              ? 'var(--color-success-50)'
              : 'var(--color-error-50)',
            border: `1px solid ${result.success ? 'var(--color-success-200)' : 'var(--color-error-200)'}`,
            color: result.success ? 'var(--color-success-900)' : 'var(--color-error-900)',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: result.imported || result.errors ? 'calc(var(--base) / 2)' : 0 }}>
            {result.success ? '✓ Success' : '✗ Error'}
          </div>
          <div style={{ marginBottom: result.imported || result.errors ? 'calc(var(--base) / 2)' : 0 }}>
            {result.message}
          </div>
          {result.imported !== undefined && (
            <div style={{ marginBottom: result.errors ? 'calc(var(--base) / 2)' : 0 }}>
              Imported: <strong>{result.imported}</strong> items
            </div>
          )}
          {result.errors && result.errors.length > 0 && (
            <div>
              <div style={{ fontWeight: 600, marginBottom: 'calc(var(--base) / 2)' }}>Errors:</div>
              <ul style={{ margin: 0, paddingLeft: 'var(--base)', fontSize: '0.9rem' }}>
                {result.errors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {syncResult && (
        <div
          style={{
            padding: 'var(--base)',
            borderRadius: 'var(--border-radius-s)',
            backgroundColor: syncResult.success
              ? 'var(--color-success-50)'
              : 'var(--color-error-50)',
            border: `1px solid ${syncResult.success ? 'var(--color-success-200)' : 'var(--color-error-200)'}`,
            color: syncResult.success ? 'var(--color-success-900)' : 'var(--color-error-900)',
            marginBottom: 'var(--base)',
          }}
        >
          <div
            style={{
              fontWeight: 600,
              marginBottom: syncResult.synced !== undefined || syncResult.errors ? 'calc(var(--base) / 2)' : 0,
            }}
          >
            {syncResult.success ? '✓ Sync Complete' : '✗ Sync Error'}
          </div>
          <div style={{ marginBottom: syncResult.synced !== undefined || syncResult.errors ? 'calc(var(--base) / 2)' : 0 }}>
            {syncResult.message}
          </div>
          {syncResult.synced !== undefined && (
            <div style={{ marginBottom: syncResult.errors ? 'calc(var(--base) / 2)' : 0 }}>
              Synced: <strong>{syncResult.synced}</strong> items
              {syncResult.skipped !== undefined && syncResult.skipped > 0 && (
                <> | Skipped: <strong>{syncResult.skipped}</strong> items</>
              )}
            </div>
          )}
          {syncResult.errors && syncResult.errors.length > 0 && (
            <div>
              <div style={{ fontWeight: 600, marginBottom: 'calc(var(--base) / 2)' }}>Errors:</div>
              <ul style={{ margin: 0, paddingLeft: 'var(--base)', fontSize: '0.9rem' }}>
                {syncResult.errors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <details
        style={{
          marginTop: 'var(--base)',
          padding: 'var(--base)',
          backgroundColor: 'var(--theme-elevation-100)',
          borderRadius: 'var(--border-radius-s)',
          fontSize: '0.85rem',
        }}
      >
        <summary style={{ cursor: 'pointer', fontWeight: 500, marginBottom: 'calc(var(--base) / 2)' }}>
          Expected Excel Columns (Exact Order Required)
        </summary>
        <div style={{ marginTop: 'calc(var(--base) / 2)', lineHeight: '1.6' }}>
          <p>
            <strong>Important:</strong> Your Excel file must have columns in this exact order (column names can vary, but order matters):
          </p>
          <ol style={{ margin: 'calc(var(--base) / 2) 0', paddingLeft: 'var(--base)' }}>
            <li>
              <strong>Company</strong> - Company name, or tip prefixed with "Tipp: " (e.g., "Tipp: Use shading during hot hours")
            </li>
            <li>
              <strong>theme</strong> - Theme dropdown value (e.g., "hitzeschutz von Gebäuden" or "hitzeschutz von Gebaeuden" both work)
            </li>
            <li>
              <strong>discription</strong> - Detailed description (note: typo in column name is expected)
            </li>
            <li>
              <strong>probleme die gelöst werden</strong> - Problems solved by the solution
            </li>
            <li>
              <strong>location</strong> - Company location
            </li>
            <li>
              <strong>additional context</strong> - Contextual number
            </li>
            <li>
              <strong>solution_type</strong> - Type of solution
            </li>
            <li>
              <strong>links</strong> - Company/product website URL
            </li>
            <li>
              <strong>categories</strong> - Comma-separated list of categories
            </li>
            <li>
              <strong>use_case</strong> - Primary use case
            </li>
            <li>
              <strong>applicable_when</strong> - When solution is applicable
            </li>
            <li>
              <strong>keywords</strong> - Comma-separated list of keywords
            </li>
          </ol>
          <p style={{ marginTop: 'var(--base)', fontStyle: 'italic', fontSize: '0.9rem' }}>
            Note: All items will be imported with status "draft" by default. You can publish them individually after import.
          </p>
        </div>
      </details>
    </div>
  )
}

export default ExcelUpload
