import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

function githubPagesBase() {
  const repository = process.env.GITHUB_REPOSITORY;
  if (!repository) return "/";

  const [owner, name] = repository.split("/");
  return name.toLowerCase() === `${owner}.github.io`.toLowerCase() ? "/" : `/${name}/`;
}

export default defineConfig({
  root: fileURLToPath(new URL("./github", import.meta.url)),
  base: githubPagesBase(),
  publicDir: fileURLToPath(new URL("./public", import.meta.url)),
  plugins: [react()],
  build: {
    outDir: fileURLToPath(new URL("./github-dist", import.meta.url)),
    emptyOutDir: true,
  },
});
