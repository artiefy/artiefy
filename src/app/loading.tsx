import { LoaderPinwheel } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="relative">
        <LoaderPinwheel className="h-16 w-16 animate-spin text-primary" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-12 w-12 rounded-full border-4 border-background" />
        </div>
      </div>
      <p className="mt-4 text-lg font-medium text-primary">
        Cargando... Artiefy
      </p>
    </div>
  );
}
