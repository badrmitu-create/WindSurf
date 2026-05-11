"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  variant: "success" | "warning" | "danger" | "info";
  children: React.ReactNode;
  className?: string;
}

const variantMap = {
  success: "badge-success",
  warning: "badge-warning",
  danger: "badge-danger",
  info: "badge-info",
};

export function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span className={cn(variantMap[variant], className)}>{children}</span>
  );
}
