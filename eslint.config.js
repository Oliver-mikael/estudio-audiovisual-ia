// Configuración mínima de ESLint para la limpieza de la fase 48.
// El proyecto no tenía ESLint; se revisan las reglas de código muerto y de
// consola, no el estilo, para no reescribir archivos existentes.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'artifacts/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      // La limpieza de la fase 48 se centra en variables e imports sin usar.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': ['warn', { allow: ['error', 'warn'] }],
      'no-debugger': 'error',
    },
  },
  {
    // Las pruebas construyen dobles de APIs del navegador y usan `any` a propósito.
    files: ['src/__tests__/**/*.ts'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  }
);
