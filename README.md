# NOVA Adapt Builder

SCORM build pipeline for NOVA™ Agentic Allied Defence Training Platform.

## What this does

NOVA generates doctrinally compliant DSAT training content as Adapt Framework JSON. This repo receives that JSON and automatically compiles it into SCORM-compliant HTML5 e-learning packages using GitHub Actions.

## How it works

1. NOVA's autonomous cycle analyses a Statement of Role and produces Training Objectives, Enabling Objectives, and Key Learning Points
2. NOVA structures this content as Adapt Framework JSON (course.json, contentObjects.json, articles.json, blocks.json, components.json)
3. The JSON is pushed to this repo under `courses/{course-id}/en/`
4. A GitHub Action automatically triggers, installs the Adapt Framework, copies the JSON, and runs a Grunt build
5. The compiled SCORM package is available as a downloadable artifact

## Output

- Responsive HTML5 e-learning
- SCORM 1.2 compliant (compatible with MOD Defence Learning Environment)
- WAI AA accessible
- Multi-device (desktop, tablet, mobile)

## Folder structure

```
nova-adapt-builder/
├── .github/workflows/build-course.yml   # GitHub Action
├── courses/{course-id}/en/              # NOVA-generated Adapt JSON
├── config/config.json                   # Default Adapt configuration
└── README.md
```

## Part of NOVA™

NOVA™ is the world's first Agentic Allied Defence Training Platform, automating the complete Defence Systems Approach to Training (DSAT) lifecycle with 100% compliance to JSP 822, DTSM, TRADOC, NATO Bi-SC 75-7, and S6000T.
