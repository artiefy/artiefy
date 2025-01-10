import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";


 export type ConfirmDialogProps = {

  title: string;

  message: string;

  onConfirm: () => void;


};

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ title, message, onConfirm }) => {
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
  );
}

export default ConfirmDialog;
