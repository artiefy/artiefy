import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "~/components/ui/dialog"

function MyComponent({ title, message }: { title: string; message: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button>Open dialog</button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          {/* Footer content */}
          <button>Close</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default MyComponent;

