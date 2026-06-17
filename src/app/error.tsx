"use client";

import { useEffect } from "react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="flex flex-col items-start gap-5 py-28">
      <p className="text-sm font-medium text-primary-text">Error</p>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Something went wrong
      </h1>
      <p className="max-w-md text-foreground/60">
        An unexpected error occurred while rendering this page. You can try again
        or head back home.
      </p>
      <Button size="lg" onClick={() => unstable_retry()}>
        Try again
      </Button>
    </Container>
  );
}
