import { useState } from 'react'
import { Button } from "~/components/admin/ui/button"
import { ConfirmationDialog } from '~/components/admin/ui/confirmationDialog'

export function ExampleComponent() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleConfirm = () => {
    // Handle confirmation logic here
    console.log('Action confirmed')
    setIsDialogOpen(false)
  }

  const handleClose = () => {
    setIsDialogOpen(false)
  }

  return (
    <div>
      <Button onClick={() => setIsDialogOpen(true)}>Open Confirmation Dialog</Button>
      <ConfirmationDialog
        isOpen={isDialogOpen}
        title="Confirm Action"
        description="Are you sure you want to proceed?"
        onClose={handleClose}
        onConfirm={handleConfirm}
      />
    </div>
  )
}

