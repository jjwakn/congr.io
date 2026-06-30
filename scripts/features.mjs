#!/usr/bin/env node

import { readdirSync } from 'fs';
import { basename, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define the Features enum to match the backend
const Features = {
  Users: 'users',
  Members: 'members',
  Processes: 'processes',
  EventsCalendar: 'events_calendar',
  EventsAttendance: 'events_attendance',
  PublicEvents: 'public_events',
  Ministries: 'ministries',
  MinistriesCalendar: 'ministries_calendar',
  Services: 'services',
  ServicesNewPeople: 'services_new_people',
  ServicesFollowUp: 'services_follow_up',
  ServicesAttendance: 'services_attendance',
};

// Get all feature values from the enum
const enumFeatureValues = Object.values(Features);

const featuresDirPath = join(
  __dirname,
  '..',
  'back',
  'src',
  'locales',
  'en',
  'features',
);

const validateFeatures = () => {
  try {
    console.log('🔍 Validating feature locale files against Features enum...\n');
    
    const jsonFeatureKeys = readdirSync(featuresDirPath)
      .filter((file) => file.endsWith('.json'))
      .map((file) => basename(file, '.json'));
    
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
};

// Run the validation
const isValid = validateFeatures();

// Exit with appropriate code
process.exit(isValid ? 0 : 1);
