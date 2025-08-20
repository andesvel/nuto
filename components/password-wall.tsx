import React from "react";
import { useFetcher } from "react-router";
import { Input } from "@ui/input";
import { Button } from "@ui/button";
import { Label } from "@ui/label";

export default function PasswordWall() {
  const fetcher = useFetcher();
  const busy = fetcher.state !== "idle";

  return (
    <main className="flex flex-col items-center justify-center h-screen p-4">
      <h2>Protected URL</h2>
      <p>This URL is protected by a password.</p>

      <fetcher.Form method="post">
        <Label>
          Password:
          <Input type="password" name="password" />
        </Label>
        <Button type="submit" disabled={busy}>
          {busy ? "Checking..." : "Submit"}
        </Button>
      </fetcher.Form>
    </main>
  );
}
