'use client'

import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUploadThing } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";
import { generateMimeTypes } from "@uploadthing/shared";
import { X } from "lucide-react";
import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { ExpandedRouteConfig } from "uploadthing/types";

const capitalizeStart = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const INTERNAL_doFormatting = (config?: ExpandedRouteConfig): string => {
  if (!config) return "";

  const allowedTypes = Object.keys(config) as (keyof ExpandedRouteConfig)[];

  const formattedTypes = allowedTypes.map((f) => (f === "blob" ? "file" : f));

  const lastType = formattedTypes.pop();

  const key = allowedTypes[0];

  const { maxFileSize } = config[key]!;

  return `${formattedTypes.join("s, ")} and ${lastType}s up to ${maxFileSize}`;
};


const allowedContentTextLabelGenerator = (
  config?: ExpandedRouteConfig,
): string => {
  return capitalizeStart(INTERNAL_doFormatting(config));
};

interface FileInputProps {
  id: string;
  label: string;
  required?: boolean;
}

export const FileInput = ({ id, label, required }: FileInputProps) => {
  const form = useFormContext();
  const fileUrl = form.watch(id);
  const [disable, setDisable] = useState(false);

  const { getFieldState, formState } = form;

  const fieldState = getFieldState(id, formState);


  const { startUpload, isUploading, permittedFileInfo } = useUploadThing(
    "imageUploader",
    {
      onUploadBegin: () => setDisable(true),
      onClientUploadComplete: (files) => {
        const { url } = files[0];
        form.setValue(id, url);
        form.trigger(id);
        toast.success("Upload Completed!");
      },
      onUploadError: (error: Error) => {
        toast.error(`Upload failed! ${error.message}`);
      },
    },
  );

  const fileTypes = permittedFileInfo?.config
    ? Object.keys(permittedFileInfo?.config)
    : [];

  return (
    <div className="flex flex-col gap-1">
      <Label htmlFor={disable ? "not-clickable" : id}>
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      <Label className={cn(buttonVariants({
        variant: "outline",
        size: "lg"
      }), fieldState.error ? "border-destructive" : "")}
        htmlFor={disable ? "not-clickable" : id}
      >
        <Input
          className="sr-only"
          {...form.register(id, { required })}
          disabled={disable}
        />
        <Input
          className="sr-only"
          type="file"
          id={id}
          accept={generateMimeTypes(fileTypes ?? [])?.join(", ")}
          onChange={(e) => {
            if (!e.target.files) return;
            void startUpload(Array.from(e.target.files));
          }}
          disabled={disable}
        />
        <span>
          {isUploading ? <Spinner /> : fileUrl ? 'Update File' : 'Choose File'}
        </span>
      </Label>
      <div>
        {
          fieldState.error ? (
            <p className="text-xs leading-5 text-destructive">
              {fieldState.error.message}
            </p>
          ) :
            <div className="text-xs leading-5 text-gray-600">
              {
                fileUrl ?
                  <div className="flex items-center gap-2">
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      {fileUrl}
                    </a>
                    <span className='text-xs leading-5 cursor-pointer text-destructive hover:text-destructive/50'
                      onClick={() => {
                        form.setValue(id, '');
                      }}
                    >
                      <X width={18} height={18} />
                    </span>
                  </div>
                  :
                  allowedContentTextLabelGenerator(permittedFileInfo?.config)
              }
            </div>
        }
      </div>
    </div>
  );
}

const Spinner = () => {
  return (
    <svg
      className="animate-spin h-5 w-5 text-black"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 576 512"
    >
      <path
        fill="currentColor"
        d="M256 32C256 14.33 270.3 0 288 0C429.4 0 544 114.6 544 256C544 302.6 531.5 346.4 509.7 384C500.9 399.3 481.3 404.6 465.1 395.7C450.7 386.9 445.5 367.3 454.3 351.1C470.6 323.8 480 291 480 255.1C480 149.1 394 63.1 288 63.1C270.3 63.1 256 49.67 256 31.1V32z"
      />
    </svg>
  );
};
