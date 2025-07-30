// Test script to run in browser console to test decryption fixes
// Open the dashboard in browser, then paste this in console

console.log('🔍 Starting decryption test...');

// Import the test function
import('/lib/decryption-utils.js').then(async (module) => {
  try {
    console.log('📥 Module loaded, running test...');
    const result = await module.testDecryption();
    
    if (result) {
      console.log('🎉 SUCCESS! Decryption test passed!');
      console.log('✅ Working credential:', result.credential);
      console.log('👤 Decrypted data:', result.result);
      console.log('📊 Test set:', result.testSet);
    } else {
      console.log('❌ All decryption attempts failed');
      console.log('ℹ️ This might mean:');
      console.log('  1. The encryption key derivation method is different');
      console.log('  2. The data format is different than expected');
      console.log('  3. Additional transformations are needed');
    }
  } catch (error) {
    console.error('❌ Error running test:', error);
  }
}).catch(error => {
  console.error('❌ Failed to load module:', error);
  console.log('ℹ️ Try running this instead:');
  console.log('window.testDecryption()');
});