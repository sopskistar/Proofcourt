import { FlatCompat } from "@eslint/eslintrc";
const compat = new FlatCompat({ baseDirectory: import.meta.dirname });
const config = [...compat.extends("next/core-web-vitals", "next/typescript")];
const ignores = { ignores: [".next/**", "node_modules/**", "next-env.d.ts"] };
const eslintConfig = [ignores, ...config];
export default eslintConfig;
