import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { cn } from "~/lib/utils";

interface ImageUploadProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
}

export function ImageUpload({ value, onChange, className }: ImageUploadProps) {
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result;
          if (typeof result === "string") {
            onChange(result);
          }
        };
        reader.readAsDataURL(file);
      }
    },
    [onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif"],
    },
    maxFiles: 1,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors",
        isDragActive && "border-primary",
        className
      )}
    >
      <input {...getInputProps()} />
      {value ? (
        <div className="relative aspect-square w-full max-w-[200px] mx-auto">
          <img
            src={value}
            alt="Uploaded"
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
      ) : (
        <div className="py-8">
          <p className="text-sm text-muted-foreground">
            {isDragActive
              ? "Drop the image here"
              : "Drag and drop an image, or click to select"}
          </p>
        </div>
      )}
    </div>
  );
}
