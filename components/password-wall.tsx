import * as React from "react";
import { useFetcher } from "react-router";
import Header from "@components/header";
import Footer from "@components/footer";

import { Input } from "@ui/input";
import { Button } from "@ui/button";
import { Label } from "@ui/label";
import { toast } from "sonner";

import { LockKeyhole, Eye, EyeOff } from "lucide-react";

export default function PasswordWall() {
  const fetcher = useFetcher();
  const busy = fetcher.state !== "idle";
  const [viewPassword, setViewPassword] = React.useState(false);
  const [formData, setFormData] = React.useState<{ password: string }>({
    password: "",
  });

  React.useEffect(() => {
    if (fetcher.data && fetcher.state === "idle") {
      if (!fetcher.data.success) {
        toast.error("Invalid password");
        clearForm();
      }
    }
  }, [fetcher.data, fetcher.state]);

  const clearForm = () => {
    setFormData({ password: "" });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="flex flex-col min-h-dvh justify-between antialiased">
      <Header hideSession />
      <main className="flex flex-col gap-8 items-center justify-center p-10 -mt-50">
        <div className="flex flex-col gap-2 items-center">
          <LockKeyhole className="h-12 w-12 text-muted-foreground" />
          <h2 className="text-2xl font-bold">Protected URL</h2>
          <p>This URL is protected by a password.</p>
        </div>

        <fetcher.Form
          method="post"
          className="w-full max-w-sm flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2 w-full">
            <Label htmlFor="password">Password:</Label>
            <div className="flex gap-0 items-center space-x-2">
              <Input
                className="mr-0 rounded-none rounded-l-sm border-r-0"
                id="password"
                name="password"
                type={viewPassword ? "text" : "password"}
                placeholder="Enter link password"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleInputChange}
              />
              <Button
                aria-label="Toggle password visibility"
                className="rounded-none rounded-r-sm border"
                type="button"
                variant="icon"
                onClick={() => setViewPassword(!viewPassword)}
              >
                {viewPassword ? <Eye /> : <EyeOff />}
              </Button>
            </div>
          </div>
          <Button type="submit" disabled={busy || !formData.password}>
            {busy ? "Checking..." : "Submit"}
          </Button>
        </fetcher.Form>
      </main>
      <Footer />
    </div>
  );
}
