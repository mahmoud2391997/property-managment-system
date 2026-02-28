'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface CommandPaletteContextType {
  // Command dialog
  commandOpen: boolean
  setCommandOpen: (open: boolean) => void

  // Global dialog state
  activeDialog: string | null
  dialogProps: { propertyId?: string; roomId?: string; leaseId?: string }
  openDialog: (actionId: string, propertyId?: string, roomId?: string, leaseId?: string) => void
  closeDialog: () => void
}

const CommandPaletteContext = createContext<CommandPaletteContextType | null>(null)

export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [commandOpen, setCommandOpen] = useState(false)
  const [activeDialog, setActiveDialog] = useState<string | null>(null)
  const [dialogProps, setDialogProps] = useState<{ propertyId?: string; roomId?: string; leaseId?: string }>({})

  const openDialog = useCallback((actionId: string, propertyId?: string, roomId?: string, leaseId?: string) => {
    setDialogProps({ propertyId, roomId, leaseId })
    setActiveDialog(actionId)
  }, [])

  const closeDialog = useCallback(() => {
    setActiveDialog(null)
    setDialogProps({})
  }, [])

  return (
    <CommandPaletteContext.Provider
      value={{
        commandOpen,
        setCommandOpen,
        activeDialog,
        dialogProps,
        openDialog,
        closeDialog,
      }}
    >
      {children}
    </CommandPaletteContext.Provider>
  )
}

export function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext)
  if (!ctx) throw new Error('useCommandPalette must be used within CommandPaletteProvider')
  return ctx
}
