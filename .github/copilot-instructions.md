# ioBroker.bambulab Development Instructions

ioBroker.bambulab is a Node.js adapter for integrating Bambulab 3D printers into the ioBroker home automation platform. The adapter connects to Bambulab printers via MQTT to retrieve print data and control main printer functions.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Prerequisites and Setup
- Node.js version 20 or higher (engines requirement in package.json)
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

## MANDATORY Validation Workflow

**CRITICAL**: Before ANY commit or code change is finalized, you MUST run this validation sequence in order:

### Standard Validation Steps (ALWAYS Required)
1. **Linting** (FIRST - Always run first):
   ```bash
   npm run lint
   ```
   - **MUST PASS** - Zero tolerance for linting errors
   - CI will fail immediately if linting errors exist
   - Fix all errors before proceeding to next steps
   - Common fixes:
     - Remove unused parameters from catch blocks: `catch (error) {}` → `catch {}`
     - Add curly braces to single-line if statements
     - Follow ESLint rules: tab indentation, single quotes, semicolons

2. **Unit & Package Tests** (SECOND - After linting passes):
   ```bash
   npm run test
   ```
   - Runs `test:js` (unit tests) and `test:package` (package validation)
   - All 77 tests must pass (20 unit + 57 package validation)
   - Takes ~1 second to complete

3. **Integration Tests** (OPTIONAL - For adapter logic changes):
   ```bash
   npm run test:integration
   ```
   - Only run when modifying core adapter functionality
   - Takes ~44 seconds to complete
   - Verifies adapter starts correctly with ioBroker infrastructure

### Validation Order Summary
```
┌─────────────────────────────────────────────────────────┐
│  MANDATORY VALIDATION SEQUENCE (Before Every Commit)    │
├─────────────────────────────────────────────────────────┤
│  1. npm run lint          [MUST PASS - CI Blocker]     │
│  2. npm run test          [MUST PASS - 77 tests]       │
│  3. npm run test:integration [Optional - if needed]    │
└─────────────────────────────────────────────────────────┘
```

### Why This Order Matters
- **Linting first** catches syntax and style issues immediately (fastest feedback)
- **Tests second** verify functional correctness after code is syntactically valid
- **Integration last** performs expensive full-stack validation only when needed

### After making changes to the adapter, ALWAYS run these validation steps:

### Core Functionality Testing
1. **Linting**: Run `npm run lint` to ensure code style compliance - MUST PASS.
2. **All Tests**: Run `npm run test` to verify no regressions in existing functionality.
3. **Adapter Startup**: Run `npm run test:integration` to verify the adapter can start without errors (optional).

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
lib/state_attr.js          - State definitions and attributes, definition of allowed roles to be used available at https://github.com/ioBroker/ioBroker.docs/blob/master/docs/en/dev/stateroles.md
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
package-lock.json         - Dependency lock file, must always be in sync with package.json by executing npm i before commit
node_modules/             - Installed dependencies
admin/i18n/               - Translation files (updated via npm run translate)
```

## Project Structure and Key Files

### Core Adapter Files
- **main.js** - Main adapter implementation (JavaScript)
- **lib/converter.js** - Utility functions for data conversion  
- **lib/state_attr.js** - State attribute definitions for ioBroker objects, definition of allowed roles to be used available at https://github.com/ioBroker/ioBroker.docs/blob/master/docs/en/dev/stateroles.md
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
4. **Run mandatory validation sequence**:
   ```bash
   npm run lint    # MUST PASS first
   npm run test    # MUST PASS second
   ```
5. Test integration with `npm run test:integration` (if adapter logic changed)
6. Update readme entry with reference to issue #xxx and user friendly short description of the fix

### Common Linting Fixes
When `npm run lint` fails, apply these common fixes:

1. **Empty catch blocks with unused error parameter**:
   ```javascript
   // ❌ Wrong - unused parameter
   try {
       doSomething();
   } catch (error) {}
   
   // ✅ Correct - remove parameter, add comment
   try {
       doSomething();
   } catch {
       // Ignore errors if data not available
   }
   ```

2. **Missing curly braces on if statements**:
   ```javascript
   // ❌ Wrong - no braces
   if (condition) return value;
   
   // ✅ Correct - add braces
   if (condition) {
       return value;
   }
   ```

3. **Unused variables**:
   - Remove unused variables or prefix with underscore: `_unused`
   - Or use the value: log it, return it, or pass it along

4. **Code style issues**:
   - Use tabs for indentation (not spaces)
   - Use single quotes for strings (not double quotes)
   - Add semicolons at end of statements

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

### State value to set for "xxx" has to be type "xxx" but received type "xxx"
- Log shows error like: State value to set for "bambulab.0.00M09A3B1400374.ams.ams.0.info" has to be type "number" but received type "string"
- This means a wrong definition of the state "type" is set in lib/state_attr.js and should be adjust to "has to be type "xxx" were xxx defines the proper type and but received type "xxx" show the current defined type


### xxx unknown, send this information to the developer ==> xxx : xxx
- for each data type a definition must be added to stateAttr.js
- the information behind log information "==>" is relevant as it means "stateName" : value
- must result in a new entry in stateAttr.js to define this state
- Example error & solution: reactivePower unknown, send this information to the developer ==> reactivePower : 0
```
reactivePower: {
    name: 'Zählerstand Bezug Gesamt',
    type: 'number',
    role: 'value.power.consumption',
    unit: 'kWh',
    factor: 10000000000,
},
```
- Always ensure "role" definitions is according to ioBroker documentation: https://github.com/ioBroker/ioBroker.docs/blob/master/docs/en/dev/stateroles.md
- Always ensure the type is in line with the value, if multiple types are known by issue use "mixed". typedytector can be used to support this: https://github.com/ioBroker/ioBroker.type-detector
- Try to add a user friendly name descrbing purpose of the state, use web/documentation or API reference for proper information
