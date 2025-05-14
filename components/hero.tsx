import { useState } from "react";

export default function Hero() {
  const [url, setUrl] = useState("");

  return (
    <section className="w-full py-12 md:py-24 lg:py-32">
      <div className="px-4 md:px-6 z-10">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            Short links with <span className="text-primary">ease</span>
          </h1>
          <p className="mb-10 text-lg text-gray-600 md:text-xl">
            Transform your long URLs into concise, memorable links.
          </p>
        </div>
      </div>
    </section>
  );
}
