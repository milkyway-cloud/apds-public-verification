# APDS external consumer verification

This repository verifies publicly published APDS packages against the matching public Storybook MCP. It uses standard GitHub-hosted Linux runners and public npm packages.

The two consumer applications were written in a separate AI session using the installed documentation and public API. The cloud job independently installs their locked dependencies, reads the public MCP without credentials, checks package versions and npm integrity values, and downloads the matching SaveButton example.

The downloaded example is type-checked, built and executed without editing its source. Browser checks cover loading, duplicate submission prevention, failure and retry, list search, read-only comparison data, sharing validation and mobile layout.

Persistence and permissions use local test functions. The job does not update a production service.

Run logs and the `external-verification-results` artifact contain the results and screenshots. `releases.json` records the exact Storybook and MCP URLs used by each package version.
