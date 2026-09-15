import coreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

/**
 * eslint-config-next 16 ships native flat configs, so these are spread
 * directly. The older `FlatCompat` + `extends` bridge is not needed (and in
 * fact throws on this version).
 */
const eslintConfig = [
  { ignores: [".next/**", "node_modules/**", "out/**", "next-env.d.ts"] },
  ...coreWebVitals,
  ...nextTypescript,
];

export default eslintConfig;
