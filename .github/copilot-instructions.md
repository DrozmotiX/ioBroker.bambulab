# ioBroker.bambulab Development Instructions

ioBroker.bambulab is a Node.js adapter for integrating Bambulab 3D printers into the ioBroker home automation platform. The adapter connects to Bambulab printers via MQTT to retrieve print data and control main printer functions.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Prerequisites and Setup
- Node.js version 18 or higher (engines requirement in package.json)
- npm package manager (comes with Node.js)

### Bootstrap, Build, and Test the Repository
1. **Install dependencies**: 
   - `npm install` -- takes 26 seconds. NEVER CANCEL. Set timeout to 60+ minutes for safety.
   - Produces deprecation warnings but these can be ignored - the installation succeeds.
   - May report vulnerabilities - these are in dependencies and do not affect functionality.

2. **Lint the code**:
   - `npm run lint` -- takes less than 1 second. Uses ESLint with custom rules.
   - Must pass before committing changes or CI will fail.

3. **Run tests**:
   - `npm run test` -- takes 1 second. NEVER CANCEL. Set timeout to 30+ minutes for safety.
   - Runs both unit tests (`npm run test:js`) and package validation (`npm run test:package`)
   - All tests must pass before committing.

4. **Run integration tests**:
   - `npm run test:integration` -- takes 44 seconds. NEVER CANCEL. Set timeout to 60+ minutes.
   - Creates temporary test environment with Redis and ioBroker infrastructure.
   - Expects network access to Bambulab servers (will show connection errors but adapter should start successfully).

### Translation Management
- `npm run translate` -- Updates translation files from base English text
- Automatically generates translations for admin UI in 10 languages
- Updates both io-package.json and admin/i18n/ translation files
- Run after making any text changes in admin configuration

### TypeScript Type Checking - KNOWN ISSUES
- `npm run check` -- Currently fails with 10 TypeScript errors. DO NOT expect this to pass.
- Issues include missing @tsconfig/node14 dependency and type mismatches in main.js and lib/converter.js.
- The project works despite these TypeScript errors since it's primarily JavaScript-based.
- TypeScript is used only for type checking, not compilation.

### Development Server
- `npm run statDev` -- Runs development server with file watching using @iobroker/dev-server.
- **IMPORTANT**: Requires initial setup with `dev-server setup` command before first use.
- Use this for live development and testing of adapter changes after setup.

## Manual Validation Scenarios

After making changes to the adapter, ALWAYS run these validation steps:

### Core Functionality Testing
1. **Adapter Startup**: Run `npm run test:integration` to verify the adapter can start without errors.
2. **Linting**: Run `npm run lint` to ensure code style compliance.
3. **All Tests**: Run `npm run test` to verify no regressions in existing functionality.

### Adapter-Specific Validation
When modifying adapter logic in main.js:
1. **MQTT Connection Logic**: Check that connection handling (lines 74-86) properly manages client state
2. **State Management**: Verify new states are defined in lib/state_attr.js with proper attributes
3. **Error Handling**: Ensure HMS error code translation logic works (requires network access)
4. **Control Commands**: Test control state changes trigger proper MQTT messages to printer

### Data Flow Validation
- **Incoming Data**: MQTT messages from printer should be processed via jsonExplorer
- **Outgoing Commands**: Control state changes should generate proper MQTT publish commands
- **State Creation**: New data points should automatically create ioBroker states with proper attributes

### Code Quality Validation
- **ALWAYS run `npm run lint` before committing** - CI will fail if linting errors exist.
- The project uses ESLint with tab indentation, single quotes, and semicolons.
- Prettier is configured for code formatting in VSCode.

### CI Pipeline Validation
- The project uses GitHub Actions for CI/CD (`.github/workflows/test-and-release.yml`).
- Tests run on Node.js 18.x, 20.x, 22.x across Ubuntu, Windows, and macOS.
- Deployment is automated when tags are pushed to main branch.

## Quick Reference - File Locations

### Most Frequently Modified Files
```
main.js                     - Core adapter logic and MQTT handling
lib/state_attr.js          - State definitions and attributes  
io-package.json            - Adapter metadata and configuration
admin/jsonConfig.json      - Admin UI configuration
README.md                  - Documentation updates
```

### Configuration Files (Usually Not Modified)
```
package.json               - Dependencies and npm scripts
.eslintrc.json            - Code style rules
tsconfig.json             - TypeScript configuration  
.github/workflows/        - CI/CD pipeline
```

### Generated/Build Files (Never Modify Directly)
```
package-lock.json         - Dependency lock file
node_modules/             - Installed dependencies
admin/i18n/               - Translation files (updated via npm run translate)
```

## Project Structure and Key Files

### Core Adapter Files
- **main.js** - Main adapter implementation (JavaScript)
- **lib/converter.js** - Utility functions for data conversion  
- **lib/state_attr.js** - State attribute definitions for ioBroker objects
- **lib/adapter-config.d.ts** - TypeScript type definitions for configuration

### Configuration and Admin
- **io-package.json** - ioBroker adapter metadata and configuration schema
- **admin/** - Admin UI configuration files
- **admin/jsonConfig.json** - Admin interface definition

### Build and Quality Tools
- **.eslintrc.json** - ESLint configuration (tab indentation, single quotes)
- **tsconfig.json** - TypeScript configuration (type checking only, no compilation)
- **tsconfig.check.json** - Stricter TypeScript checking for CI
- **.prettierrc.js** - Prettier code formatting rules

### Testing
- **test/** - Test files directory
- **main.test.js** - Basic unit tests
- **test/integration.js** - Integration tests with ioBroker infrastructure
- **test/mocharc.custom.json** - Mocha test configuration

## Common Development Tasks

### Adding New Features
1. Modify main.js for core adapter logic
2. Update lib/state_attr.js for new state definitions
3. Add tests in test/ directory following existing patterns
4. Run `npm run lint && npm run test` to validate changes
5. Test integration with `npm run test:integration`

### Updating Dependencies
- `npm install <package>` to add new dependencies
- Update package.json version when releasing
- Ensure package-lock.json is committed for reproducible builds

### Release Process
- `npm run release-dry` - Dry run of release process
- `npm run release` - Creates release (requires proper Git tags)
- Automated via GitHub Actions when version tags are pushed

## Common Issues and Solutions

### TypeScript Errors During Check
- **Expected**: `npm run check` fails with 10 errors - this is normal
- **Solution**: Focus on JavaScript correctness and rely on runtime testing
- **Workaround**: Modify tsconfig.json to extend "@tsconfig/node18" instead of "@tsconfig/node14"

### MQTT Connection Issues
- Adapter requires valid Bambulab printer credentials (IP, access token, serial number)
- Connection errors are expected in test environment without real printer
- Check main.js lines 500+ for MQTT client implementation

### Memory and Performance
- Integration tests create temporary Redis servers and ioBroker infrastructure
- Tests clean up automatically but may require manual cleanup if interrupted
- Monitor memory usage during long-running development sessions

## VSCode Configuration
The project includes optimal VSCode settings:
- **Recommended Extensions**: ESLint, Prettier
- **Auto-formatting**: Enabled on save with Prettier
- **Schema Validation**: JSON schemas for io-package.json and admin configuration

## Time Expectations
- **npm install**: 26 seconds (with npm cache)
- **npm run lint**: < 1 second  
- **npm run test**: 1 second
- **npm run test:integration**: 44 seconds
- **NEVER CANCEL** any build or test commands - always wait for completion

## Network Dependencies
- HMS error code translations from e.bambulab.com (optional, adapter works without)
- npm registry for dependency installation
- GitHub for Git operations and CI/CD