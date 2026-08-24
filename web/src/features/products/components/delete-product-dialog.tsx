import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { ApiError } from '@/api/errors'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useDeleteProduct } from '@/features/products/hooks/use-products'

export function DeleteProductDialog({
  productId,
  productName,
  onDeleted,
}: {
  productId: number
  productName: string
  onDeleted?: () => void
}) {
  const [open, setOpen] = useState(false)
  const deleteMutation = useDeleteProduct()

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button variant="ghost" size="icon">
            <Trash2 className="size-4" />
            <span className="sr-only">Ürünü sil</span>
          </Button>
        }
      />
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Ürünü sil</AlertDialogTitle>
          <AlertDialogDescription>
            &quot;{productName}&quot; kalıcı olarak silinecek. Bu işlem geri alınamaz.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Vazgeç</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleteMutation.isPending}
            onClick={() => {
              deleteMutation.mutate(productId, {
                onSuccess: () => {
                  setOpen(false)
                  toast.success('Ürün silindi.')
                  onDeleted?.()
                },
                onError: (error) => {
                  toast.error(error instanceof ApiError ? error.message : 'Ürün silinemedi.')
                },
              })
            }}
          >
            {deleteMutation.isPending ? 'Siliniyor…' : 'Sil'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
