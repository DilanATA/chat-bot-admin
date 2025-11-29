export function useToast() {
  function toast({
    title,
    description,
    variant = "default",
  }: {
    title: string;
    description?: string;
    variant?: "default" | "success" | "error";
  }) {
    if (typeof window !== "undefined" && (window as any).toast) {
      (window as any).toast({ title, description, variant });
    } else {
      console.log("🔔", title, description);
    }
  }

  return { toast };
}
