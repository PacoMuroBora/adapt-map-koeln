'use client'

import { StatefulInfoBox } from '@/components/ui/stateful-info-box'

export function StatefulInfoBoxExamples() {
  return (
    <div className="space-y-4 max-w-2xl">
      <StatefulInfoBox
        line1="Information"
        showIcon
      />

      <StatefulInfoBox
        line1="Title"
        line2="Description text"
        showIcon
        iconType="checkbox"
      />

      <StatefulInfoBox
        variant="error"
        line1="Error occurred"
        line2="Please check your input"
        showIcon
        showButton
        buttonLabel="Fix"
        onButtonClick={() => console.log('Fix clicked')}
      />

      <StatefulInfoBox
        line1="Label"
        showIcon
        flipIcon
        showButton
        buttonLabel="Action"
      />
    </div>
  )
}
