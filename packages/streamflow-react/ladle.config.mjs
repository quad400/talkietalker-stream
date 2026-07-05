import type { UserConfig } from "@ladle/react"

const config: UserConfig = {
  stories: "src/**/*.stories.tsx",
  viteConfig: () => ({
    define: {
      "process.env.NODE_ENV": JSON.stringify("development"),
    },
  }),
}

export default config
