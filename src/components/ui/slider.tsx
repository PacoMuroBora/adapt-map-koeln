'use client'

import { cn } from '@/utilities/ui'
import * as React from 'react'
import * as SliderPrimitive from '@radix-ui/react-slider'

export interface SliderProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  orientation?: 'horizontal' | 'vertical'
  showLabels?: boolean
  labelTop?: string
  labelBottom?: string
  showMarks?: boolean
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, orientation = 'horizontal', showLabels, labelTop, labelBottom, showMarks = true, ...props }, ref) => {
  const isVertical = orientation === 'vertical'
  
  // Track current values for mark positioning
  const min = props.min ?? 0
  const max = props.max ?? 100
  const [currentValues, setCurrentValues] = React.useState<number[]>(
    props.value ?? props.defaultValue ?? [min]
  )
  
  // Update current values when props.value changes (controlled)
  React.useEffect(() => {
    if (props.value !== undefined) {
      setCurrentValues(props.value)
    }
  }, [props.value])
  
  const getMarkPosition = (value: number): string => {
    const percentage = ((value - min) / (max - min)) * 100
    return `${percentage}%`
  }
  
  const isRangeSlider = currentValues.length > 1
  
  const handleValueChange = (values: number[]) => {
    setCurrentValues(values)
    props.onValueChange?.(values)
  }

  return (
    <div className={cn('flex overflow-visible', isVertical ? 'flex-col items-center gap-2' : 'flex-col gap-2')}>
      {showLabels && labelTop && (
        <span className="text-sm font-body text-foreground">{labelTop}</span>
      )}
      <SliderPrimitive.Root
        ref={ref}
        className={cn(
          'relative flex items-center select-none touch-none overflow-visible cursor-pointer',
          isVertical ? 'h-[200px] w-2 flex-col' : 'w-full h-2',
          className
        )}
        orientation={orientation}
        {...props}
        onValueChange={handleValueChange}
      >
        {showMarks && currentValues.map((value, index) => {
          const markPosition = getMarkPosition(value)
          return (
            <div
              key={index}
              className={cn(
                'absolute bg-foreground pointer-events-none z-20',
                isVertical 
                  ? 'h-[3px] w-[300%] -left-[100%]' 
                  : 'w-[3px] h-[300%] -top-[100%]'
              )}
              style={
                isVertical
                  ? { bottom: markPosition }
                  : { left: markPosition }
              }
            />
          )
        })}
        <SliderPrimitive.Track
          className={cn(
            'relative grow rounded-full bg-muted',
            isVertical ? 'w-2 h-full' : 'h-2 w-full'
          )}
        >
          <SliderPrimitive.Range
            className={cn(
              'absolute bg-primary',
              isRangeSlider
                ? isVertical
                  ? 'w-full' // Range slider: square both ends
                  : 'h-full' // Range slider: square both ends
                : isVertical 
                  ? 'w-full rounded-b-full' // Single value: rounded bottom, square top
                  : 'h-full rounded-l-full'  // Single value: rounded left, square right
            )}
          />
        </SliderPrimitive.Track>
        {currentValues.map((_, index) => (
          <SliderPrimitive.Thumb
            key={index}
            className="absolute opacity-0 pointer-events-auto cursor-pointer w-8 h-8 -translate-x-1/2 -translate-y-1/2"
            aria-hidden="true"
          />
        ))}
      </SliderPrimitive.Root>
      {showLabels && labelBottom && (
        <span className="text-sm font-body text-foreground">{labelBottom}</span>
      )}
    </div>
  )
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
