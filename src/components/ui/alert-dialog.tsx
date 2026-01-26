'use client'

import * as React from 'react'
import { cn } from '@/utilities/ui'
import { Button } from './button'
import { X } from 'lucide-react'

interface AlertDialogContextType {
  open: boolean
  setOpen: (open: boolean) => void
}

const AlertDialogContext = React.createContext<AlertDialogContextType | undefined>(undefined)

const AlertDialog = ({ children, open: controlledOpen, onOpenChange }: {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) => {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = React.useCallback((newOpen: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(newOpen)
    }
    onOpenChange?.(newOpen)
  }, [controlledOpen, onOpenChange])

  return (
    <AlertDialogContext.Provider value={{ open, setOpen }}>
      {children}
    </AlertDialogContext.Provider>
  )
}

const AlertDialogTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ children, asChild, onClick, ...props }, ref) => {
  const { setOpen } = React.useContext(AlertDialogContext)!
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setOpen(true)
    onClick?.(e)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement, {
      onClick: handleClick,
      ref,
    })
  }

  return (
    <button ref={ref} onClick={handleClick} {...props}>
      {children}
    </button>
  )
})
AlertDialogTrigger.displayName = 'AlertDialogTrigger'

const AlertDialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { open, setOpen } = React.useContext(AlertDialogContext)!

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 animate-in fade-in-0"
        onClick={() => setOpen(false)}
      />
      <div
        ref={ref}
        className={cn(
          'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border bg-background p-6 shadow-lg duration-200 animate-in fade-in-0 zoom-in-95',
          className
        )}
        {...props}
      >
        {children}
      </div>
    </>
  )
})
AlertDialogContent.displayName = 'AlertDialogContent'

const AlertDialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-2 text-center sm:text-left', className)} {...props} />
)
AlertDialogHeader.displayName = 'AlertDialogHeader'

const AlertDialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
    {...props}
  />
)
AlertDialogFooter.displayName = 'AlertDialogFooter'

const AlertDialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn('font-headings text-lg font-semibold', className)}
    {...props}
  />
))
AlertDialogTitle.displayName = 'AlertDialogTitle'

const AlertDialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('font-body text-sm text-muted-foreground', className)}
    {...props}
  />
))
AlertDialogDescription.displayName = 'AlertDialogDescription'

const AlertDialogAction = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, onClick, ...props }, ref) => {
  const { setOpen } = React.useContext(AlertDialogContext)!
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    setOpen(false)
  }

  return (
    <Button ref={ref} className={className} onClick={handleClick} {...props}>
      {children}
    </Button>
  )
})
AlertDialogAction.displayName = 'AlertDialogAction'

const AlertDialogCancel = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, onClick, ...props }, ref) => {
  const { setOpen } = React.useContext(AlertDialogContext)!
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    setOpen(false)
  }

  return (
    <Button ref={ref} variant="outline" className={cn('mt-2 sm:mt-0', className)} onClick={handleClick} {...props}>
      {children}
    </Button>
  )
})
AlertDialogCancel.displayName = 'AlertDialogCancel'

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
