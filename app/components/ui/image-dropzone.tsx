import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { cn } from "~/lib/utils";
import { ImageIcon } from "lucide-react";

interface ImageDropzoneProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
}

export function ImageDropzone({
  value,
  onChange,
  className,
}: ImageDropzoneProps) {
  const [preview, setPreview] = useState<string | null>(value || null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setPreview(base64String);
          onChange(base64String);
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
    maxSize: 5242880, // 5MB
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
        isDragActive
          ? "border-rose-500 bg-rose-50"
          : "border-gray-300 hover:border-rose-500",
        className
      )}
    >
      <input {...getInputProps()} />
      {preview ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg">
          <img
            src={preview}
            alt="Preview"
            className="object-cover w-full h-full"
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setPreview(null);
              onChange("");
            }}
            className="absolute top-2 right-2 bg-white/80 hover:bg-white p-1 rounded-full shadow-sm"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 py-8">
          <ImageIcon className="w-8 h-8 text-gray-400" />
          <p className="text-sm text-gray-500">
            {isDragActive
              ? "Drop the image here"
              : "Drag & drop an image here, or click to select"}
          </p>
          <p className="text-xs text-gray-400">Max file size: 5MB</p>
        </div>
      )}
    </div>
  );
}
