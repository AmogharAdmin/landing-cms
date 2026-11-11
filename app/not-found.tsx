import { siteData } from "@/lib/site";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center [background:var(--fill-light)] px-6 text-center">
      <p className="eyebrow">{siteData.site.location}</p>
      <h1 className="mt-4 font-serif text-5xl text-[var(--color-primary)]">Page not found</h1>
      <p className="mt-4 max-w-md text-[var(--color-muted)]">
        The page you are looking for is unavailable. Return to {siteData.site.name}.
      </p>
      <div className="mt-8">
        <Button href="/">Back to Home</Button>
      </div>
    </main>
  );
}
