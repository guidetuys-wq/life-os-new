// components/ui/Skeleton.js
import React from 'react';

/**
 * Skeleton Component
 * Menampilkan placeholder dengan efek shimmer untuk loading state.
 * Menggunakan design tokens (bg-muted) agar konsisten dengan tema.
 */
export default function Skeleton({ className, ...props }) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-muted/50 ${className}`}
      {...props}
    >
      {/* Shimmer Effect Overlay */}
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-muted-foreground/10 to-transparent" />
    </div>
  );
}