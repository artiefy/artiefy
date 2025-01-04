import { useState } from 'react'
import ConfirmationDialog from '~/components/ui/ConfirmDialog'
import { Button } from "~/components/ui/button"

export function ParentComponent() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleConfirm = () => {
    // Handle confirmation logic here
    console.log('Confirmed')
    setIsDialogOpen(false)
  }

  return (
    <div>
      <Button onClick={() => setIsDialogOpen(true)}>Open Dialog</Button>
      <ConfirmationDialog
        isOpen={isDialogOpen}
        title="Confirm Action"
        description="Are you sure you want to perform this action?"
        onClose={() => setIsDialogOpen(false)}
        onConfirm={handleConfirm}
      />
    </div>
  )
}

