import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { buttonVariants } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <Container className="flex flex-col items-start gap-5 py-28">
      <p className="text-sm font-medium text-primary-text">404</p>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Page not found
      </h1>
      <p className="max-w-md text-foreground/60">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <Link href="/" className={buttonVariants({ size: "lg" })}>
        Back to home
      </Link>
    </Container>
  );
}
