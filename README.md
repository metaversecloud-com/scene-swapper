# Scene Swapper

## Introduction / Summary

Scene Swapper is an on-canvas application allowing users to swap scenes by clicking on the key asset.

## Key Features

### Canvas elements & interactions

- Key Asset: When clicked this asset will automatically swap the current scene for another one.

### Data objects

- Key Asset: the data object attached to the dropped key asset stores the default and currently displayed scene.

## Environment Variables

Create a `.env` file in the root directory. See `.env-example` for a template.

| Variable               | Description                                                                        | Required |
| ---------------------- | ---------------------------------------------------------------------------------- | -------- |
| `NODE_ENV`             | Node environment                                                                   | No       |
| `SKIP_PREFLIGHT_CHECK` | Skip CRA preflight check                                                           | No       |
| `INSTANCE_DOMAIN`      | Topia API domain (`api.topia.io` for production, `api-stage.topia.io` for staging) | Yes      |
| `INTERACTIVE_KEY`      | Topia interactive app key                                                          | Yes      |
| `INTERACTIVE_SECRET`   | Topia interactive app secret                                                       | Yes      |

## Developers

### Built With

#### Server

![Node.js](https://img.shields.io/badge/node.js-%2343853D.svg?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/express-%23000000.svg?style=for-the-badge&logo=express&logoColor=white)

### Add your .env environmental variables

See [Environment Variables](#environment-variables) above.

### Where to find INTERACTIVE_KEY and INTERACTIVE_SECRET

[Topia Dev Account Dashboard](https://dev.topia.io/t/dashboard/integrations)

[Topia Production Account Dashboard](https://topia.io/t/dashboard/integrations)

### Implementation Requirements

The `SCENE_IDS` environment variable should contain a comma-separated list of scene IDs that the asset will cycle through when clicked.

### Helpful links

- [SDK Developer docs](https://metaversecloud-com.github.io/mc-sdk-js/index.html)
