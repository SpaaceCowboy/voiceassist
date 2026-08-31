"use client";

import { useEffect, useState } from "react";
import Image, { type ImageProps } from "next/image";
import { safeImageSrc } from "@/lib/images";

type SafeImageProps = Omit<ImageProps, "src"> & {
  src: string | null | undefined;
  fallback: string;
};

export function SafeImage({ src, fallback, onError, ...props }: SafeImageProps) {
  const initialSrc = safeImageSrc(src, fallback);
  const [displaySrc, setDisplaySrc] = useState(initialSrc);

  useEffect(() => setDisplaySrc(initialSrc), [initialSrc]);

  return (
    <Image
      {...props}
      src={displaySrc}
      onError={(event) => {
        setDisplaySrc(fallback);
        onError?.(event);
      }}
    />
  );
}
