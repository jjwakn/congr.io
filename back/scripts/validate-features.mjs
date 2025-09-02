#!/usr/bin/env node

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define the Features enum to match the backend
const Features = {
  Users: 'users',
  Members: 'members',
  EventsCalendar: 'events_calendar',
  EventsAttendance: 'events_attendance',
  Ministries: 'ministries',
  MinistriesCalendar: 'ministries_calendar',
};

// Path to the features.json file
const featuresJsonPath = join(__dirname, '..', 'src', 'locales', 'en', 'features.json');

function validateFeatures() {
  try {
    console.log('🔍 Validating backend features.json against Features enum...\n');
    
    // Read and parse the features.json file
    const featuresJsonContent = readFileSync(featuresJsonPath, 'utf8');
    const featuresJson = JSON.parse(featuresJsonContent);
    
    // Get all feature values from the enum
    const enumFeatureValues = Object.values(Features);
    
    // Get all feature keys from the JSON
    const jsonFeatureKeys = Object.keys(featuresJson);
    
    console.log('📋 Features defined in enum:');
    enumFeatureValues.forEach(feature => console.log(`  ✅ ${feature}`));
    
    console.log('\n📄 Features found in JSON:');
    jsonFeatureKeys.forEach(feature => console.log(`  📝 ${feature}`));
    
    // Check for missing features (in enum but not in JSON)
    const missingFeatures = enumFeatureValues.filter(
      enumFeature => !jsonFeatureKeys.includes(enumFeature)
    );
    
    // Check for extra features (in JSON but not in enum)
    const extraFeatures = jsonFeatureKeys.filter(
      jsonFeature => !enumFeatureValues.includes(jsonFeature)
    );
    
    console.log('\n🔍 Validation Results:');
    
    if (missingFeatures.length === 0 && extraFeatures.length === 0) {
      console.log('  🎉 All features are properly synchronized!');
      console.log('  ✅ No missing features');
      console.log('  ✅ No extra features');
      return true;
    }
    
    if (missingFeatures.length > 0) {
      console.log('  ❌ Missing features (in enum but not in JSON):');
      missingFeatures.forEach(feature => console.log(`    - ${feature}`));
    }
    
    if (extraFeatures.length > 0) {
      console.log('  ⚠️  Extra features (in JSON but not in enum):');
      extraFeatures.forEach(feature => console.log(`    - ${feature}`));
    }
    
    return false;
    
  } catch (error) {
    console.error('❌ Error during validation:', error.message);
    return false;
  }
}

// Run the validation
const isValid = validateFeatures();

// Exit with appropriate code
process.exit(isValid ? 0 : 1);
