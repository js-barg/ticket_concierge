export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return <p className="text-sm text-amber-400">{message}</p>;
}
