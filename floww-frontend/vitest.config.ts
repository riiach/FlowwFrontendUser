import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
    resolve: {
        alias: {
            // tsconfig의 "@/*" → "./src/*" 와 동일하게
            "@": fileURLToPath(new URL("./src", import.meta.url)),
            // server-only는 테스트 환경에서 에러를 던지므로 빈 모듈로 대체
            "server-only": fileURLToPath(new URL("./src/__tests__/stubs/server-only.ts", import.meta.url)),
        },
    },
    test: {
        environment: "node",
        include: ["src/__tests__/**/*.test.ts"],
        passWithNoTests: true,
    },
})