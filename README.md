# TRACE Flood Response

A responsive static web prototype based on the TRACE flood-response concept and the end-to-end route map. No build tools, package install, API keys, or third-party runtime services are required.

## Deploy with GitHub and Netlify

1. Download and unzip the project archive.
2. Create a GitHub repository and put the contents of this folder directly in the repository root. `index.html` and `netlify.toml` should be at the top level.
3. In Netlify, choose **Add new project → Import an existing project**, connect GitHub, and select the repository.
4. Netlify reads `netlify.toml`. The publish directory is `.` and there is no build command.
5. Deploy the site. Future pushes to the connected branch trigger new deploys.

You can also deploy the extracted folder with Netlify Drop for a quick preview. For continuous deployment, connect the GitHub repository.

### Git commands (optional)

Run these commands from the extracted project folder after creating an empty GitHub repository:

```sh
git init
git add .
git commit -m "Initial TRACE flood response prototype"
git branch -M main
git remote add origin https://github.com/YOUR-ACCOUNT/YOUR-REPOSITORY.git
git push -u origin main
```

## Interface

The interface uses a field-journal visual style with forest-green navigation, ivory surfaces, locally hosted DM Sans, an illustrated schematic map, and mobile bottom navigation. All five views support responsive layouts. Case records support keyboard activation and dialog focus management, and animations respect reduced-motion preferences. Typography licensing is included in `assets/dm-sans-LICENSE.txt`.

## Included

- Overview with synthetic exercise cases, priority queue, support totals, and a schematic East Dhaka coverage map.
- New household intake with consent checkbox, support needs, field note, and a keyword-based draft suggestion.
- Case queue with search and status filters.
- Human approval and manual routing to a response team, followed by delivered, follow-up, and close states.
- Response team workload cards and an end-to-end route-map / pilot roadmap screen.
- Local browser storage and online/offline indicator.
- Netlify publish and response-header configuration in `netlify.toml`.

## Prototype limits

- The intake suggestion is a local keyword-rule simulation, not an AI model.
- There is no backend, account system, shared city dashboard, live map, geolocation, messaging, or emergency dispatch.
- Seeded cases are synthetic. New entries are stored only in the current browser.
- Do not enter real personal or disaster-response data. Do not use this prototype to make or dispatch emergency decisions.

This is suitable for a public demo and product discussion. A real field pilot needs an authenticated backend, organization-level access controls, secure data storage and deletion, consent handling, tested offline sync, and operational approval from the response partners.
