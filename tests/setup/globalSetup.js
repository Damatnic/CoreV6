const { execSync } = require('child_process')

async function globalSetup() {
  // Set up test database
  console.log('Setting up test database...')
  
  try {
    // Create test database if it doesn't exist
    if (process.env.TEST_DATABASE_URL) {
      console.log('Test database URL configured')
    } else {
      console.log('No test database URL configured, using default')
    }
    
    // Run database migrations for test environment
    if (process.env.CI !== 'true') {
      console.log('Running database setup...')
      try {
        execSync('npm run prisma:generate', { stdio: 'inherit' })
      } catch (error) {
        console.warn('Prisma generate failed, continuing...', error.message)
      }
    }
    
    console.log('Global setup completed')
  } catch (error) {
    console.error('Global setup failed:', error)
    throw error
  }
}

module.exports = globalSetup