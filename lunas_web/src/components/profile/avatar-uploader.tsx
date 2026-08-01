"use client";

import { useRef, useState } from "react";
import { Camera, CircleAlert, Trash2, Upload } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function AvatarUploader({
  firstName,
  lastName,
  file,
  error,
  uploading = false,
  progress = 0,
  onChange,
  onError,
}: {
  firstName: string;
  lastName: string;
  file: File | null;
  error?: string;
  uploading?: boolean;
  progress?: number;
  onChange: (file: File | null) => void;
  onError: (error?: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = (nextFile?: File) => {
    if (!nextFile) return;
    if (!ACCEPTED_TYPES.includes(nextFile.type)) {
      onError("Choose a JPG, PNG, or WebP image.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (nextFile.size > MAX_FILE_SIZE) {
      onError("Choose an image smaller than 2 MB.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    onError(undefined);
    onChange(nextFile);
    const reader = new FileReader();
    reader.onload = () => setPreview(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(nextFile);
  };

  const remove = () => {
    setPreview(null);
    onChange(null);
    onError(undefined);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left lg:flex-col lg:items-center lg:text-center">
        <div className="relative">
          {preview ? (
            <span
              className="block size-28 rounded-full border-4 border-white bg-cover bg-center shadow-md ring-1 ring-slate-200"
              style={{ backgroundImage: `url(${preview})` }}
              role="img"
              aria-label={`Preview of new profile image for ${firstName} ${lastName}`}
            />
          ) : (
            <Avatar firstName={firstName || "User"} lastName={lastName || "Profile"} size="xl" className="size-28 text-3xl ring-1 ring-slate-200" />
          )}
          <span className="absolute bottom-0 right-0 flex size-9 items-center justify-center rounded-full border-2 border-white bg-brand-700 text-white shadow-sm" aria-hidden="true">
            <Camera className="size-4" />
          </span>
        </div>

        <div className="mt-4 min-w-0 sm:ml-5 sm:mt-1 lg:ml-0 lg:mt-4">
          <p className="font-semibold text-slate-950">Profile image</p>
          <p id="avatar-help" className="mt-1 max-w-xs text-xs leading-5 text-slate-500">
            JPG, PNG, or WebP. Maximum file size: 2 MB.
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start lg:justify-center">
            <Button type="button" variant="secondary" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
              <Upload className="size-4" aria-hidden="true" /> {file ? "Replace" : "Choose image"}
            </Button>
            {file ? (
              <Button type="button" variant="ghost" size="sm" disabled={uploading} onClick={remove}>
                <Trash2 className="size-4" aria-hidden="true" /> Remove
              </Button>
            ) : null}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            aria-label="Choose a profile image"
            aria-describedby={`avatar-help${error ? " avatar-error" : ""}`}
            aria-invalid={Boolean(error)}
            disabled={uploading}
            onChange={(event) => handleFile(event.target.files?.[0])}
          />
        </div>
      </div>

      {error ? (
        <p id="avatar-error" className="mt-3 flex items-start gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> {error}
        </p>
      ) : null}

      {uploading && file ? (
        <div className="mt-4" aria-live="polite">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>Uploading image</span>
            <span>{progress}%</span>
          </div>
          <div
            className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"
            role="progressbar"
            aria-label="Profile image upload progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <span className="block h-full rounded-full bg-brand-700 transition-[width]" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
