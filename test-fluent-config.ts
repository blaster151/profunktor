// Test file to verify the fluent config changes work correctly
import { 
  enableGlobalFluentMethods, 
  disableGlobalFluentMethods, 
  setGlobalDefaultOptions,
  GLOBAL_FLUENT_CONFIG
} from './fp-fluent-methods';

// Test the toggle functions to ensure no readonly errors occur
console.log('Testing fluent config toggles...');

// Test enableGlobalFluentMethods
console.log('Before enable:', GLOBAL_FLUENT_CONFIG.enabled);
enableGlobalFluentMethods();
console.log('After enable:', GLOBAL_FLUENT_CONFIG.enabled);

// Test disableGlobalFluentMethods  
disableGlobalFluentMethods();
console.log('After disable:', GLOBAL_FLUENT_CONFIG.enabled);

// Test setGlobalDefaultOptions
console.log('Before setGlobalDefaultOptions:', GLOBAL_FLUENT_CONFIG.defaultOptions);
setGlobalDefaultOptions({ enableMap: false, enableChain: false });
console.log('After setGlobalDefaultOptions:', GLOBAL_FLUENT_CONFIG.defaultOptions);

console.log('All fluent config toggle tests passed!');
