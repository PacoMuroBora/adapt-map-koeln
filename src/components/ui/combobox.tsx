'use client'

import { cn } from '@/utilities/ui'
import * as React from 'react'
import { Check, ChevronDown, X, Search } from 'lucide-react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Input } from './input'

export interface ComboboxOption {
  value: string
  label: string
  icon?: React.ReactNode
  description?: string
  disabled?: boolean
}

export interface ComboboxProps {
  options: ComboboxOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  searchable?: boolean
  clearable?: boolean
  disabled?: boolean
  className?: string
  emptyMessage?: string
}

const Combobox = React.forwardRef<HTMLButtonElement, ComboboxProps>(
  (
    {
      options,
      value,
      onValueChange,
      placeholder = 'Select an option...',
      searchPlaceholder = 'Search...',
      searchable = true,
      clearable = true,
      disabled = false,
      className,
      emptyMessage = 'No options found',
      ...props
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false)
    const [searchQuery, setSearchQuery] = React.useState('')
    const [selectedValue, setSelectedValue] = React.useState(value || '')

    const selectedOption = options.find((opt) => opt.value === selectedValue)

    const filteredOptions = React.useMemo(() => {
      if (!searchQuery) return options
      const query = searchQuery.toLowerCase()
      return options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(query) ||
          opt.description?.toLowerCase().includes(query)
      )
    }, [options, searchQuery])

    const handleValueChange = (newValue: string) => {
      setSelectedValue(newValue)
      onValueChange?.(newValue)
      setOpen(false)
      setSearchQuery('')
    }

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation()
      setSelectedValue('')
      onValueChange?.('')
    }

    return (
      <SelectPrimitive.Root
        value={selectedValue}
        onValueChange={handleValueChange}
        open={open}
        onOpenChange={setOpen}
        disabled={disabled}
      >
        <SelectPrimitive.Trigger
          ref={ref}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,0,0,0.1)] disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
            className
          )}
          {...props}
        >
          <SelectPrimitive.Value placeholder={placeholder}>
            {selectedOption?.icon && (
              <span className="mr-2">{selectedOption.icon}</span>
            )}
            {selectedOption?.label || placeholder}
          </SelectPrimitive.Value>
          <div className="flex items-center gap-1">
            {clearable && selectedValue && (
              <button
                type="button"
                onClick={handleClear}
                className="rounded-sm opacity-70 ring-offset-background hover:opacity-100 focus:outline-none focus:shadow-[0_0_0_3px_rgba(0,0,0,0.1)]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <SelectPrimitive.Icon asChild>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </SelectPrimitive.Icon>
          </div>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className={cn(
              'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-lg border bg-card text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2'
            )}
          >
            {searchable && (
              <div className="p-2 border-b border-border">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-9"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            )}

            <SelectPrimitive.Viewport className="p-1">
              {filteredOptions.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  {emptyMessage}
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <SelectPrimitive.Item
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    className={cn(
                      'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-primary/10 focus:text-accent-foreground hover:bg-primary/10 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                      selectedValue === option.value && 'bg-primary/20 border-b-2 border-dashed border-primary'
                    )}
                  >
                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                      <SelectPrimitive.ItemIndicator>
                        <Check className="h-4 w-4" />
                      </SelectPrimitive.ItemIndicator>
                    </span>
                    <div className="flex items-center gap-2 flex-1">
                      {option.icon && <span>{option.icon}</span>}
                      <div className="flex flex-col flex-1">
                        <SelectPrimitive.ItemText>
                          {option.label}
                        </SelectPrimitive.ItemText>
                        {option.description && (
                          <span className="text-xs text-muted-foreground">
                            {option.description}
                          </span>
                        )}
                      </div>
                    </div>
                  </SelectPrimitive.Item>
                ))
              )}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    )
  }
)
Combobox.displayName = 'Combobox'

export { Combobox }
