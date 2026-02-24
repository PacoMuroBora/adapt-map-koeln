'use client'

import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/utilities/ui'
import { X } from 'lucide-react'
import { useEffect, useState } from 'react'

export type QuestionnaireNavProps = {
  onPrevious: () => void
  onNext: () => void
  nextLabel: string
  nextDisabled?: boolean
  nextIcon?: 'arrow-down' | 'check'
  onAbort: () => void
  showAbortDialog: boolean
  setShowAbortDialog: (open: boolean) => void
  onConfirmAbort: () => void
  /** When true, the previous button is hidden (e.g. on start page). */
  isFirstPage?: boolean
}

export default function QuestionnaireNav({
  onPrevious,
  onNext,
  nextLabel,
  nextDisabled = false,
  nextIcon = 'arrow-down',
  onAbort,
  showAbortDialog,
  setShowAbortDialog,
  onConfirmAbort,
  isFirstPage = false,
}: QuestionnaireNavProps) {
  const [prevButtonMounted, setPrevButtonMounted] = useState(false)
  useEffect(() => {
    if (!isFirstPage) {
      const raf = requestAnimationFrame(() => setPrevButtonMounted(true))
      return () => cancelAnimationFrame(raf)
    }
  }, [isFirstPage])

  return (
    <>
      <button onClick={onAbort} className="fixed top-4 right-4 z-20" type="button">
        <X className="size-5 text-white" />
      </button>

      <div className="relative flex h-14 flex-row items-center gap-4">
        {!isFirstPage && (
          <div
            className={cn(
              'transition-all duration-300 ease-out',
              prevButtonMounted ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0',
            )}
          >
            <Button type="button" variant="outline-white" onClick={onPrevious} iconBefore="arrow-up" />
          </div>
        )}
        <Button
          type="button"
          size="lg"
          shape="round"
          variant="white"
          iconAfter={nextIcon}
          onClick={onNext}
          disabled={nextDisabled}
          className={cn('absolute left-1/2 -translate-x-1/2', nextDisabled && 'opacity-20')}
        >
          {nextLabel}
        </Button>
      </div>

      <AlertDialog open={showAbortDialog} onOpenChange={setShowAbortDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Abbrechen?</AlertDialogTitle>
            <AlertDialogDescription>
              Bist du sicher, dass du abbrechen möchtest? Deine Angaben werden verloren gehen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={onConfirmAbort}>Abbrechen</AlertDialogAction>
            <AlertDialogCancel>Weiter bearbeiten</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
