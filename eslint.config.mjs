export default [{
  files: ['dist/site.js', '*.mjs'],
  languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: {
    document:'readonly',window:'readonly',matchMedia:'readonly',HTMLElement:'readonly',
    Element:'readonly',Node:'readonly',IntersectionObserver:'readonly',CSS:'readonly',
    requestAnimationFrame:'readonly',cancelAnimationFrame:'readonly',HTMLButtonElement:'readonly'
  } },
  rules: {'no-unused-vars':['error',{argsIgnorePattern:'^_'}],'no-undef':'error','no-unreachable':'error','no-constant-condition':'error'}
}];
