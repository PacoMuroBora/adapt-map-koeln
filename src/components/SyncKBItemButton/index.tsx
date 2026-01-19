'use client'

import { useState } from 'react'
import { useDocumentInfo, useAuth } from '@payloadcms/ui'
import { Button } from '@payloadcms/ui'
import type { UIFieldClientComponent } from 'payload'

export const SyncKBItemButton: UIFieldClientComponent = () => {
  const { id } = useDocumentInfo()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string>('')

  const handleSync = async () => {
    if (!id) {
      setStatus('error')
      setMessage('No document ID found')
      return
    }

    setIsLoading(true)
    setStatus('idle')
    setMessage('')

    try {
      const response = await fetch('/api/knowledge-base/sync-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          kbItemId: String(id),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      setStatus('success')
      setMessage(data.message || 'Sync triggered successfully')
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Failed to trigger sync')
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid var(--theme-border-color)', borderRadius: '4px' }}>
      <div style={{ marginBottom: '0.5rem' }}>
        <strong>Vector Database Sync</strong>
      </div>
      <div style={{ marginBottom: '0.75rem', fontSize: '0.875rem', color: 'var(--theme-text)' }}>
        Manually trigger a sync of this item to the vector database. This will update the embedding
        if the content has changed.
      </div>
      <Button
        onClick={handleSync}
        disabled={isLoading || !id}
        buttonStyle={status === 'success' ? 'success' : status === 'error' ? 'danger' : 'primary'}
      >
        {isLoading ? 'Syncing...' : 'Sync to Vector DB'}
      </Button>
      {message && (
        <div
          style={{
            marginTop: '0.5rem',
            padding: '0.5rem',
            fontSize: '0.875rem',
            color:
              status === 'success'
                ? 'var(--color-success-500)'
                : status === 'error'
                  ? 'var(--color-error-500)'
                  : 'var(--theme-text)',
          }}
        >
          {message}
        </div>
      )}
    </div>
  )
}

export default SyncKBItemButton
